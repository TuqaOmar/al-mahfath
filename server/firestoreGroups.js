import { randomBytes } from 'node:crypto';
import { db } from './middleware/auth.js';
import { activeTeacherMembers, requireTeacherStudent } from './teacherScope.js';
import { hasRole, isAdmin, isActiveTeacherMembership } from './accessControl.js';

export class GroupError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new GroupError(status, message); };
export const docData = snapshot => ({ ...snapshot.data(), id: snapshot.id });
export function publicUser(snapshot) {
  const { passwordHash, salt, ...user } = snapshot.data();
  return { ...user, uid: snapshot.id, memorizedPages: null, memorizedPagesCount: null,
    totalJuz: null, memoryScore: null,
    verifiedMemorizedPages: null, verifiedMemorizationSource: 'unavailable_no_page_approval_workflow' };
}

export async function listUsers() {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(publicUser);
}

export async function listGroups(teacherId) {
  let query = db.collection('groups');
  if (teacherId) query = query.where('teacherId', '==', teacherId);
  const [groupsSnapshot, membershipsSnapshot] = await Promise.all([
    query.get(), db.collection('memberships').get()
  ]);
  const activeCounts = new Map();
  const groupMap = new Map(groupsSnapshot.docs.map(group => [group.id, { ...group.data(), id: group.id }]));
  for (const membership of membershipsSnapshot.docs) {
    const data = membership.data();
    if (!isActiveTeacherMembership(groupMap.get(data.groupId), data, membership.id, data.teacherId)) continue;
    activeCounts.set(data.groupId, (activeCounts.get(data.groupId) || 0) + 1);
  }
  return groupsSnapshot.docs.map(snapshot => ({
    ...docData(snapshot),
    // Membership documents are authoritative. The stored counter is only an
    // atomic capacity hint and may be stale in imported/legacy group records.
    studentsCount: activeCounts.get(snapshot.id) || 0
  }));
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
          !member.exists) fail(403, 'لا تملك صلاحية نقل هذا الطالب');
      await requireTeacherStudent(actor.uid, uid, tx);
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
    const joinedAt = sameGroup && member.exists ? member.data().joinedAt || member.data().updatedAt || now : now;
    if (group) tx.set(memberRef, { uid, groupId, teacherId: group.teacherId, status: 'active', joinedAt, updatedAt: now });
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

export async function teacherStudents(teacherId, { search = '', filter = 'all', sort = 'name', groupId } = {}) {
  const activeMembers = await activeTeacherMembers(teacherId, { groupId });
  if (!activeMembers.length) return [];
  const docs = await db.getAll(...activeMembers.map(member => db.doc(`users/${member.id}`)));
  let students = docs.filter(doc => doc.exists).map(doc => {
    const data = doc.data();
    // consistencyRate and thisWeekSessions are denormalized cache fields that may be absent.
    // Return null when missing so callers can distinguish "not computed" from zero.
    const consistencyRate = data.consistencyRate != null ? Number(data.consistencyRate) : null;
    const thisWeekSessions = data.thisWeekSessions != null ? Number(data.thisWeekSessions) : null;
    return {
      ...publicUser(doc),
      memorizedJuz: null,
      consistencyRate,
      thisWeekSessions,
      currentSurah: data.currentSurah || null,
      status: data.status || 'active',
      lastRecitationDate: data.lastRecitationDate || ''
    };
  });
  const term = String(search).trim().toLowerCase();
  if (term) students = students.filter(s => `${s.name || ''} ${s.email || ''}`.toLowerCase().includes(term));
  if (filter !== 'all') students = students.filter(s => s.status === filter);
  students.sort((a, b) => sort === 'memorization' ? String(a.name || '').localeCompare(String(b.name || ''), 'ar') :
    sort === 'consistency' ? (b.consistencyRate ?? -1) - (a.consistencyRate ?? -1) :
    sort === 'last_recitation' ? b.lastRecitationDate.localeCompare(a.lastRecitationDate) :
    String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
  return students;
}
