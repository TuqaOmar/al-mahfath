export function hasRole(user, roleName) {
  if (!user) return false;
  return user.role === roleName || user.roles?.[roleName] === true;
}

export function isAdmin(user) {
  return hasRole(user, 'admin');
}

export function isTeacher(user) {
  return hasRole(user, 'teacher');
}

export function canActAsTeacher(user, teacherId) {
  if (!user?.uid || !teacherId) return false;
  return isAdmin(user) || (isTeacher(user) && user.uid === teacherId);
}

export function teacherOwnsGroup(groups, teacherId, groupId) {
  if (!teacherId || !groupId || !Array.isArray(groups)) return false;
  return groups.some(group => group.id === groupId && group.teacherId === teacherId);
}

export function isActiveTeacherMembership(group, membership, studentId, teacherId) {
  return Boolean(group && membership && studentId && teacherId &&
    typeof studentId === 'string' && !studentId.includes('/') &&
    membership.uid === studentId && membership.status === 'active' &&
    typeof membership.groupId === 'string' && membership.groupId.length > 0 && !membership.groupId.includes('/') &&
    group.id === membership.groupId && group.active !== false &&
    group.teacherId === teacherId && membership.teacherId === teacherId);
}

export function teacherCanAccessStudent(groups, membership, teacherId, studentId = membership?.uid) {
  return Array.isArray(groups) && groups.some(group =>
    isActiveTeacherMembership(group, membership, studentId, teacherId));
}
