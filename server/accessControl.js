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

export function teacherCanAccessStudent(groups, student, teacherId) {
  if (!student || !teacherId) return false;
  if (student.teacherId === teacherId) return true;
  return teacherOwnsGroup(groups, teacherId, student.groupId);
}
