import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { db, requireAuth, requireAdmin } from '../middleware/auth.js';
import { canActAsTeacher, isAdmin, hasRole } from '../accessControl.js';
import { readPracticeStats, readPracticeHistory, reviewPracticeSession } from '../firestoreRecitation.js';
import { activityNow, ammanDateKey, daysSinceQuranActivity } from '../quranActivityStreak.js';
import {
  GroupError, listUsers, listGroups, findGroup, createFirestoreGroup, setMembership,
  submitRequest, listRequests, changeTeacherRole, teacherStudents, publicUser, docData
} from '../firestoreGroups.js';

import { activeTeacherMembers, requireTeacherStudent } from '../teacherScope.js';
import { sendPush } from '../pushNotifications.js';

const router = Router();
const route = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (error) {
    if (!(error instanceof GroupError)) console.error('Firestore group operation failed:', error.message);
    const expected = error instanceof GroupError || Number.isInteger(error.status);
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
  // status matches overview.activeThisWeek: a confirmed Quran activity within the last 7 Amman days.
  const now = activityNow();
  const users = (await listUsers()).map(user => {
    const days = daysSinceQuranActivity(user, now);
    return { ...user, status: days !== null && days < 7 ? 'active' : 'inactive' };
  });
  success(res, { users });
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
  const [users, groups, membershipsSnapshot, sessionsSnapshot] = await Promise.all([
    listUsers(), listGroups(), db.collection('memberships').get(), db.collectionGroup('recitation_sessions').get()
  ]);
  const now = activityNow();
  const dayNumber = value => {
    const key = /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : ammanDateKey(value);
    const [year, month, day] = key.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  };
  const today = dayNumber(ammanDateKey(now));
  const withinDays = (value, days) => {
    if (!value) return false;
    try { const difference = today - dayNumber(value); return difference >= 0 && difference < days; }
    catch { return false; }
  };
  const activeMemberships = membershipsSnapshot.docs.map(docData).filter(item => item.status === 'active' && item.groupId);
  const sessions = sessionsSnapshot.docs.map(docData);
  const activeUsersWeek = new Set(users.filter(user => withinDays(user.lastQuranActivityDate, 7)).map(user => user.uid));
  const activeGroupIds = new Set(activeMemberships.filter(member => activeUsersWeek.has(member.uid)).map(member => member.groupId));
  const reviewedTeachers = new Set(sessions.filter(session => session.reviewedBy && withinDays(session.reviewedAt, 7)).map(session => session.reviewedBy));
  const stats = { totalUsers: users.length, totalRegisteredUsers: users.length, safarMembers: users.filter(u => u.isSafarMember).length,
    teachersCount: users.filter(u => hasRole(u, 'teacher')).length, groupsCount: groups.length,
    independentUsers: users.filter(u => !u.isSafarMember).length };
  const realTimeActivity = {
    activeToday: users.filter(user => withinDays(user.lastQuranActivityDate, 1)).length,
    activeThisWeek: activeUsersWeek.size,
    newRegistrationsWeek: users.filter(user => withinDays(user.createdAt, 7)).length,
    newGroupJoinsWeek: activeMemberships.filter(member => withinDays(member.updatedAt, 7)).length,
    activeTeachers: reviewedTeachers.size,
    activeGroups: activeGroupIds.size,
    weeklyActivities: sessions.filter(session => withinDays(session.createdAt, 7)).length,
    monthlyActivities: sessions.filter(session => withinDays(session.createdAt, 30)).length,
    generatedAt: now.toISOString(),
    timeZone: 'Asia/Amman'
  };
  success(res, { ...stats, stats, realTimeActivity });
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
  if (!isAdmin(req.user)) await requireTeacherStudent(req.params.teacherId, req.params.studentId);
  const student = await db.doc(`users/${req.params.studentId}`).get();
  if (!student.exists) throw new GroupError(404, 'حساب الطالب غير موجود');
  const [recitationStats, recentSessions, ayahProgress, membership] = await Promise.all([
    readPracticeStats(req.params.studentId), readPracticeHistory(req.params.studentId, { limit: 10 }),
    db.collection(`users/${req.params.studentId}/ayah_progress`).get(),
    db.doc(`memberships/${req.params.studentId}`).get()
  ]);
  // Older memberships predate joinedAt; their last write (updatedAt) or the account creation is the best fallback.
  const joinedDate = membership.data()?.joinedAt || membership.data()?.updatedAt || student.data().createdAt || null;
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
  success(res, { student: { ...publicUser(student), memorizedJuz: null, joinedDate,
    recitationStats, recentSessions, recordedProgress, learningPlan } });
}));
router.patch('/teacher/:teacherId/student/:studentId/sessions/:sessionId/review', requireAuth, teacherScope, route(async (req, res) => {
  if (req.user.uid !== req.params.teacherId || !hasRole(req.user, 'teacher')) throw new GroupError(403, 'مراجعة الجلسة تتطلب المعلم المعيّن نفسه');
  const session = await reviewPracticeSession(req.params.teacherId, req.params.studentId, req.params.sessionId,
    req.body?.decision, req.body?.feedback);
  success(res, { session });
}));
router.post('/teacher/:teacherId/student/:studentId/notes', requireAuth, teacherScope, route(async (req, res) => {
  if (req.user.uid !== req.params.teacherId || !hasRole(req.user, 'teacher')) throw new GroupError(403, 'إرسال الملاحظة يتطلب المعلم المعيّن نفسه');
  const text = String(req.body?.text || '').trim();
  if (!text || text.length > 1000) throw new GroupError(400, 'نص الملاحظة مطلوب وبحد أقصى 1000 حرف');
  const now = new Date().toISOString();
  const noteRef = db.collection(`users/${req.params.studentId}/teacher_notes`).doc();
  const notificationRef = db.collection(`users/${req.params.studentId}/notifications`).doc(`teacher_note_${noteRef.id}`);
  const note = { id: noteRef.id, studentId: req.params.studentId, teacherId: req.params.teacherId, text, createdAt: now };
  await db.runTransaction(async tx => {
  await requireTeacherStudent(req.params.teacherId, req.params.studentId, tx);
  tx.create(noteRef, note);
  tx.create(notificationRef, { id: notificationRef.id, userId: req.params.studentId, type: 'teacher_note',
    title: 'ملاحظة جديدة من المعلم', message: text, teacherId: req.params.teacherId, noteId: noteRef.id, read: false, createdAt: now });
  });
  await sendPush(req.params.studentId, { title: 'ملاحظة جديدة من المعلم', body: text, tag: `teacher_note_${noteRef.id}` });
  success(res, { note });
}));
router.get('/teacher/:teacherId/reports', requireAuth, teacherScope, route(async (req, res) => {
  const members = await activeTeacherMembers(req.params.teacherId, { groupId: req.query.groupId });
  const rows = await Promise.all(members.map(async member => {
    const [profile, sessions, notes] = await Promise.all([
      db.doc(`users/${member.id}`).get(), db.collection(`users/${member.id}/recitation_sessions`).get(),
      db.collection(`users/${member.id}/teacher_notes`).get()
    ]);
    const list = sessions.docs.map(item => item.data());
    return { uid: member.id, name: profile.data()?.name || '', attempts: list.length,
      pending: list.filter(item => item.reviewStatus === 'pending').length,
      approved: list.filter(item => item.reviewStatus === 'approved').length,
      rejected: list.filter(item => item.reviewStatus === 'rejected').length,
      averageAccuracy: list.length ? Math.round(list.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) / list.length) : 0,
      notes: notes.size };
  }));
  success(res, { report: { students: rows, totals: rows.reduce((total, row) => ({ students: total.students + 1,
    attempts: total.attempts + row.attempts, pending: total.pending + row.pending, approved: total.approved + row.approved,
    rejected: total.rejected + row.rejected, notes: total.notes + row.notes }),
  { students: 0, attempts: 0, pending: 0, approved: 0, rejected: 0, notes: 0 }) } });
}));
router.get('/teacher/:teacherId/dashboard', requireAuth, teacherScope, route(async (req, res) => {
  const [students, teacher, groups] = await Promise.all([
    teacherStudents(req.params.teacherId), db.doc(`users/${req.params.teacherId}`).get(), listGroups(req.params.teacherId)
  ]);
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const rows = await Promise.all(students.map(async student => {
    const sessions = (await db.collection(`users/${student.uid}/recitation_sessions`).get()).docs.map(docData);
    const weekly = sessions.filter(item => Date.parse(item.createdAt) >= since);
    const latest = sessions.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
    return { ...student, weeklySessions: weekly.length, lastPracticeAt: latest?.createdAt || null,
      pendingReviews: sessions.filter(item => item.reviewStatus === 'pending' && item.submittedTeacherId === req.params.teacherId).length,
      recentSessions: weekly };
  }));
  const weeklySessions = rows.flatMap(row => row.recentSessions.map(session => ({ ...session, studentName: row.name, studentId: row.uid })));
  const activeThisWeek = rows.filter(row => row.weeklySessions > 0).length;
  const studentsWhoNeedAttention = rows.filter(row => row.lastPracticeAt && Date.parse(row.lastPracticeAt) < since)
    .map(row => ({ ...row, attentionReason: 'لا توجد محاولة تدريب مسجلة خلال آخر 7 أيام' }));
  success(res, { teacher: teacher.exists ? publicUser(teacher) : { uid: req.params.teacherId },
    groups, stats: { studentsCount: rows.length, groupsCount: groups.length, activeThisWeek,
      weeklyCommitment: rows.length ? Math.round(activeThisWeek * 100 / rows.length) : null,
      weeklyPracticeSessions: weeklySessions.length,
      pendingReviews: rows.reduce((sum, row) => sum + row.pendingReviews, 0),
      needsAttentionCount: studentsWhoNeedAttention.length },
    studentsWhoNeedAttention, smartInsights: [], recentActivities: weeklySessions
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 8)
      .map(item => ({ id: `${item.studentId}-${item.id}`, studentName: item.studentName,
        action: `محاولة تدريب${Number.isFinite(Number(item.accuracy)) ? ` بدقة ${Number(item.accuracy)}%` : ''}`,
        time: item.createdAt, icon: 'mic' })) });
}));

router.get('/student/analytics', requireAuth, route(async (req, res) => {
  const uid = req.user.uid;
  const [profile, progressSnapshot, sessionsSnapshot] = await Promise.all([
    db.doc(`users/${uid}`).get(), db.collection(`users/${uid}/ayah_progress`).get(),
    db.collection(`users/${uid}/recitation_sessions`).get()
  ]);
  if (!profile.exists) throw new GroupError(404, 'حساب الطالب غير موجود');
  const progress = progressSnapshot.docs.map(docData);
  const sessions = sessionsSnapshot.docs.map(docData);
  const now = activityNow();
  const dayMs = 24 * 60 * 60 * 1000;
  const start = now.getTime() - 6 * dayMs;
  const dailyPractice = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start + offset * dayMs);
    const key = ammanDateKey(date);
    const daySessions = sessions.filter(item => item.createdAt && ammanDateKey(item.createdAt) === key);
    const scored = daySessions.map(item => Number(item.accuracy)).filter(Number.isFinite);
    return { date: key, attempts: daySessions.length,
      averageAccuracy: scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : null };
  });
  const accuracies = sessions.map(item => Number(item.accuracy)).filter(Number.isFinite);
  const statusCounts = { memorized: 0, learning: 0, review: 0, unmemorized: 0 };
  progress.forEach(item => { if (item.status in statusCounts) statusCounts[item.status] += 1; });
  success(res, { analytics: {
    source: 'firestore', timeZone: 'Asia/Amman', generatedAt: now.toISOString(),
    declaredProgress: { classification: 'student_declared', totalAyahs: progress.length, ...statusCounts },
    practice: { classification: 'practice', totalAttempts: sessions.length,
      attemptsLast7Days: dailyPractice.reduce((sum, day) => sum + day.attempts, 0),
      averageAccuracy: accuracies.length ? Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length) : null,
      dailyPractice },
    teacherReviews: { classification: 'teacher_review_of_practice',
      pending: sessions.filter(item => item.reviewStatus === 'pending').length,
      approved: sessions.filter(item => item.reviewStatus === 'approved').length,
      rejected: sessions.filter(item => item.reviewStatus === 'rejected').length },
    profile: { streak: Number(profile.data().streak || 0), xp: Number(profile.data().xp || 0),
      level: Number(profile.data().level || 0), verifiedMemorizedPages: null,
      verifiedMemorizationSource: 'unavailable_no_page_approval_workflow', memoryScore: null }
  } });
}));
router.get('/teacher/:teacherId/available-students', requireAuth, teacherScope, route(async (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  // A teacher has no global student directory or historical access entitlement.
  const students = await teacherStudents(req.params.teacherId, { search, groupId: req.query.groupId });
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
