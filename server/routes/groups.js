import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { db, requireAuth, requireAdmin } from '../middleware/auth.js';
import { canActAsTeacher, isAdmin, hasRole } from '../accessControl.js';
import { readPracticeStats, readPracticeHistory } from '../firestoreRecitation.js';
import {
  GroupError, listUsers, listGroups, findGroup, createFirestoreGroup, setMembership,
  submitRequest, listRequests, changeTeacherRole, teacherStudents, publicUser
} from '../firestoreGroups.js';

const router = Router();
const route = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (error) {
    if (!(error instanceof GroupError)) console.error('Firestore group operation failed:', error.message);
    const expected = error instanceof GroupError;
    res.status(expected ? error.status : 503).json({ success: false, message: expected ? error.message : 'تعذر حفظ أو قراءة بيانات الحلقات؛ أعد المحاولة' });
  }
};
const teacherScope = (req, res, next) => {
  if (!canActAsTeacher(req.user, req.params.teacherId)) return res.status(403).json({ success: false, message: 'Forbidden: Teacher scope required' });
  next();
};
const success = (res, result = {}) => res.json({ success: true, ...result });

router.get('/groups', requireAuth, route(async (req, res) => {
  const { teacherId } = req.query;
  if (teacherId ? !canActAsTeacher(req.user, teacherId) : !isAdmin(req.user)) throw new GroupError(403, 'Forbidden: Group scope required');
  const groups = await listGroups(teacherId);
  success(res, { groups, count: groups.length });
}));
router.get('/groups/lookup', route(async (req, res) => {
  const group = await findGroup(req.query.code);
  // Public invitation lookup exposes no roster or learner data.
  const { id, name, code, teacherId, teacherName, targetJuz, description } = group;
  success(res, { group: { id, name, code, teacherId, teacherName, targetJuz, description } });
}));
router.post('/groups/join', requireAuth, route(async (req, res) => {
  const group = await findGroup(req.body.code);
  success(res, { ...await setMembership(req.user.uid, group.id, { actor: req.user }), message: 'تم الانضمام للحلقة' });
}));
router.post('/groups/leave', requireAuth, route(async (req, res) => {
  success(res, { ...await setMembership(req.user.uid, null, { actor: req.user }), message: 'تم الخروج من الحلقة' });
}));
router.post('/admin/groups/create', requireAuth, requireAdmin, route(async (req, res) => {
  success(res, { group: await createFirestoreGroup(req.body), message: 'تم إنشاء الحلقة' });
}));
router.get('/admin/users', requireAuth, requireAdmin, route(async (req, res) => {
  success(res, { users: await listUsers() });
}));
router.get('/admin/safar-users', requireAuth, requireAdmin, route(async (req, res) => {
  let users = await listUsers();
  const search = String(req.query.search || '').toLowerCase();
  if (search) users = users.filter(u => `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(search));
  const filter = req.query.filter;
  if (filter === 'teacher') users = users.filter(u => hasRole(u, 'teacher'));
  if (filter === 'student') users = users.filter(u => u.isSafarMember);
  success(res, { users, count: users.length });
}));
router.get('/admin/overview', requireAuth, requireAdmin, route(async (req, res) => {
  const [users, groups] = await Promise.all([listUsers(), listGroups()]);
  const stats = { totalUsers: users.length, totalRegisteredUsers: users.length, safarMembers: users.filter(u => u.isSafarMember).length,
    teachersCount: users.filter(u => hasRole(u, 'teacher')).length, groupsCount: groups.length,
    independentUsers: users.filter(u => !u.isSafarMember).length };
  success(res, { ...stats, stats });
}));
for (const [endpoint, enabled] of [['assign-teacher', true], ['remove-teacher', false]]) {
  router.post(`/admin/${endpoint}`, requireAuth, requireAdmin, route(async (req, res) => {
    if (!req.body.uid) throw new GroupError(400, 'معرف الحساب مطلوب');
    success(res, { user: await changeTeacherRole(req.body.uid, enabled), message: 'تم تحديث الدور' });
  }));
}
router.post('/admin/create-teacher', requireAuth, requireAdmin, route(async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) throw new GroupError(400, 'اسم المعلم والبريد الإلكتروني مطلوبان');
  // Existing registered Firebase identity only: never create an un-loginable JSON identity.
  let account;
  try { account = await getAuth().getUserByEmail(String(email).trim().toLowerCase()); }
  catch (error) { if (error.code === 'auth/user-not-found') throw new GroupError(404, 'يجب تسجيل الحساب أولًا ثم تعيينه معلمًا'); throw error; }
  success(res, { teacher: await changeTeacherRole(account.uid, true), message: 'تم تعيين الحساب معلمًا' });
}));
router.get('/teacher/:teacherId/students', requireAuth, teacherScope, route(async (req, res) => {
  const students = await teacherStudents(req.params.teacherId, req.query);
  success(res, { students, count: students.length });
}));
router.get('/teacher/:teacherId/student/:studentId', requireAuth, teacherScope, route(async (req, res) => {
  const member = await db.doc(`memberships/${req.params.studentId}`).get();
  if (!isAdmin(req.user) && (!member.exists || member.data().teacherId !== req.params.teacherId)) throw new GroupError(403, 'الطالب غير معيّن لهذا المعلم');
  const student = await db.doc(`users/${req.params.studentId}`).get();
  if (!student.exists) throw new GroupError(404, 'حساب الطالب غير موجود');
  const [recitationStats, recentSessions, ayahProgress] = await Promise.all([
    readPracticeStats(req.params.studentId), readPracticeHistory(req.params.studentId, { limit: 10 }),
    db.collection(`users/${req.params.studentId}/ayah_progress`).get()
  ]);
  const recordedProgress = ayahProgress.docs.reduce((summary, item) => {
    const status = item.data().status;
    summary.total += 1;
    if (status in summary) summary[status] += 1;
    if (!summary.updatedAt || item.data().updatedAt > summary.updatedAt) summary.updatedAt = item.data().updatedAt;
    return summary;
  }, { total: 0, memorized: 0, learning: 0, review: 0, unmemorized: 0, updatedAt: null });
  const preferences = student.data().preferences || {};
  const learningPlan = {
    unitType: preferences.unitType || null, planCreatorMode: preferences.planCreatorMode || null,
    dailyTarget: preferences.dailyTarget || null, manualNewTarget: preferences.manualNewTarget || null,
    manualOldReviewTarget: preferences.manualOldReviewTarget || null,
    oldReviewDailyTarget: preferences.oldReviewDailyTarget || null
  };
  success(res, { student: { ...publicUser(student), memorizedJuz: student.data().totalJuz || 0,
    recitationStats, recentSessions, recordedProgress, learningPlan } });
}));
router.get('/teacher/:teacherId/dashboard', requireAuth, teacherScope, route(async (req, res) => {
  const [students, teacher] = await Promise.all([teacherStudents(req.params.teacherId), db.doc(`users/${req.params.teacherId}`).get()]);
  success(res, { teacher: teacher.exists ? publicUser(teacher) : { uid: req.params.teacherId },
    stats: { studentsCount: students.length, activeThisWeek: students.filter(s => s.thisWeekSessions > 0).length,
      weeklyCommitment: students.length ? Math.round(students.reduce((sum, s) => sum + s.consistencyRate, 0) / students.length) : 0,
      needsAttentionCount: students.filter(s => s.status === 'needs_attention').length },
    studentsWhoNeedAttention: students.filter(s => s.status === 'needs_attention'), smartInsights: [], recentActivities: [] });
}));
router.get('/teacher/:teacherId/available-students', requireAuth, teacherScope, route(async (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  const students = (await listUsers()).filter(u => !u.groupId && !hasRole(u, 'teacher') && !hasRole(u, 'admin') &&
    `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(search));
  success(res, { students, count: students.length });
}));
for (const endpoint of ['enroll-student', 'add-student']) {
  router.post(`/teacher/:teacherId/${endpoint}`, requireAuth, teacherScope, route(async (req, res) => {
    let uid = req.body.studentUid;
    if (!uid && req.body.email) {
      const matches = await db.collection('users').where('email', '==', String(req.body.email).trim().toLowerCase()).limit(2).get();
      if (matches.size !== 1) throw new GroupError(404, 'يجب أن يكون للطالب حساب مسجل');
      uid = matches.docs[0].id;
    }
    const groupId = req.body.groupId || (await listGroups(req.params.teacherId))[0]?.id;
    if (!groupId) throw new GroupError(400, 'لا توجد حلقة لهذا المعلم');
    success(res, { ...await setMembership(uid, groupId, { actor: req.user, teacherId: req.params.teacherId }), message: 'تم إلحاق الطالب' });
  }));
}
router.post('/admin/distribute-student', requireAuth, requireAdmin, route(async (req, res) => {
  if (!req.body.groupId) throw new GroupError(400, 'معرف الحلقة مطلوب');
  success(res, { ...await setMembership(req.body.studentUid, req.body.groupId, { actor: req.user, teacherId: req.body.teacherId }), message: 'تم نقل الطالب' });
}));
router.post('/safar/enrollment-request', requireAuth, route(async (req, res) => {
  success(res, { request: await submitRequest(req.user, req.body), message: 'تم إرسال طلب الانضمام' });
}));
router.get('/admin/enrollment-requests', requireAuth, requireAdmin, route(async (req, res) => {
  const requests = await listRequests();
  success(res, { requests, count: requests.length });
}));
router.post('/admin/enrollment-requests/approve', requireAuth, requireAdmin, route(async (req, res) => {
  const { requestId, groupId, teacherId } = req.body;
  if (!requestId || !groupId) throw new GroupError(400, 'معرف الطلب والحلقة مطلوبان');
  const request = await db.doc(`enrollmentRequests/${requestId}`).get();
  if (!request.exists) throw new GroupError(404, 'الطلب غير موجود');
  success(res, { ...await setMembership(request.data().submittedBy, groupId, { actor: req.user, requestId, teacherId }), message: 'تم قبول الطلب' });
}));

export default router;
