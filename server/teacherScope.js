import { db } from './middleware/auth.js';
import { isActiveTeacherMembership } from './accessControl.js';

const denied = () => {
  const error = new Error('الطالب ليس عضوًا نشطًا في حلقة معيّنة لهذا المعلم');
  error.status = 403;
  throw error;
};
const read = (reader, ref) => reader === db ? ref.get() : reader.get(ref);

// Membership identity and the CURRENT group owner are authoritative. User
// profile pointers and historical session/note teacher IDs never grant access.
export async function requireTeacherStudent(teacherId, studentId, reader = db) {
  if (typeof studentId !== 'string' || !studentId || studentId.includes('/')) denied();
  const member = await read(reader, db.doc(`memberships/${studentId}`));
  if (!member.exists || typeof member.data().groupId !== 'string' || !member.data().groupId || member.data().groupId.includes('/')) denied();
  const group = await read(reader, db.doc(`groups/${member.data().groupId}`));
  if (!group.exists || !isActiveTeacherMembership({ ...group.data(), id: group.id }, member.data(), studentId, teacherId)) denied();
  return { ...member.data(), id: member.id };
}

export async function activeTeacherMembers(teacherId, { groupId } = {}) {
  const [groups, members] = await Promise.all([
    db.collection('groups').where('teacherId', '==', teacherId).get(),
    db.collection('memberships').where('teacherId', '==', teacherId).get()
  ]);
  const owned = new Map(groups.docs.map(group => [group.id, { ...group.data(), id: group.id }]));
  if (groupId && (!owned.has(groupId) || owned.get(groupId).active === false)) denied();
  return members.docs.filter(member => (!groupId || member.data().groupId === groupId) &&
    isActiveTeacherMembership(owned.get(member.data().groupId), member.data(), member.id, teacherId))
    .map(member => ({ ...member.data(), id: member.id }));
}
