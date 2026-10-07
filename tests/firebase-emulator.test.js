import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateEmulatorEnvironment } from '../server/emulatorSafety.js';
import { ammanDateKey } from '../server/quranActivityStreak.js';

assert.equal(validateEmulatorEnvironment(), true, 'Run only through the isolated emulator runner');
const project = process.env.GCLOUD_PROJECT;
const authBase = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const firestoreBase = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents`;
const tokens = {};
const profiles = {};
let appServer;
let temp;
let db;
const originalHashes = {};
const sourceFiles = ['server/db.json', 'server/safar_data.json', 'server/db.backup.json', 'server/safar_data.backup.json'];
const digest = data => createHash('sha256').update(data).digest('hex');
// A repository data file may be absent (e.g. local backups removed); it must then stay absent.
const fileDigest = file => readFile(file).then(digest, error => { if (error.code === 'ENOENT') return 'absent'; throw error; });
const groups = [
  { id: 'group-1', name: 'Test one', code: 'TESTONE', teacherId: 'teacher-1' },
  { id: 'group-2', name: 'Test two', code: 'TESTTWO', teacherId: 'teacher-2' }
];

async function createAccount(uid, role, roles, extra = {}) {
  const { getAuth } = await import('firebase-admin/auth');
  const email = `${uid}@example.test`;
  await getAuth().createUser({ uid, email, password: 'Test-only-password-123!' });
  const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test-only-password-123!', returnSecureToken: true })
  });
  assert.equal(response.status, 200);
  const account = await response.json();
  assert.equal(account.localId, uid);
  tokens[uid] = account.idToken;
  profiles[uid] = {
    uid, name: uid, email: account.email, role, roles, xp: 100, level: 1, streak: 1,
    memoryScore: 100, memorizedPagesCount: 0, totalJuz: 0, hasCompletedWizard: false,
    ...extra
  };
  await db.collection('users').doc(uid).set(profiles[uid]);
}

function value(data) {
  if (data === null) return { nullValue: null };
  if (typeof data === 'boolean') return { booleanValue: data };
  if (typeof data === 'number') return { integerValue: String(data) };
  if (typeof data === 'string') return { stringValue: data };
  return { mapValue: { fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, value(v)])) } };
}
async function firestore(uid, document, updates) {
  const fields = updates && Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, value(v)]));
  const mask = updates ? '?' + Object.keys(updates).map(k => `updateMask.fieldPaths=${k}`).join('&') : '';
  return fetch(`${firestoreBase}/${document}${mask}`, {
    method: updates ? 'PATCH' : 'GET',
    headers: { Authorization: `Bearer ${tokens[uid]}`, 'Content-Type': 'application/json' },
    ...(updates ? { body: JSON.stringify({ fields }) } : {})
  });
}
async function api(uid, route, expected, options = {}) {
  const response = await fetch(`http://127.0.0.1:${appServer.address().port}${route}`, {
    ...options, headers: { Authorization: `Bearer ${tokens[uid] || 'invalid'}`, 'Content-Type': 'application/json' }
  });
  assert.equal(response.status, expected, `${uid} ${route}: ${await response.clone().text()}`);
  return response.json();
}

test.before(async () => {
  for (const file of sourceFiles) originalHashes[file] = await fileDigest(file);
  temp = await mkdtemp(path.join(tmpdir(), 'ma7fath-emulator-'));
  process.env.MA7FATH_TEST_DATA_DIR = temp;
  process.env.VERCEL = '1';
  ({ db } = await import('../server/middleware/auth.js'));
  await createAccount('teacher-1', 'teacher', { user: true, teacher: true });
  await createAccount('teacher-2', 'teacher', { user: true, teacher: true });
  await createAccount('student-1', 'user', { user: true }, { groupId: 'group-1', teacherId: 'teacher-1', isSafarMember: true });
  await createAccount('student-2', 'user', { user: true }, { groupId: 'group-2', teacherId: 'teacher-2', isSafarMember: true });
  await createAccount('admin-1', 'admin', { user: true, admin: true });
  await createAccount('multi-1', 'user', { user: true, teacher: true, admin: true });
  for (const group of groups) await db.collection('groups').doc(group.id).set({ ...group, studentsCount: 1 });
  for (const uid of ['student-1', 'student-2']) await db.doc(`memberships/${uid}`).set({
    uid, groupId: profiles[uid].groupId, teacherId: profiles[uid].teacherId, status: 'active'
  });
  const students = ['student-1', 'student-2'].map(uid => ({ ...profiles[uid], lastRecitationDate: '', thisWeekSessions: 0 }));
  await writeFile(path.join(temp, 'safar_data.json'), JSON.stringify({ groups, students, teachers: [], independentUsers: [], enrollmentRequests: [] }));
  await writeFile(path.join(temp, 'db.json'), JSON.stringify({ users: Object.values(profiles), recitationSessions: [
    { id: 'session-1', userId: 'student-1', pageNumber: 2, accuracy: 80 },
    { id: 'session-2', userId: 'student-2', pageNumber: 2, accuracy: 100 }
  ] }));
  await db.doc('users/student-2/portfolio/test').set({ progress: 10 });
  const { default: app } = await import('../server/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await new Promise(resolve => appServer.once('listening', resolve));
});

test.after(async () => {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (db) await db.terminate();
  if (temp) await rm(temp, { recursive: true, force: true });
  for (const file of sourceFiles) assert.equal(await fileDigest(file), originalHashes[file], `${file} remained unchanged`);
  if (process.env.MA7FATH_EMULATOR_RESULT) await writeFile(process.env.MA7FATH_EMULATOR_RESULT, 'completed');
});

test('rules deny self promotion, system counters, and membership edits', async () => {
  for (const update of [
    { role: 'admin' }, { roles: { user: true, admin: true } }, { roles: { user: true, teacher: true } },
    ...['xp', 'level', 'streak', 'memoryScore'].map(field => ({ [field]: 999 })),
    { lastActiveDate: '2099-01-01' }, { lastQuranActivityDate: '2099-01-01' }, { groupId: 'group-2' }, { teacherId: 'teacher-2' },
    { isSafarMember: false }, { groupName: 'Changed' }, { teacherName: 'Changed' }
  ]) assert.equal((await firestore('student-1', 'users/student-1', update)).status, 403, JSON.stringify(update));
});

test('rules permit profile edits and isolate another student progress', async () => {
  assert.equal((await firestore('student-1', 'users/student-1', { name: 'Allowed', photoURL: '', preferences: { language: 'ar' } })).status, 200);
  assert.equal((await firestore('student-1', 'users/student-2')).status, 403);
  assert.equal((await firestore('student-1', 'users/student-2/portfolio/test')).status, 403);
  assert.equal((await firestore('teacher-1', 'users/student-2/portfolio/test')).status, 403);
  assert.equal((await firestore('teacher-2', 'users/student-2/portfolio/test')).status, 200);
  assert.equal((await firestore('admin-1', 'users/student-2/portfolio/test')).status, 200);
  assert.equal((await firestore('multi-1', 'users/student-2/portfolio/test')).status, 200);
});

test('admin overview uses Firestore activity windows and returns zero for empty activity', async () => {
  process.env.MA7FATH_TEST_NOW = '2026-10-03T12:00:00.000Z';
  try {
    const empty = await api('admin-1', '/api/admin/overview', 200);
    assert.equal(empty.realTimeActivity.activeToday, 0);
    assert.equal(empty.realTimeActivity.activeThisWeek, 0);
    assert.equal(empty.realTimeActivity.monthlyActivities, 0);
    await db.doc('users/student-1').update({ lastQuranActivityDate: '2026-10-03', createdAt: '2026-10-02T12:00:00.000Z' });
    await db.doc('users/student-2').update({ lastQuranActivityDate: '2026-09-28' });
    await db.doc('memberships/student-1').update({ updatedAt: '2026-10-03T10:00:00.000Z' });
    await db.doc('users/student-1/recitation_sessions/overview-session').set({
      createdAt: '2026-10-03T09:00:00.000Z', reviewedAt: '2026-10-03T10:00:00.000Z', reviewedBy: 'teacher-1'
    });
    const populated = await api('admin-1', '/api/admin/overview', 200);
    assert.equal(populated.realTimeActivity.activeToday, 1);
    assert.equal(populated.realTimeActivity.activeThisWeek, 2);
    assert.equal(populated.realTimeActivity.newRegistrationsWeek, 1);
    assert.equal(populated.realTimeActivity.newGroupJoinsWeek, 1);
    assert.equal(populated.realTimeActivity.activeTeachers, 1);
    assert.equal(populated.realTimeActivity.activeGroups, 2);
    assert.equal(populated.realTimeActivity.weeklyActivities, 1);
    assert.equal(populated.realTimeActivity.monthlyActivities, 1);
  } finally {
    delete process.env.MA7FATH_TEST_NOW;
    await db.doc('users/student-1').update({ lastQuranActivityDate: null, createdAt: null });
    await db.doc('users/student-2').update({ lastQuranActivityDate: null });
    await db.doc('memberships/student-1').update({ updatedAt: null });
    await db.doc('users/student-1/recitation_sessions/overview-session').delete();
  }
});

test('recorded ayah progress is owner-written, scoped, and visible in teacher/admin reports', async () => {
  const valid = { userId: 'student-1', surahNumber: 2, ayahNumber: 5, status: 'review', source: 'student_recorded', updatedAt: new Date().toISOString() };
  assert.equal((await firestore('student-1', 'users/student-1/ayah_progress/2_5', valid)).status, 200);
  assert.equal((await firestore('student-2', 'users/student-1/ayah_progress/2_6', { ...valid, ayahNumber: 6 })).status, 403);
  assert.equal((await firestore('student-1', 'users/student-1/ayah_progress/2_7', { ...valid, userId: 'student-2', ayahNumber: 7 })).status, 403);
  assert.equal((await firestore('student-1', 'users/student-1/ayah_progress/2_8', { ...valid, ayahNumber: 8, status: 'certified' })).status, 403);
  assert.equal((await firestore('teacher-1', 'users/student-1/ayah_progress/2_5')).status, 200);
  assert.equal((await firestore('teacher-2', 'users/student-1/ayah_progress/2_5')).status, 403);
  await db.doc('users/student-1').update({ preferences: { unitType: 'surahs', planCreatorMode: 'manual', manualNewTarget: '3 ayahs' } });
  const teacherView = await api('teacher-1', '/api/teacher/teacher-1/student/student-1', 200);
  assert.equal(teacherView.student.recordedProgress.total, 1);
  assert.equal(teacherView.student.recordedProgress.review, 1);
  assert.equal(teacherView.student.learningPlan.manualNewTarget, '3 ayahs');
  const report = await api('admin-1', '/api/admin/memorization-performance', 200);
  assert.equal(report.stats.totalRecordedAyahs, 1);
  assert.equal(report.stats.learnersWithRecordedProgress, 1);
  assert.equal(report.stats.verifiedMemorizedPages, null);
  assert.equal((await db.doc('users/student-1').get()).data().xp, 100);
});

test('actual Auth emulator tokens enforce server role and teacher scope', async () => {
  for (const uid of ['student-1', 'teacher-1', 'admin-1', 'multi-1']) {
    const privileged = ['admin-1', 'multi-1'].includes(uid);
    await api(uid, '/api/admin/overview', privileged ? 200 : 403);
    await api(uid, '/api/groups', privileged ? 200 : 403);
    await api(uid, '/api/teacher/teacher-1/students', uid === 'student-1' ? 403 : 200);
    await api(uid, '/api/teacher/teacher-2/students', privileged ? 200 : 403);
  }
  await api('teacher-1', '/api/teacher/teacher-1/student/student-1', 200);
  await api('teacher-1', '/api/teacher/teacher-1/student/student-2', 403);
  await api('student-1', '/api/user/student-2/portfolio', 403);
  await api('bad-token', '/api/admin/overview', 401);
  const own = await api('student-1', '/api/recitation/history?userId=student-2', 200);
  // Firestore is the source now; legacy JSON sessions are not imported silently.
  assert.deepEqual(own.history, []);
  // Firestore role changes take effect even with the previously issued token.
  await db.doc('users/teacher-1').update({ role: 'user', roles: { user: true } });
  await api('teacher-1', '/api/teacher/teacher-1/students', 403);
  await db.doc('users/teacher-1').update({ role: 'teacher', roles: { user: true, teacher: true } });
});

test('Firestore group lifecycle persists join, transfer, leave, and approval across new tokens', async () => {
  const post = body => ({ method: 'POST', body: JSON.stringify(body) });
  await createAccount('new-teacher', 'user', { user: true });
  await createAccount('new-student', 'user', { user: true });
  await api('student-1', '/api/admin/assign-teacher', 403, post({ uid: 'new-teacher' }));
  await api('admin-1', '/api/admin/assign-teacher', 200, post({ uid: 'new-teacher' }));
  assert.equal((await db.doc('users/new-teacher').get()).data().roles.teacher, true);
  const created = await api('admin-1', '/api/admin/groups/create', 200, post({ name: 'حلقة الاختبار', teacherId: 'new-teacher' }));
  const group = created.group;
  assert.equal((await db.doc(`groups/${group.id}`).get()).exists, true);
  const lookup = await api('new-student', `/api/groups/lookup?code=${group.code.toLowerCase()}`, 200);
  assert.equal(lookup.group.id, group.id);
  await api('new-student', '/api/groups/join', 200, post({ code: group.code }));
  await api('new-student', '/api/groups/join', 200, post({ code: group.code }));
  assert.equal((await db.doc(`groups/${group.id}`).get()).data().studentsCount, 1);
  assert.equal((await db.doc('memberships/new-student').get()).data().groupId, group.id);
  assert.equal((await db.doc('users/new-student').get()).data().teacherId, 'new-teacher');
  assert.equal((await api('new-student', '/api/user/new-student', 200)).user.groupId, group.id);
  const roster = await api('new-teacher', '/api/teacher/new-teacher/students', 200);
  assert.equal(roster.students.some(s => s.uid === 'new-student'), true);
  await api('new-teacher', '/api/teacher/new-teacher/student/new-student', 200);
  await api('admin-1', '/api/admin/remove-teacher', 409, post({ uid: 'new-teacher' }));
  // A failing transaction must not change either membership or authorization pointers.
  await api('admin-1', '/api/admin/distribute-student', 404, post({ studentUid: 'new-student', groupId: 'missing-group' }));
  await api('admin-1', '/api/admin/distribute-student', 400, post({ studentUid: 'new-student', groupId: 'group-2', teacherId: 'teacher-1' }));
  assert.equal((await db.doc('memberships/new-student').get()).data().groupId, group.id);
  await api('new-teacher', '/api/teacher/new-teacher/enroll-student', 403, post({ studentUid: 'student-2', groupId: group.id }));
  await api('admin-1', '/api/admin/distribute-student', 200, post({ studentUid: 'new-student', groupId: 'group-2', teacherId: 'teacher-2' }));
  assert.equal((await db.doc(`groups/${group.id}`).get()).data().studentsCount, 0);
  assert.equal((await db.doc('groups/group-2').get()).data().studentsCount, 2);
  assert.equal((await api('new-teacher', '/api/teacher/new-teacher/students', 200)).students.length, 0);
  await api('new-teacher', '/api/teacher/new-teacher/student/new-student', 403);
  await api('teacher-2', '/api/teacher/teacher-2/student/new-student', 200);
  assert.equal((await firestore('new-teacher', 'users/new-student')).status, 403);
  assert.equal((await firestore('teacher-2', 'users/new-student')).status, 200);
  // Sign in again; the data must be independent of cached user state and tokens.
  const signIn = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'new-student@example.test', password: 'Test-only-password-123!', returnSecureToken: true })
  });
  assert.equal(signIn.status, 200);
  tokens['new-student'] = (await signIn.json()).idToken;
  assert.equal((await firestore('new-student', 'users/new-student')).status, 200);
  assert.equal((await api('new-student', '/api/user/new-student', 200)).user.teacherId, 'teacher-2');
  await api('new-student', '/api/groups/leave', 200, post({}));
  await api('new-student', '/api/groups/leave', 200, post({}));
  assert.equal((await db.doc('memberships/new-student').get()).exists, false);
  assert.equal((await db.doc('users/new-student').get()).data().groupId, null);
  assert.equal((await db.doc('groups/group-2').get()).data().studentsCount, 1);
  assert.equal((await api('teacher-2', '/api/teacher/teacher-2/students', 200)).students.some(s => s.uid === 'new-student'), false);
  const request = await api('new-student', '/api/safar/enrollment-request', 200, post({ submittedBy: 'student-2', name: 'Spoofed', notes: 'Test' }));
  assert.equal(request.request.submittedBy, 'new-student');
  const duplicate = await api('new-student', '/api/safar/enrollment-request', 200, post({}));
  assert.equal(duplicate.request.id, request.request.id);
  assert.equal((await api('admin-1', '/api/admin/enrollment-requests', 200)).requests.length, 1);
  await api('new-student', '/api/admin/enrollment-requests/approve', 403, post({ requestId: request.request.id, groupId: group.id }));
  await api('admin-1', '/api/admin/enrollment-requests/approve', 200, post({ requestId: request.request.id, groupId: group.id }));
  await api('admin-1', '/api/admin/enrollment-requests/approve', 200, post({ requestId: request.request.id, groupId: group.id }));
  assert.equal((await db.doc(`groups/${group.id}`).get()).data().studentsCount, 1);
  assert.equal((await db.doc(`enrollmentRequests/${request.request.id}`).get()).data().status, 'approved');
  assert.equal((await db.doc('users/new-student').get()).data().groupId, group.id);
  assert.equal((await api('new-teacher', '/api/teacher/new-teacher/students', 200)).students.length, 1);
  const adminUsers = await api('admin-1', '/api/admin/users', 200);
  assert.equal(adminUsers.users.find(u => u.uid === 'new-student').groupId, group.id);
});

test('membership and request writes cannot bypass the server transaction', async () => {
  assert.equal((await firestore('student-1', 'memberships/student-1', { groupId: 'group-2' })).status, 403);
  assert.equal((await firestore('teacher-1', 'groups/group-1', { teacherId: 'teacher-2' })).status, 403);
  assert.equal((await firestore('admin-1', 'groups/group-1', { studentsCount: 999 })).status, 403);
  assert.equal((await firestore('admin-1', 'users/student-1', { groupId: 'group-2' })).status, 403);
  assert.equal((await firestore('new-student', 'enrollmentRequests/new-student', { status: 'approved' })).status, 403);
  assert.equal((await firestore('student-1', 'memberships/student-2')).status, 403);
});

test('concurrent membership requests count once and a storage failure reports 503', async () => {
  const post = body => ({ method: 'POST', body: JSON.stringify(body) });
  await createAccount('concurrent-student', 'user', { user: true });
  const [a, b] = await Promise.all([
    api('concurrent-student', '/api/groups/join', 200, post({ code: 'TESTONE' })),
    api('concurrent-student', '/api/groups/join', 200, post({ code: 'TESTONE' }))
  ]);
  assert.equal(a.groupId, b.groupId);
  assert.equal((await db.doc('groups/group-1').get()).data().studentsCount, 2);
  const runTransaction = db.runTransaction;
  db.runTransaction = async () => { throw new Error('Injected storage failure'); };
  try {
    const response = await api('concurrent-student', '/api/groups/leave', 503, post({}));
    assert.equal(response.success, false);
  } finally { db.runTransaction = runTransaction; }
  assert.equal((await db.doc('memberships/concurrent-student').get()).data().groupId, 'group-1');
  assert.equal((await db.doc('users/concurrent-student').get()).data().groupId, 'group-1');
  await db.doc('groups/group-1').update({ studentsCount: 999 });
  await db.doc('groups/group-2').update({ studentsCount: 777 });
  await db.doc('memberships/inactive-fixture').set({ uid: 'inactive-fixture', groupId: 'group-1', status: 'inactive' });
  const listed = await api('admin-1', '/api/groups', 200);
  assert.equal(listed.groups.find(group => group.id === 'group-1').studentsCount, 2);
  assert.equal(listed.groups.find(group => group.id === 'group-2').studentsCount, 1);
});

const practicePayload = (sessionId, extra = {}) => ({
  sessionId, autoSave: true, pageNumber: 604, surahNumber: 112,
  surahName: 'الإخلاص', ayahNumber: 6222, expectedText: 'قل هو الله أحد',
  spokenText: 'قل هو الله أحد', ...extra
});
const postPractice = body => ({ method: 'POST', body: JSON.stringify(body) });

test('Quran companion streak counts committed activity once per Amman day, not sign-in', async () => {
  await createAccount('streak-student', 'user', { user: true }, { streak: 0 });
  assert.equal((await db.doc('users/streak-student').get()).data().streak, 0, 'Auth emulator sign-in is not activity');
  await api('streak-student', '/api/groups/join', 200, postPractice({ code: 'TESTONE' }));
  assert.equal((await db.doc('users/streak-student').get()).data().streak, 0, 'membership is not Quran activity');
  const today = ammanDateKey();
  await api('streak-student', '/api/ai/recitation-check', 200, postPractice(practicePayload('streak-day-one-a')));
  let profile = (await db.doc('users/streak-student').get()).data();
  assert.equal(profile.streak, 1);
  assert.equal(profile.lastQuranActivityDate, today);
  await api('streak-student', '/api/ai/recitation-check', 200, postPractice(practicePayload('streak-day-one-b')));
  profile = (await db.doc('users/streak-student').get()).data();
  assert.equal(profile.streak, 1, 'a second committed attempt on the same Amman day does not increment');
  const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  await db.doc('users/streak-student').update({ streak: 1, lastQuranActivityDate: yesterdayDate.toISOString().slice(0, 10) });
  await api('streak-student', '/api/ai/recitation-check', 200, postPractice(practicePayload('streak-day-two')));
  profile = (await db.doc('users/streak-student').get()).data();
  assert.equal(profile.streak, 2, 'a committed attempt on the following Amman day increments');
  assert.equal(profile.lastQuranActivityDate, today);
  assert.equal(profile.xp, 100);
  assert.equal(profile.memorizedPagesCount, 0);
  const cleanup = db.batch();
  for (const session of (await db.collection('users/streak-student/recitation_sessions').get()).docs) cleanup.delete(session.ref);
  cleanup.delete(db.doc('users/streak-student/recitation_stats/summary'));
  cleanup.delete(db.doc('users/streak-student/page_progress/604'));
  cleanup.delete(db.doc('memberships/streak-student'));
  cleanup.delete(db.doc('users/streak-student'));
  await cleanup.commit();
});

test('UI configuration is readable by signed-in users and writable only by admins', async () => {
  assert.equal((await firestore('student-1', 'app_config/navigation')).status, 404);
  assert.equal((await firestore('student-1', 'app_config/navigation', { hacked: true })).status, 403);
  assert.equal((await firestore('teacher-1', 'app_config/navigation', { hacked: true })).status, 403);
  assert.equal((await firestore('admin-1', 'app_config/navigation', {
    sections: { community: { visible: true, order: 40 }, achievements: { visible: true, order: 50 } }
  })).status, 200);
  assert.equal((await firestore('student-1', 'app_config/navigation')).status, 200);
});

test('community leaderboard ranks students by XP from Firestore and exposes no identifiers', async () => {
  const original = {};
  for (const [uid, xp] of [['student-1', 300], ['student-2', 500], ['teacher-1', 9999]]) {
    original[uid] = (await db.doc(`users/${uid}`).get()).data().xp;
    await db.doc(`users/${uid}`).update({ xp });
  }
  try {
    assert.equal((await api(null, '/api/community/leaderboard', 401)).success, false);
    const { leaders, me } = await api('student-1', '/api/community/leaderboard', 200);
    // Earlier tests rename student-1, so the viewer is identified by isMe, not by name.
    const listing = JSON.stringify(leaders.map(entry => [entry.name, entry.xp, entry.isMe]));
    assert.ok(leaders.every(entry => entry.xp < 9999), `staff are not ranked: ${listing}`);
    assert.deepEqual(leaders.map(entry => entry.xp), [...leaders.map(entry => entry.xp)].sort((x, y) => y - x), `sorted by XP: ${listing}`);
    assert.equal(leaders[0].name, 'student-2', `highest XP first: ${listing}`);
    assert.deepEqual(leaders.map(entry => entry.rank), leaders.map((_, index) => index + 1));
    for (const entry of leaders) {
      assert.deepEqual(Object.keys(entry).sort(), ['isMe', 'name', 'photoURL', 'rank', 'streak', 'xp']);
    }
    const mine = leaders.filter(entry => entry.isMe);
    assert.equal(mine.length, 1, `viewer appears once: ${listing}`);
    assert.equal(mine[0].rank, 2);
    assert.equal(mine[0].xp, 300);
    assert.equal(me.isMe, true);
    assert.equal(me.xp, 300);
  } finally {
    for (const [uid, xp] of Object.entries(original)) await db.doc(`users/${uid}`).update({ xp });
  }
});

test('Quran display endpoint preserves Uthmani marks and is the recitation reference', async () => {
  const page = await api('student-1', '/api/quran/reference/page/2', 200);
  assert.equal(page.source.identifier, 'quran-uthmani');
  assert.equal(page.pageNumber, 2);
  assert.equal(page.ayahs.length > 1, true);
  const displayedText = page.ayahs.map(ayah => ayah.text).join(' ');
  for (const mark of ['َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ً']) assert.equal(displayedText.includes(mark), true, mark);
  const first = page.ayahs[0];
  const comparison = await api('student-1', '/api/ai/recitation-check', 200, {
    method: 'POST',
    body: JSON.stringify({
      spokenText: first.text,
      expectedText: 'نص عميل غير موثوق',
      pageNumber: 2,
      surahNumber: first.surah.number,
      ayahNumber: first.number,
      isFullPage: false,
      autoSave: false
    })
  });
  assert.equal(comparison.referenceText, first.text);
  assert.equal(comparison.accuracy, 100);
  await api('student-1', '/api/quran/reference/page/0', 400);
  await api('student-1', '/api/quran/reference/surah/115', 400);
});

test('practice results commit atomically once without XP or memorization, including concurrent retries', async () => {
  await createAccount('practice-student', 'user', { user: true });
  await createAccount('zero-practice-student', 'user', { user: true });
  await api('practice-student', '/api/groups/join', 200, postPractice({ code: 'TESTONE' }));
  const profileBefore = (await db.doc('users/practice-student').get()).data();
  await api('practice-student', '/api/ai/recitation-check', 400, postPractice(practicePayload(undefined)));
  const payload = practicePayload('practice-session-one', { userId: 'student-2', accuracy: 0, xp: 99999 });
  const first = await api('practice-student', '/api/ai/recitation-check', 200, postPractice(payload));
  assert.equal(first.accuracy, 100, 'server computes score rather than using client accuracy');
  assert.equal(first.savedSession.id, payload.sessionId);
  assert.equal(first.savedSession.userId, 'practice-student', 'token identity owns the attempt');
  assert.equal(first.savedSession.classification, 'practice');
  assert.equal(first.savedSession.referenceVerified, true);
  assert.equal(first.savedSession.rewardedXp, 0);
  const repeated = await api('practice-student', '/api/ai/recitation-check', 200, postPractice(payload));
  assert.deepEqual(repeated.savedSession, first.savedSession);
  assert.equal(repeated.recitationStats.totalSessions, 1);
  const concurrent = practicePayload('practice-session-two', { spokenText: 'قل هو الله' });
  const [a, b] = await Promise.all([
    api('practice-student', '/api/ai/recitation-check', 200, postPractice(concurrent)),
    api('practice-student', '/api/ai/recitation-check', 200, postPractice(concurrent))
  ]);
  assert.deepEqual(a.savedSession, b.savedSession);
  assert.equal(a.savedSession.accuracy, 75);
  const sessions = await db.collection('users/practice-student/recitation_sessions').get();
  assert.equal(sessions.size, 2);
  const summary = (await db.doc('users/practice-student/recitation_stats/summary').get()).data();
  assert.equal(summary.totalAttempts, 2);
  assert.equal(summary.accuracyTotal, 175);
  assert.equal(summary.averageAccuracy, 88);
  const page = (await db.doc('users/practice-student/page_progress/604').get()).data();
  assert.equal(page.totalAttempts, 2);
  assert.equal((await db.collection('users/practice-student/ayah_progress').get()).size, 0);
  const profileAfter = (await db.doc('users/practice-student').get()).data();
  for (const field of ['xp', 'level', 'memoryScore', 'memorizedPagesCount', 'totalJuz']) {
    assert.equal(profileAfter[field], profileBefore[field], `${field} is not changed by practice`);
  }
  assert.equal(profileAfter.streak, profileBefore.streak);
  assert.equal(typeof profileAfter.lastQuranActivityDate, 'string');
  const zero = await api('zero-practice-student', '/api/ai/recitation-check', 200, postPractice(
    practicePayload('zero-session-one', { spokenText: 'هذا نص بعيد تماماً', accuracy: 100, xp: 500 })
  ));
  assert.equal(zero.accuracy, 0);
  assert.equal(zero.savedSession.accuracy, 0);
  assert.equal(zero.recitationStats.averageAccuracy, 0);
  assert.equal(zero.recitationStats.hasAttempts, true);
});

test('practice ID conflicts, forged saves, and failed storage cannot create or reward attempts', async () => {
  const before = (await db.doc('users/practice-student/recitation_stats/summary').get()).data();
  await api('practice-student', '/api/ai/recitation-check', 409, postPractice(
    practicePayload('practice-session-one', { spokenText: 'قل هو الله' })
  ));
  await api('practice-student', '/api/recitation/save', 400, postPractice({
    sessionId: 'practice-session-one', accuracy: 100, xp: 10000, results: []
  }));
  await api('practice-student', '/api/recitation/save', 400, postPractice({ accuracy: 100 }));
  await api('practice-student', '/api/quran/pages/604/review', 410, postPractice({ score: 100 }));
  await api('practice-student', '/api/recitation/save', 403, postPractice({ sessionId: 'practice-session-one', userId: 'student-2' }));
  await api('student-2', '/api/recitation/save', 404, postPractice({ sessionId: 'practice-session-one' }));
  const confirmed = await api('practice-student', '/api/recitation/save', 200, postPractice({ sessionId: 'practice-session-one' }));
  assert.equal(confirmed.session.id, 'practice-session-one');
  assert.equal(confirmed.recitationStats.totalSessions, 2);
  const runTransaction = db.runTransaction;
  db.runTransaction = async () => { throw new Error('Injected practice storage failure'); };
  try {
    const failed = await api('practice-student', '/api/ai/recitation-check', 503, postPractice(practicePayload('practice-failed-one')));
    assert.equal(failed.success, false);
    assert.equal(failed.savedSession, undefined);
  } finally { db.runTransaction = runTransaction; }
  assert.equal((await db.doc('users/practice-student/recitation_sessions/practice-failed-one').get()).exists, false);
  assert.deepEqual((await db.doc('users/practice-student/recitation_stats/summary').get()).data(), before);
  assert.equal((await db.doc('users/practice-student/page_progress/604').get()).data().totalAttempts, 2);
});

test('practice history, teacher profiles, and admin reports retain zero and respect current membership after fresh login', async () => {
  const history = await api('practice-student', '/api/recitation/history?userId=zero-practice-student&pageNumber=604', 200);
  assert.equal(history.history.length, 2);
  assert.ok(history.history.every(session => session.userId === 'practice-student'));
  assert.equal((await api('zero-practice-student', '/api/recitation/history', 200)).history[0].accuracy, 0);
  const page = await api('practice-student', '/api/recitation/page-stats/604', 200);
  assert.equal(page.stats.totalAttempts, 2);
  assert.equal(page.stats.averageAccuracy, 88);
  const empty = await api('student-2', '/api/recitation/page-stats/604', 200);
  assert.equal(empty.stats.hasAttempts, false);
  assert.equal(empty.stats.averageAccuracy, 0);
  await api('practice-student', '/api/admin/memorization-performance', 403);
  await api('teacher-1', '/api/admin/memorization-performance', 403);
  await api('teacher-2', '/api/teacher/teacher-2/student/practice-student', 403);
  const profile = await api('teacher-1', '/api/teacher/teacher-1/student/practice-student', 200);
  assert.equal(profile.student.recitationStats.totalSessions, 2);
  assert.equal(profile.student.recitationStats.averageAccuracy, 88);
  assert.equal(profile.student.recentSessions.length, 2);
  for (const uid of ['admin-1', 'multi-1']) {
    const report = await api(uid, '/api/admin/memorization-performance', 200);
    assert.equal(report.stats.totalRecitationSessions, 3);
    assert.equal(report.stats.totalWeeklySessions, 3);
    assert.equal(report.stats.averageAccuracy, 58);
    assert.equal(report.stats.verifiedMemorizedPages, null);
    assert.equal(report.referenceVerified, true);
    assert.equal(report.students.find(student => student.uid === 'zero-practice-student').averageAccuracy, 0);
    assert.equal(report.groups.find(group => group.id === 'group-1').totalRecitationSessions, 2);
  }
  const signIn = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'practice-student@example.test', password: 'Test-only-password-123!', returnSecureToken: true })
  });
  assert.equal(signIn.status, 200);
  tokens['practice-student'] = (await signIn.json()).idToken;
  assert.equal((await api('practice-student', '/api/recitation/history', 200)).history.length, 2);
  await api('admin-1', '/api/admin/distribute-student', 200, postPractice({ studentUid: 'practice-student', groupId: 'group-2', teacherId: 'teacher-2' }));
  await api('teacher-1', '/api/teacher/teacher-1/student/practice-student', 403);
  assert.equal((await api('teacher-2', '/api/teacher/teacher-2/student/practice-student', 200)).student.recitationStats.totalSessions, 2);
});

test('practice sessions and atomic stats are read-scoped and cannot be forged by Firestore clients', async () => {
  const sessionPath = 'users/practice-student/recitation_sessions/practice-session-one';
  for (const uid of ['practice-student', 'admin-1', 'multi-1']) {
    for (const document of [sessionPath, 'users/practice-student/recitation_stats/summary', 'users/practice-student/page_progress/604']) {
      assert.equal((await firestore(uid, document, { accuracy: 999 })).status, 403);
    }
  }
  assert.equal((await firestore('practice-student', 'users/practice-student/recitation_sessions/forged-session', { accuracy: 100 })).status, 403);
  assert.equal((await firestore('zero-practice-student', sessionPath)).status, 403);
  assert.equal((await firestore('teacher-1', sessionPath)).status, 403);
  for (const uid of ['practice-student', 'teacher-2', 'admin-1', 'multi-1']) {
    assert.equal((await firestore(uid, sessionPath)).status, 200);
  }
});

test('trusted Quran references, assigned review, teacher notes, and reports enforce identity', async () => {
  await createAccount('review-student', 'user', { user: true }, { xp: 41, memorizedPagesCount: 3 });
  await api('review-student', '/api/groups/join', 200, postPractice({ code: 'TESTONE' }));
  const attempt = await api('review-student', '/api/ai/recitation-check', 200, postPractice({
    ...practicePayload('review-session-one'), expectedText: 'نص مزور من العميل'
  }));
  assert.equal(attempt.accuracy, 100);
  assert.notEqual(attempt.savedSession.expectedText, 'نص مزور من العميل');
  await api('review-student', '/api/ai/recitation-check', 400, postPractice({
    ...practicePayload('bad-quran-reference'), surahNumber: 111
  }));
  const submitted = await api('review-student', '/api/recitation/sessions/review-session-one/submit', 200, postPractice({}));
  assert.equal(submitted.session.reviewStatus, 'pending');
  await api('student-2', '/api/teacher/teacher-1/student/review-student/sessions/review-session-one/review', 403,
    { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) });
  await api('teacher-2', '/api/teacher/teacher-2/student/review-student/sessions/review-session-one/review', 403,
    { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) });
  const reviewed = await api('teacher-1', '/api/teacher/teacher-1/student/review-student/sessions/review-session-one/review', 200,
    { method: 'PATCH', body: JSON.stringify({ decision: 'approved', feedback: 'أحسنت' }) });
  assert.equal(reviewed.session.reviewStatus, 'approved');
  assert.equal(reviewed.session.rewardedXp, 0);
  await api('review-student', '/api/ai/recitation-check', 200, postPractice(practicePayload('review-session-two', { spokenText: 'نص غير مطابق' })));
  await api('review-student', '/api/recitation/sessions/review-session-two/submit', 200, postPractice({}));
  const rejected = await api('teacher-1', '/api/teacher/teacher-1/student/review-student/sessions/review-session-two/review', 200,
    { method: 'PATCH', body: JSON.stringify({ decision: 'rejected', feedback: 'أعد المحاولة' }) });
  assert.equal(rejected.session.reviewStatus, 'rejected');
  assert.equal(rejected.session.rewardedXp, 0);
  const profile = (await db.doc('users/review-student').get()).data();
  assert.equal(profile.xp, 41);
  assert.equal(profile.memorizedPagesCount, 3);
  await api('teacher-2', '/api/teacher/teacher-2/student/review-student/notes', 403, postPractice({ text: 'تزوير' }));
  await api('teacher-1', '/api/teacher/teacher-1/student/review-student/notes', 200, postPractice({ text: 'واصل المراجعة' }));
  assert.equal((await db.collection('users/review-student/teacher_notes').get()).size, 1);
  assert.equal((await firestore('review-student', 'users/review-student/teacher_notes/forged', { teacherId: 'teacher-1', text: 'مزور' })).status, 403);
  assert.equal((await db.collection('users/review-student/notifications').where('type', '==', 'teacher_note').get()).size, 1);
  const report = await api('teacher-1', '/api/teacher/teacher-1/reports', 200);
  assert.equal(report.report.students.find(item => item.uid === 'review-student').approved, 1);
  assert.equal(report.report.students.find(item => item.uid === 'review-student').rejected, 1);
  assert.equal(report.report.students.find(item => item.uid === 'review-student').notes, 1);
});

test('student analytics and teacher dashboard use scoped Firestore records and active memberships', async () => {
  const now = new Date().toISOString();
  await createAccount('metrics-teacher-1', 'teacher', { user: true, teacher: true });
  await createAccount('metrics-teacher-2', 'teacher', { user: true, teacher: true });
  await createAccount('metrics-student-1', 'user', { user: true }, { memorizedPagesCount: 0 });
  await createAccount('metrics-student-2', 'user', { user: true }, { memorizedPagesCount: 0 });
  await db.doc('groups/metrics-group-1').set({ name: 'Teacher one group', code: 'METRICSONE', teacherId: 'metrics-teacher-1', studentsCount: 999 });
  await db.doc('groups/metrics-group-1b').set({ name: 'Teacher one empty group', code: 'METRICSEMPTY', teacherId: 'metrics-teacher-1', studentsCount: 999 });
  await db.doc('groups/metrics-group-2').set({ name: 'Teacher two group', code: 'METRICSTWO', teacherId: 'metrics-teacher-2' });
  await db.doc('memberships/metrics-student-1').set({ uid: 'metrics-student-1', groupId: 'metrics-group-1', teacherId: 'metrics-teacher-1', status: 'active' });
  await db.doc('memberships/metrics-student-2').set({ uid: 'metrics-student-2', groupId: 'metrics-group-2', teacherId: 'metrics-teacher-2', status: 'active' });
  await db.doc('memberships/inactive-student').set({ uid: 'inactive-student', groupId: 'metrics-group-1', teacherId: 'metrics-teacher-1', status: 'inactive' });
  await db.doc('users/metrics-student-1/ayah_progress/2_1').set({ userId: 'metrics-student-1', surahNumber: 2, ayahNumber: 1, status: 'learning', updatedAt: now });
  await db.doc('users/metrics-student-1/recitation_sessions/metrics-one').set({ userId: 'metrics-student-1', accuracy: 80, createdAt: now, reviewStatus: 'pending', submittedTeacherId: 'metrics-teacher-1' });
  await db.doc('users/metrics-student-2/recitation_sessions/metrics-other').set({ userId: 'metrics-student-2', accuracy: 100, createdAt: now });

  const own = await api('metrics-student-1', '/api/student/analytics', 200);
  assert.equal(own.analytics.declaredProgress.totalAyahs, 1);
  assert.equal(own.analytics.declaredProgress.learning, 1);
  assert.equal(own.analytics.practice.totalAttempts, 1);
  assert.equal(own.analytics.practice.averageAccuracy, 80);
  assert.equal(own.analytics.teacherReviews.pending, 1);
  assert.equal(own.analytics.profile.verifiedMemorizedPages, null);

  const empty = await api('admin-1', '/api/student/analytics', 200);
  assert.equal(empty.analytics.declaredProgress.totalAyahs, 0);
  assert.equal(empty.analytics.practice.totalAttempts, 0);
  assert.equal(empty.analytics.practice.averageAccuracy, null);

  const teacher = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/dashboard', 200);
  assert.equal(teacher.stats.studentsCount, 1);
  assert.equal(teacher.stats.groupsCount, 2);
  assert.equal(teacher.stats.activeThisWeek, 1);
  assert.equal(teacher.stats.weeklyPracticeSessions, 1);
  assert.equal(teacher.stats.pendingReviews, 1);
  assert.deepEqual(teacher.groups.map(group => group.studentsCount).sort(), [0, 1]);
  assert.ok(teacher.recentActivities.every(item => item.studentName === 'metrics-student-1'));

  const otherTeacher = await api('metrics-teacher-2', '/api/teacher/metrics-teacher-2/dashboard', 200);
  assert.equal(otherTeacher.stats.studentsCount, 1);
  assert.equal(otherTeacher.stats.weeklyPracticeSessions, 1);
  assert.ok(otherTeacher.recentActivities.every(item => item.studentName === 'metrics-student-2'));
  await api('metrics-teacher-2', '/api/teacher/metrics-teacher-1/dashboard', 403);
});

test('student card fields: null returned for absent denormalized cache fields, currentSurah from profile', async () => {
  // metrics-student-1 has no consistencyRate/thisWeekSessions in their Firestore user doc.
  // The API must return null for both so the UI can show proper empty state.
  const roster = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/students', 200);
  const student = roster.students.find(s => s.uid === 'metrics-student-1');
  assert.ok(student, 'metrics-student-1 must appear in metrics-teacher-1 roster');
  assert.strictEqual(student.consistencyRate, null, 'consistencyRate must be null when absent');
  assert.strictEqual(student.thisWeekSessions, null, 'thisWeekSessions must be null when absent');
  assert.strictEqual(student.currentSurah, null, 'currentSurah must be null when absent');

  // After setting currentSurah it must be returned.
  await db.doc('users/metrics-student-1').update({ currentSurah: 'البقرة' });
  const withSurah = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/students', 200);
  assert.equal(withSurah.students.find(s => s.uid === 'metrics-student-1').currentSurah, 'البقرة');
  await db.doc('users/metrics-student-1').update({ currentSurah: null });

  // After setting the denormalized fields they must come back as numbers not null.
  await db.doc('users/metrics-student-1').update({ consistencyRate: 85, thisWeekSessions: 3 });
  const withFields = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/students', 200);
  const sf = withFields.students.find(s => s.uid === 'metrics-student-1');
  assert.equal(sf.consistencyRate, 85);
  assert.equal(sf.thisWeekSessions, 3);
  await db.doc('users/metrics-student-1').update({ consistencyRate: null, thisWeekSessions: null });

  // Roster status and last practice day are derived from the confirmed activity day and streak.
  const { ammanDateKey, activityNow } = await import('../server/quranActivityStreak.js');
  const daysAgo = days => ammanDateKey(new Date(activityNow().getTime() - days * 86400000));
  const original = (await db.doc('users/metrics-student-1').get()).data();
  const statusFor = async (lastQuranActivityDate, streak) => {
    await db.doc('users/metrics-student-1').update({ lastQuranActivityDate, streak });
    const roster = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/students', 200);
    return roster.students.find(s => s.uid === 'metrics-student-1');
  };
  try {
    const excellent = await statusFor(daysAgo(0), 4);
    assert.equal(excellent.status, 'excellent');
    assert.equal(excellent.lastRecitationDate, daysAgo(0));
    assert.equal((await statusFor(daysAgo(1), 1)).status, 'active');
    assert.equal((await statusFor(daysAgo(5), 9)).status, 'needs_attention');
    assert.equal((await statusFor(daysAgo(10), 9)).status, 'inactive');
    const never = await statusFor(null, 0);
    assert.equal(never.status, 'inactive');
    assert.equal(never.lastRecitationDate, '');
  } finally {
    await db.doc('users/metrics-student-1').update({
      lastQuranActivityDate: original.lastQuranActivityDate ?? null, streak: original.streak ?? 0
    });
  }
});

test('group studentsCount uses live memberships not stale stored counter, empty group shows zero', async () => {
  // metrics-group-1: 1 active member. metrics-group-1b: 0. Both stored with studentsCount:999.
  const groups = await api('metrics-teacher-1', '/api/groups?teacherId=metrics-teacher-1', 200);
  const group1 = groups.groups.find(g => g.id === 'metrics-group-1');
  const group1b = groups.groups.find(g => g.id === 'metrics-group-1b');
  assert.ok(group1, 'metrics-group-1 must be returned');
  assert.ok(group1b, 'empty group metrics-group-1b must be returned');
  assert.equal(group1.studentsCount, 1, 'live membership count for group-1 is 1');
  assert.equal(group1b.studentsCount, 0, 'live membership count for empty group-1b is 0');
  assert.notEqual(group1.studentsCount, 999, 'stale stored counter must not be used');
  assert.notEqual(group1b.studentsCount, 999, 'stale stored counter must not be used');

  // Teacher 2 must not see Teacher 1 groups
  const t2groups = await api('metrics-teacher-2', '/api/groups?teacherId=metrics-teacher-2', 200);
  assert.ok(!t2groups.groups.some(g => g.id === 'metrics-group-1'), 'teacher-2 must not see teacher-1 groups');
  assert.ok(t2groups.groups.every(g => g.teacherId === 'metrics-teacher-2'), 'all returned groups must belong to teacher-2');
});

test('P0 private chat and fortress plans use verified Firebase ownership, never JSON identities', async () => {
  await createAccount('private-a', 'user', { user: true });
  await createAccount('private-b', 'user', { user: true });
  const root = `http://127.0.0.1:${appServer.address().port}`;
  const routes = [ ['GET', '/api/ai/chat'], ['POST', '/api/ai/chat'], ['DELETE', '/api/ai/chat'],
    ['GET', '/api/user/fortress-plan/private-a'], ['POST', '/api/user/fortress-plan'] ];
  for (const [method, route] of routes) {
    for (const authorization of [null, 'Bearer invalid-token']) {
      const response = await fetch(root + route, { method, headers: { 'Content-Type': 'application/json',
        ...(authorization ? { authorization } : {}) }, ...(method === 'POST' ? { body: JSON.stringify({ message: 'hello', plan: {} }) } : {}) });
      assert.equal(response.status, 401, `${method} ${route}`);
    }
  }
  for (const uid of ['private-a', 'private-b']) {
    const result = await api(uid, '/api/ai/chat', 200, { method: 'POST', body: JSON.stringify({ message: `Private message ${uid}` }) });
    assert.equal(result.history.length, 2);
    assert.ok(result.history.every(item => item.userId === uid));
    await api(uid, '/api/user/fortress-plan', 200, { method: 'POST', body: JSON.stringify({ plan: { dailyTarget: uid } }) });
    const read = await api(uid, `/api/user/fortress-plan/${uid}`, 200);
    assert.equal(read.plan.dailyTarget, uid);
    assert.equal(read.plan.userId, uid);
  }
  for (const uid of ['private-a', 'admin-1', 'multi-1']) {
    for (const hint of ['userId', 'uid']) {
      await api(uid, `/api/ai/chat?${hint}=private-b`, 403);
      await api(uid, `/api/ai/chat?${hint}=private-b`, 403, { method: 'DELETE' });
      await api(uid, '/api/ai/chat', 403, { method: 'DELETE', body: JSON.stringify({ [hint]: 'private-b' }) });
      await api(uid, '/api/ai/chat', 403, { method: 'POST', body: JSON.stringify({ message: 'forged', [hint]: 'private-b' }) });
      await api(uid, '/api/user/fortress-plan', 403, { method: 'POST', body: JSON.stringify({ plan: {}, [hint]: 'private-b' }) });
    }
    await api(uid, '/api/user/fortress-plan/private-b', 403);
    await api(uid, '/api/user/fortress-plan', 403, { method: 'POST', body: JSON.stringify({ plan: { userId: 'private-b' } }) });
  }
  assert.equal((await api('private-a', '/api/ai/chat', 200)).history.length, 2);
  await api('private-a', '/api/ai/chat', 200, { method: 'DELETE' });
  assert.deepEqual((await api('private-a', '/api/ai/chat', 200)).history, []);
  assert.equal((await api('private-b', '/api/ai/chat', 200)).history.length, 2);
  assert.equal((await api('private-b', '/api/user/fortress-plan/private-b', 200)).plan.dailyTarget, 'private-b');
  for (const uid of ['private-a', 'admin-1', 'teacher-1']) {
    assert.equal((await firestore(uid, 'users/private-b/private_ai_chat/current')).status, 403);
    assert.equal((await firestore(uid, 'users/private-b/five_fortresses_plans/current')).status, 403);
  }
  assert.equal((await firestore('private-b', 'users/private-b/private_ai_chat/current')).status, 200);
  assert.equal((await firestore('private-b', 'users/private-b/private_ai_chat/current', { history: {} })).status, 403);
  for (const endpoint of ['signup', 'login', 'google', 'demo', 'admin']) {
    const response = await fetch(`${root}/api/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'admin-1', email: 'admin@ma7fath.ai', password: 'admin', role: 'admin' }) });
    assert.equal(response.status, 410);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.user, undefined);
    assert.equal(data.token, undefined);
  }
});

test('P0 persistence failure never returns success or deletes another private record', async () => {
  const originalTransaction = db.runTransaction;
  db.runTransaction = async () => { throw new Error('Injected private chat failure'); };
  try {
    const failed = await api('private-b', '/api/ai/chat', 503, { method: 'POST', body: JSON.stringify({ message: 'must not persist' }) });
    assert.equal(failed.success, false);
    const planFailure = await api('private-b', '/api/user/fortress-plan', 503, {
      method: 'POST', body: JSON.stringify({ plan: { dailyTarget: 'lost' } })
    });
    assert.equal(planFailure.success, false);
  } finally { db.runTransaction = originalTransaction; }
  assert.equal((await api('private-b', '/api/ai/chat', 200)).history.length, 2);
  const originalDoc = db.doc;
  db.doc = function (pathname) {
    if (pathname === 'users/private-b/private_ai_chat/current') return { delete: async () => { throw new Error('Injected chat delete failure'); } };
    return originalDoc.call(this, pathname);
  };
  try {
    assert.equal((await api('private-b', '/api/ai/chat', 503, { method: 'DELETE' })).success, false);
  } finally { db.doc = originalDoc; }
  assert.equal((await api('private-b', '/api/ai/chat', 200)).history.length, 2);
  assert.equal((await api('private-b', '/api/user/fortress-plan/private-b', 200)).plan.dailyTarget, 'private-b');
});

test('P1 protected memorization fields, self declarations and persisted teacher practice review remain distinct', async () => {
  await createAccount('integrity-teacher', 'teacher', { user: true, teacher: true });
  await createAccount('integrity-other-teacher', 'teacher', { user: true, teacher: true });
  await createAccount('integrity-a', 'user', { user: true }, { memorizedPages: [1,2,3], memorizedPagesCount: 77, totalJuz: 12, memoryScore: 99, xp: 42 });
  await createAccount('integrity-b', 'user', { user: true }, { memorizedPagesCount: 88 });
  const group = await api('admin-1', '/api/admin/groups/create', 200, postPractice({ teacherId: 'integrity-teacher', name: 'Integrity synthetic group' }));
  await api('integrity-a', '/api/groups/join', 200, postPractice({ code: group.group.code }));
  const before = (await db.doc('users/integrity-a').get()).data();
  const changes = [{ memorizedPages: [1,2,3,4] }, { memorizedPagesCount: 604 }, { totalJuz: 30 }, { memoryScore: 100 }];
  for (const update of changes) {
    assert.equal((await firestore('integrity-a', 'users/integrity-a', update)).status, 403);
    assert.equal((await firestore('integrity-a', 'users/integrity-a', { ...update, hasCompletedWizard: true, preferences: { theme: 'dark' } })).status, 403);
    await api('integrity-a', '/api/user/integrity-a', 400, { method: 'PUT', body: JSON.stringify(update) });
    await api('integrity-a', '/api/user/integrity-b', 403, { method: 'PUT', body: JSON.stringify(update) });
    await api('integrity-a', '/api/admin/user/integrity-a', 403, { method: 'PUT', body: JSON.stringify(update) });
    // The legacy db.json admin edit is retired; it can no longer touch any profile.
    await api('admin-1', '/api/admin/user/integrity-a', 410, { method: 'PUT', body: JSON.stringify(update) });
  }
  assert.equal((await firestore('integrity-a', 'users/integrity-b')).status, 403);
  await api('integrity-a', '/api/user/integrity-b', 403);
  const progress = { userId: 'integrity-a', surahNumber: 2, ayahNumber: 5, status: 'memorized', source: 'student_recorded' };
  assert.equal((await firestore('integrity-a', 'users/integrity-a/ayah_progress/2_5', progress)).status, 200);
  assert.equal((await firestore('integrity-b', 'users/integrity-a/ayah_progress/2_5')).status, 403);
  // Even approved-looking preferences are self data and never an approval source.
  assert.equal((await firestore('integrity-a', 'users/integrity-a', { preferences: { studentDeclaredPages: [1,2], verifiedMemorizedPages: 604 } })).status, 200);
  const analytics = (await api('integrity-a', '/api/student/analytics', 200)).analytics;
  assert.equal(analytics.declaredProgress.memorized, 1);
  assert.equal(analytics.declaredProgress.classification, 'student_declared');
  assert.equal(analytics.profile.verifiedMemorizedPages, null);
  assert.equal(analytics.profile.memoryScore, null);
  assert.equal((await api('integrity-b', '/api/student/analytics', 200)).analytics.declaredProgress.totalAyahs, 0);
  const attemptId = 'integrity-practice-attempt';
  await api('integrity-a', '/api/ai/recitation-check', 200, postPractice(practicePayload(attemptId)));
  await api('integrity-a', `/api/recitation/sessions/${attemptId}/submit`, 200, postPractice({}));
  const path = `/api/teacher/integrity-teacher/student/integrity-a/sessions/${attemptId}/review`;
  await api('integrity-a', path, 403, { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) });
  await api('integrity-other-teacher', `/api/teacher/integrity-other-teacher/student/integrity-a/sessions/${attemptId}/review`, 403,
    { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) });
  await db.doc('memberships/integrity-a').update({ status: 'inactive' });
  await api('integrity-teacher', path, 403, { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) });
  await db.doc('memberships/integrity-a').update({ status: 'active' });
  const originalTransaction = db.runTransaction;
  db.runTransaction = async () => { throw new Error('Injected review persistence failure'); };
  try { assert.equal((await api('integrity-teacher', path, 503, { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) })).success, false); }
  finally { db.runTransaction = originalTransaction; }
  assert.equal((await db.doc(`users/integrity-a/recitation_sessions/${attemptId}`).get()).data().reviewStatus, 'pending');
  await api('integrity-teacher', path, 200, { method: 'PATCH', body: JSON.stringify({ decision: 'approved' }) });
  const persisted = (await db.doc(`users/integrity-a/recitation_sessions/${attemptId}`).get()).data();
  assert.equal(persisted.reviewStatus, 'approved');
  assert.equal(persisted.reviewedBy, 'integrity-teacher');
  assert.equal(persisted.classification, 'practice');
  assert.equal(persisted.rewardedXp, 0);
  const profile = (await db.doc('users/integrity-a').get()).data();
  for (const key of ['memorizedPages', 'memorizedPagesCount', 'totalJuz', 'memoryScore', 'xp']) assert.deepEqual(profile[key], before[key]);
  assert.equal((await api('integrity-a', '/api/student/analytics', 200)).analytics.profile.verifiedMemorizedPages, null);
  assert.equal((await api('admin-1', '/api/admin/memorization-performance', 200)).stats.verifiedMemorizedPages, null);
  const teacherView = (await api('integrity-teacher', '/api/teacher/integrity-teacher/student/integrity-a', 200)).student;
  assert.equal(teacherView.memorizedPagesCount, null);
  assert.equal(teacherView.recordedProgress.memorized, 1);
});

test('P1 teacher scope follows canonical active membership through transfer, leave and malformed records', async () => {
  await createAccount('scope-t1', 'teacher', {user:true,teacher:true});
  await createAccount('scope-t2', 'teacher', {user:true,teacher:true});
  await createAccount('scope-multi', 'user', {user:true,teacher:true});
  await createAccount('scope-s1', 'user', {user:true});
  await createAccount('scope-s2', 'user', {user:true});
  const group1 = (await api('admin-1', '/api/admin/groups/create', 200, postPractice({name:'Scope one',teacherId:'scope-t1'}))).group;
  const group2 = (await api('admin-1', '/api/admin/groups/create', 200, postPractice({name:'Scope two',teacherId:'scope-t2'}))).group;
  await api('scope-s1','/api/groups/join',200,postPractice({code:group1.code}));
  await api('scope-s2','/api/groups/join',200,postPractice({code:group2.code}));
  await firestore('scope-s1','users/scope-s1/ayah_progress/112_1',{userId:'scope-s1',surahNumber:112,ayahNumber:1,status:'memorized',source:'student_recorded'});
  const attempt = 'scope-pending-attempt';
  await api('scope-s1','/api/ai/recitation-check',200,postPractice(practicePayload(attempt)));
  await api('scope-s1',`/api/recitation/sessions/${attempt}/submit`,200,postPractice({}));
  const note = (await api('scope-t1','/api/teacher/scope-t1/student/scope-s1/notes',200,postPractice({text:'Scope historical note'}))).note;
  const profile = teacher => `/api/teacher/${teacher}/student/scope-s1`;
  const review = teacher => `${profile(teacher)}/sessions/${attempt}/review`;
  const writes = teacher => api(teacher,`${profile(teacher)}/notes`,403,postPractice({text:'must not persist',studentId:'scope-s2',teacherId:'scope-t2'}));
  const scopedLists = async (teacher, present) => {
    const roster = await api(teacher,`/api/teacher/${teacher}/students`,200);
    assert.equal(roster.students.some(row=>row.uid==='scope-s1'),present);
    const available = await api(teacher,`/api/teacher/${teacher}/available-students`,200);
    assert.equal(available.students.some(row=>row.uid==='scope-s1'),present);
    assert.equal(available.students.some(row=>row.uid==='admin-1'),false);
    const report = await api(teacher,`/api/teacher/${teacher}/reports`,200);
    assert.equal(report.report.students.some(row=>row.uid==='scope-s1'),present);
    const dashboard = await api(teacher,`/api/teacher/${teacher}/dashboard`,200);
    assert.equal(dashboard.recentActivities.some(row=>row.studentName==='scope-s1'),present);
  };
  await scopedLists('scope-t1',true);
  await scopedLists('scope-t2',false);
  assert.equal((await api('scope-t1',profile('scope-t1'),200)).student.recentSessions.length,1);
  assert.equal((await firestore('scope-t1',`users/scope-s1/teacher_notes/${note.id}`)).status,200);
  await api('scope-t1','/api/teacher/scope-t1/students?groupId='+group2.id,403);
  await api('scope-t1','/api/teacher/scope-t1/reports?groupId='+group2.id,403);
  await api('scope-t1','/api/teacher/scope-t1/available-students?groupId='+group2.id,403);
  await api('scope-t1','/api/teacher/scope-t2/student/scope-s2',403);
  await api('scope-multi',profile('scope-multi'),403);
  await api('scope-s1',review('scope-t1'),403,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  await api('admin-1',profile('scope-t1'),200);
  await api('multi-1',profile('scope-t1'),200);
  await api('admin-1',review('scope-t1'),403,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  await api('multi-1',review('scope-t1'),403,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  await api('admin-1','/api/admin/distribute-student',200,postPractice({studentUid:'scope-s1',groupId:group2.id,teacherId:'scope-t2'}));
  // Deliberately stale profile pointers cannot authorize the previous teacher.
  await db.doc('users/scope-s1').update({teacherId:'scope-t1',groupId:group1.id});
  await scopedLists('scope-t1',false);
  await scopedLists('scope-t2',true);
  await api('scope-t1',profile('scope-t1'),403);
  await writes('scope-t1');
  await api('scope-t1',review('scope-t1'),403,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  for (const path of ['users/scope-s1','users/scope-s1/ayah_progress/112_1',`users/scope-s1/recitation_sessions/${attempt}`,`users/scope-s1/teacher_notes/${note.id}`,'memberships/scope-s1']) {
    assert.equal((await firestore('scope-t1',path)).status,403,path);
    assert.equal((await firestore('scope-t2',path)).status,200,path);
  }
  // Pending submissions are tied to the actual assigned reviewer; the learner
  // uses the existing submit action to retarget a transferred pending attempt.
  await api('scope-t2',review('scope-t2'),409,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  await api('scope-s1',`/api/recitation/sessions/${attempt}/submit`,200,postPractice({}));
  await api('scope-t2',review('scope-t2'),200,{method:'PATCH',body:JSON.stringify({decision:'rejected'})});
  assert.equal((await db.doc(`users/scope-s1/recitation_sessions/${attempt}`).get()).data().reviewedBy,'scope-t2');
  await api('scope-t2',`${profile('scope-t2')}/notes`,200,postPractice({text:'Current teacher note'}));
  const canonical = (await db.doc('memberships/scope-s1').get()).data();
  await db.doc('groups/scope-nested/nested/forged').set({teacherId:'scope-t2',active:true});
  for (const mutation of [{status:'inactive'},{status:null},{uid:'scope-s2'},{groupId:'missing-group'},{groupId:'scope-nested/nested/forged'},{groupId:null},{teacherId:'scope-t1'}]) {
    await db.doc('memberships/scope-s1').set({...canonical,...mutation});
    await api('scope-t2',profile('scope-t2'),403);
    await writes('scope-t2');
    await api('scope-t2',review('scope-t2'),403,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
    await scopedLists('scope-t2',false);
    assert.equal((await firestore('scope-t2','users/scope-s1/ayah_progress/112_1')).status,403);
  }
  await db.doc('memberships/scope-s1').set(canonical);
  await db.doc(`groups/${group2.id}`).update({teacherId:'scope-t1'});
  await api('scope-t2',profile('scope-t2'),403);
  await api('scope-t1',profile('scope-t1'),403); // inconsistent membership is denied to both
  await db.doc(`groups/${group2.id}`).update({teacherId:'scope-t2',active:false});
  await api('scope-t2',profile('scope-t2'),403);
  await writes('scope-t2');
  await db.doc(`groups/${group2.id}`).update({active:true});
  await api('scope-t2',profile('scope-t2'),200);
  const transaction = db.runTransaction.bind(db);
  db.runTransaction = async () => { throw new Error('Injected teacher note transaction failure'); };
  try { await api('scope-t2',`${profile('scope-t2')}/notes`,503,postPractice({text:'must not persist'})); }
  finally { db.runTransaction = transaction; }
  assert.equal((await db.collection('users/scope-s1/teacher_notes').get()).size,2);
  await api('scope-s1','/api/groups/leave',200,postPractice({}));
  await db.doc('users/scope-s1').update({teacherId:'scope-t2',groupId:group2.id});
  await api('scope-t2',profile('scope-t2'),403);
  await writes('scope-t2');
  await api('scope-t2',review('scope-t2'),403,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  await scopedLists('scope-t2',false);
  assert.equal((await firestore('scope-t2',`users/scope-s1/teacher_notes/${note.id}`)).status,403);
  await api('scope-t2','/api/teacher/scope-t2/add-student',403,postPractice({studentUid:'scope-s1',groupId:group2.id}));
  await api('scope-t2','/api/teacher/scope-t2/enroll-student',403,postPractice({studentUid:'scope-s1',groupId:group2.id}));
  // Admin retains existing broad reads, but cannot impersonate a teacher action.
  await api('admin-1',profile('scope-t2'),200);
  await api('multi-1',profile('scope-t2'),200);
  assert.equal((await db.doc('users/scope-s1').get()).data().xp,100);
  const multiGroup = (await api('admin-1','/api/admin/groups/create',200,postPractice({name:'Multi assigned',teacherId:'multi-1'}))).group;
  await api('scope-s2','/api/groups/join',200,postPractice({code:multiGroup.code}));
  await api('scope-s2','/api/ai/recitation-check',200,postPractice(practicePayload('scope-multi-review')));
  await api('scope-s2','/api/recitation/sessions/scope-multi-review/submit',200,postPractice({}));
  await api('multi-1','/api/teacher/multi-1/student/scope-s2/sessions/scope-multi-review/review',200,{method:'PATCH',body:JSON.stringify({decision:'approved'})});
  await api('multi-1','/api/teacher/multi-1/student/scope-s2/notes',200,postPractice({text:'Assigned multi-role teacher note'}));
});

const emptyFortressFlags = () => ({ khatmah: false, preparation: false, newMemorization: false, nearRevision: false, farRevision: false });
async function signInAgain(uid) {
  const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${uid}@example.test`, password: 'Test-only-password-123!', returnSecureToken: true })
  });
  assert.equal(response.status, 200);
  const signedIn = await response.json();
  assert.equal(signedIn.localId, uid);
  tokens[uid] = signedIn.idToken;
}

test('fortress drafts do not write; plan save and completion atomically persist without rewards and reload after sign-in', async () => {
  const uid = 'persistence-plan-a';
  await createAccount(uid, 'user', { user: true }, {
    xp: 0, level: 1, streak: 0, earnedBadges: ['existing-award'],
    preferences: { dailyTarget: 'Keep this preference', learningStyle: 'Existing style' }
  });
  await createAccount('persistence-plan-b', 'user', { user: true });
  const profileRef = db.doc(`users/${uid}`);
  const currentPlanRef = db.doc(`users/${uid}/five_fortresses_plans/current`);
  const initialProfile = (await profileRef.get()).data();
  await api(uid, `/api/user/fortress-plan/${uid}`, 404);
  await api(uid, `/api/user/fortress-plan/${uid}`, 404);
  assert.equal((await currentPlanRef.get()).exists, false, 'reading a generated draft must not persist a plan');
  assert.deepEqual((await profileRef.get()).data(), initialProfile);

  const completionStatus = { ...emptyFortressFlags(), khatmah: true, nearRevision: true };
  const plan = { dailyTarget: 'Saved target', currentPage: 9, lastJuzReached: 1,
    customizerPreferences: { nearReviewTarget: 'Original review' }, completionStatus,
    completionDate: '1900-01-01', updatedAt: '1900-01-01T00:00:00.000Z' };
  const saved = await api(uid, '/api/user/fortress-plan', 200, postPractice({ plan }));
  assert.equal(saved.success, true);
  assert.equal(saved.persisted, true);
  assert.equal(saved.plan.userId, uid);
  assert.equal(saved.user.uid, uid);
  assert.equal(saved.plan.completionDate, ammanDateKey());
  assert.notEqual(saved.plan.updatedAt, plan.updatedAt);
  assert.deepEqual(saved.plan.completionStatus, completionStatus);
  assert.deepEqual(saved.user.preferences.fortressesToday, { 1: true, 2: false, 3: false, 4: true, 5: false });
  assert.equal(saved.user.preferences.fortressesDate, ammanDateKey());
  assert.equal(saved.user.preferences.dailyTarget, initialProfile.preferences.dailyTarget);
  assert.deepEqual((await currentPlanRef.get()).data(), saved.plan);
  const storedUser = (await profileRef.get()).data();
  assert.deepEqual(storedUser.preferences, saved.user.preferences);
  for (const field of ['uid', 'xp', 'level', 'streak', 'earnedBadges']) assert.deepEqual(storedUser[field], saved.user[field]);
  for (const field of ['memorizedPagesCount', 'totalJuz', 'memoryScore']) {
    assert.equal(saved.user[field], null, `${field} remains unavailable in API data`);
    assert.deepEqual(storedUser[field], initialProfile[field], `${field} is not modified by a fortress save`);
  }

  // AI replies are saved chat records. Generating one does not save or overwrite a fortress plan.
  const confirmedPlan = (await currentPlanRef.get()).data();
  const confirmedProfile = (await profileRef.get()).data();
  const generated = await api(uid, '/api/ai/chat', 200, postPractice({ message: 'Generate a synthetic fortress planning suggestion', userContext: { currentPage: 9 } }));
  assert.equal(generated.success, true);
  assert.deepEqual((await currentPlanRef.get()).data(), confirmedPlan);
  assert.deepEqual((await profileRef.get()).data(), confirmedProfile);

  await signInAgain(uid);
  assert.deepEqual((await api(uid, `/api/user/fortress-plan/${uid}`, 200)).plan, confirmedPlan);
  assert.deepEqual((await profileRef.get()).data().preferences.fortressesToday, saved.user.preferences.fortressesToday);
  await api('persistence-plan-b', `/api/user/fortress-plan/${uid}`, 403);
  await api('persistence-plan-b', '/api/user/fortress-plan', 403, postPractice({ plan: { userId: uid, completionStatus: emptyFortressFlags() } }));
  assert.equal((await firestore(uid, `users/${uid}/five_fortresses_plans/current`, { completionStatus: { khatmah: false } })).status, 403);

  for (const malformed of [{ khatmah: 'true' }, { unknownFortress: true }, { 1: true }]) {
    const rejected = await api(uid, '/api/user/fortress-plan', 400, postPractice({ plan: { ...plan, completionStatus: malformed } }));
    assert.equal(rejected.success, false);
    assert.deepEqual((await currentPlanRef.get()).data(), confirmedPlan);
    assert.deepEqual((await profileRef.get()).data(), confirmedProfile);
  }
  assert.equal((await profileRef.get()).data().xp, 0);
  assert.deepEqual((await profileRef.get()).data().earnedBadges, ['existing-award']);
});

test('failed fortress and quiz writes preserve confirmed values; retry persists once and fresh Auth tokens reload them', async () => {
  const uid = 'persistence-plan-a';
  const userRef = db.doc(`users/${uid}`);
  const currentPlanRef = db.doc(`users/${uid}/five_fortresses_plans/current`);
  const initialQuiz = { dominant: 'visual', percentages: { visual: 70, auditory: 10, kinesthetic: 10, analytical: 10 } };
  const firstQuiz = await api(uid, `/api/user/${uid}`, 200, {
    method: 'PUT', body: JSON.stringify({ preferences: { learningStyle: 'Visual saved style', learningProfile: initialQuiz } })
  });
  assert.equal(firstQuiz.success, true);
  assert.equal(firstQuiz.persisted, true);
  assert.equal(firstQuiz.user.uid, uid);
  assert.deepEqual(firstQuiz.user.preferences.learningProfile, initialQuiz);
  assert.equal(firstQuiz.user.preferences.dailyTarget, 'Keep this preference', 'quiz preference patches must preserve the previous plan preferences');
  assert.deepEqual(firstQuiz.user.preferences.fortressesToday, { 1: true, 2: false, 3: false, 4: true, 5: false });
  await signInAgain(uid);
  assert.deepEqual((await api(uid, `/api/user/${uid}`, 200)).user.preferences.learningProfile, initialQuiz);

  const beforePlan = (await currentPlanRef.get()).data();
  const beforeUser = (await userRef.get()).data();
  const nextQuiz = { dominant: 'auditory', percentages: { visual: 10, auditory: 70, kinesthetic: 10, analytical: 10 } };
  const nextPlan = { ...beforePlan, dailyTarget: 'Retried target', completionStatus: Object.fromEntries(Object.keys(emptyFortressFlags()).map(key => [key, true])) };
  const originalTransaction = db.runTransaction;
  db.runTransaction = async () => { throw new Error('Injected fortress/profile persistence failure'); };
  try {
    for (const [route, options] of [
      ['/api/user/fortress-plan', postPractice({ plan: nextPlan })],
      [`/api/user/${uid}`, { method: 'PUT', body: JSON.stringify({ preferences: { learningStyle: 'Unconfirmed style', learningProfile: nextQuiz } }) }]
    ]) {
      const failed = await api(uid, route, 503, options);
      assert.equal(failed.success, false);
      assert.notEqual(failed.persisted, true);
      assert.deepEqual((await currentPlanRef.get()).data(), beforePlan);
      assert.deepEqual((await userRef.get()).data(), beforeUser);
    }
  } finally { db.runTransaction = originalTransaction; }

  const retriedPlan = await api(uid, '/api/user/fortress-plan', 200, postPractice({ plan: nextPlan }));
  assert.equal(retriedPlan.persisted, true);
  const retriedQuiz = await api(uid, `/api/user/${uid}`, 200, {
    method: 'PUT', body: JSON.stringify({ preferences: { learningStyle: 'Auditory saved style', learningProfile: nextQuiz } })
  });
  assert.equal(retriedQuiz.persisted, true);
  // Repeating the same retry updates the singleton; it does not add rewards or a second plan.
  await api(uid, '/api/user/fortress-plan', 200, postPractice({ plan: nextPlan }));
  await api(uid, `/api/user/${uid}`, 200, {
    method: 'PUT', body: JSON.stringify({ preferences: { learningStyle: 'Auditory saved style', learningProfile: nextQuiz } })
  });
  assert.equal((await db.collection(`users/${uid}/five_fortresses_plans`).get()).size, 1);
  await signInAgain(uid);
  const reloadedPlan = await api(uid, `/api/user/fortress-plan/${uid}`, 200);
  const reloadedUser = await api(uid, `/api/user/${uid}`, 200);
  assert.equal(reloadedPlan.plan.dailyTarget, 'Retried target');
  assert.deepEqual(reloadedPlan.plan.completionStatus, nextPlan.completionStatus);
  assert.deepEqual(reloadedUser.user.preferences.learningProfile, nextQuiz);
  assert.deepEqual(reloadedUser.user.preferences.fortressesToday, { 1: true, 2: true, 3: true, 4: true, 5: true });
  assert.equal(reloadedUser.user.xp, beforeUser.xp);
  assert.equal(reloadedUser.user.level, beforeUser.level);
  assert.equal(reloadedUser.user.streak, beforeUser.streak);
  assert.deepEqual(reloadedUser.user.earnedBadges, beforeUser.earnedBadges);
  await api('persistence-plan-b', `/api/user/${uid}`, 403, {
    method: 'PUT', body: JSON.stringify({ preferences: { learningStyle: 'Forged style' } })
  });
});
