import { randomBytes } from 'node:crypto';
import { db } from './middleware/auth.js';
import { hasRole, isAdmin } from './accessControl.js';

export class GroupError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new GroupError(status, message); };
export const docData = snapshot => ({ ...snapshot.data(), id: snapshot.id });
export function publicUser(snapshot) {
  const { passwordHash, salt, ...user } = snapshot.data();
  return { ...user, uid: snapshot.id };
}

export async function listUsers() {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(publicUser);
}

export async function listGroups(teacherId) {
  let query = db.collection('groups');
  if (teacherId) query = query.where('teacherId', '==', teacherId);
  return (await query.get()).docs.map(docData);
}

export async function findGroup(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,64}$/.test(normalized)) fail(400, 'رمز الحلقة غير صالح');
  // Single-field query also supports existing Firestore groups without migration.
  const snapshot = await db.collection('groups').where('code', '==', normalized).limit(2).get();
  if (snapshot.size > 1) fail(409, 'رمز الحلقة غير فريد؛ يرجى مراجعة الإدارة');
  if (snapshot.empty) fail(404, 'لم يتم العثور على حلقة بهذا الرمز');
  const group = docData(snapshot.docs[0]);
  if (group.active === false) fail(409, 'الحلقة غير متاحة للانضمام');
  return group;
}

export async function createFirestoreGroup({ name, teacherId, targetJuz, description }) {
  if (!String(name || '').trim() || !teacherId) fail(400, 'اسم الحلقة ومعرف المعلم مطلوبان');
  const groupRef = db.collection('groups').doc();
  const code = randomBytes(6).toString('hex').toUpperCase();
  return db.runTransaction(async tx => {
    const teacher = await tx.get(db.doc(`users/${teacherId}`));
    const inviteRef = db.doc(`groupInvites/${code}`);
    const invite = await tx.get(inviteRef);
    if (!teacher.exists || !hasRole(teacher.data(), 'teacher')) fail(400, 'الحساب ليس معلمًا مسجلًا');
    if (invite.exists) fail(409, 'تعذر إنشاء رمز فريد؛ أعد المحاولة');
    const group = {
      name: String(name).trim(), teacherId, teacherName: teacher.data().name || '', code,
      targetJuz: String(targetJuz || ''), description: String(description || ''),
      studentsCount: 0, active: true, createdAt: new Date().toISOString()
    };
    tx.create(groupRef, group);
    tx.create(inviteRef, { groupId: groupRef.id });
    return { ...group, id: groupRef.id };
  });
}

// One active membership per learner. Membership, user authorization pointers,
// group counts, and request approval commit together or all remain unchanged.
export async function setMembership(uid, groupId, { actor, requestId, teacherId } = {}) {
  if (!uid) fail(400, 'معرف الطالب مطلوب');
  return db.runTransaction(async tx => {
    const userRef = db.doc(`users/${uid}`);
    const memberRef = db.doc(`memberships/${uid}`);
    const user = await tx.get(userRef);
    const member = await tx.get(memberRef);
    const requestRef = requestId ? db.doc(`enrollmentRequests/${requestId}`) : null;
    const request = requestRef ? await tx.get(requestRef) : null;
    if (!user.exists) fail(404, 'حساب الطالب غير موجود');
    if (request && (!request.exists || request.data().submittedBy !== uid)) fail(404, 'طلب الانضمام غير موجود');
    if (request && request.data().status !== 'pending') {
      if (request.data().status === 'approved' && request.data().groupId === groupId) return { groupId, alreadyApproved: true };
      fail(409, 'تمت معالجة الطلب سابقًا');
    }
    const oldId = member.exists ? member.data().groupId : null;
    const groupRef = groupId ? db.doc(`groups/${groupId}`) : null;
    const oldRef = oldId && oldId !== groupId ? db.doc(`groups/${oldId}`) : null;
    const groupDoc = groupRef ? await tx.get(groupRef) : null;
    const oldDoc = oldRef ? await tx.get(oldRef) : null;
    if (groupDoc && (!groupDoc.exists || groupDoc.data().active === false)) fail(404, 'الحلقة غير متاحة');
    const group = groupDoc ? docData(groupDoc) : null;
    const teacher = group ? await tx.get(db.doc(`users/${group.teacherId}`)) : null;
    if (group && (!teacher.exists || !hasRole(teacher.data(), 'teacher'))) fail(409, 'معلم الحلقة غير متاح');
    if (teacherId && group?.teacherId !== teacherId) fail(400, 'المعلم المحدد لا يطابق معلم الحلقة');
    if (actor && !isAdmin(actor) && actor.uid !== uid) {
      if (!hasRole(actor, 'teacher') || group?.teacherId !== actor.uid ||
          (user.data().teacherId && user.data().teacherId !== actor.uid)) fail(403, 'لا تملك صلاحية نقل هذا الطالب');
    }
    const sameGroup = oldId === groupId;
    if (group && !sameGroup && group.maxStudents && (group.studentsCount || 0) >= group.maxStudents) fail(409, 'الحلقة مكتملة');
    const now = new Date().toISOString();
    const pointers = {
      groupId: group?.id || null, groupName: group?.name || null,
      teacherId: group?.teacherId || null, teacherName: teacher?.data()?.name || null,
      isSafarMember: Boolean(group)
    };
    tx.update(userRef, pointers);
    if (group) tx.set(memberRef, { uid, groupId, teacherId: group.teacherId, status: 'active', updatedAt: now });
    else tx.delete(memberRef);
    if (oldDoc?.exists) tx.update(oldRef, { studentsCount: Math.max(0, (oldDoc.data().studentsCount || 0) - 1) });
    if (group && !sameGroup) tx.update(groupRef, { studentsCount: (group.studentsCount || 0) + 1 });
    if (requestRef) tx.update(requestRef, { status: 'approved', groupId, teacherId: group.teacherId, approvedBy: actor.uid, approvedAt: now });
    return { ...pointers, group: group ? { ...group, studentsCount: (group.studentsCount || 0) + (sameGroup ? 0 : 1) } : null };
  });
}

export async function submitRequest(user, input) {
  const ref = db.doc(`enrollmentRequests/${user.uid}`);
  return db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists && existing.data().status === 'pending') return docData(existing);
    const data = {
      submittedBy: user.uid, name: user.profile.name || '', email: user.email || user.profile.email || '',
      phone: String(input.phone || ''), notes: String(input.notes || ''),
      memorizedJuz: Number(input.memorizedJuz) || 0, dailyGoal: String(input.dailyGoal || ''),
      preferredTime: String(input.preferredTime || ''), preferredLevel: String(input.preferredLevel || ''),
      requestDate: new Date().toISOString(), status: 'pending'
    };
    tx.set(ref, data);
    return { ...data, id: ref.id };
  });
}

export async function listRequests() {
  return (await db.collection('enrollmentRequests').get()).docs.map(docData);
}

export async function changeTeacherRole(uid, enabled) {
  return db.runTransaction(async tx => {
    const ref = db.doc(`users/${uid}`);
    const user = await tx.get(ref);
    if (!user.exists) fail(404, 'الحساب غير موجود');
    const owned = await tx.get(db.collection('groups').where('teacherId', '==', uid));
    if (!enabled && !owned.empty) fail(409, 'انقل الحلقات قبل إزالة دور المعلم');
    const data = user.data();
    const roles = { ...(data.roles || {}), user: true, teacher: enabled };
    if (data.role === 'admin') roles.admin = true;
    const role = roles.admin ? 'admin' : enabled ? 'teacher' : 'user';
    tx.update(ref, { roles, role });
    return { uid, roles, role };
  });
}

export async function teacherStudents(teacherId, { search = '', filter = 'all', sort = 'name' } = {}) {
  const members = await db.collection('memberships').where('teacherId', '==', teacherId).get();
  if (members.empty) return [];
  const docs = await db.getAll(...members.docs.map(member => db.doc(`users/${member.id}`)));
  let students = docs.filter(doc => doc.exists).map(doc => ({
    ...publicUser(doc), memorizedJuz: doc.data().totalJuz || 0,
    consistencyRate: doc.data().consistencyRate || 0, status: doc.data().status || 'active',
    lastRecitationDate: doc.data().lastRecitationDate || '', thisWeekSessions: doc.data().thisWeekSessions || 0
  }));
  const term = String(search).trim().toLowerCase();
  if (term) students = students.filter(s => `${s.name || ''} ${s.email || ''}`.toLowerCase().includes(term));
  if (filter !== 'all') students = students.filter(s => s.status === filter);
  students.sort((a, b) => sort === 'memorization' ? b.memorizedJuz - a.memorizedJuz :
    sort === 'consistency' ? b.consistencyRate - a.consistencyRate :
    sort === 'last_recitation' ? b.lastRecitationDate.localeCompare(a.lastRecitationDate) :
    String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
  return students;
}
