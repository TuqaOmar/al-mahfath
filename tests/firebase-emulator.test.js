import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateEmulatorEnvironment } from '../server/emulatorSafety.js';

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
const sourceFiles = ['server/db.json', 'server/safar_data.json'];
const digest = data => createHash('sha256').update(data).digest('hex');
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
  for (const file of sourceFiles) originalHashes[file] = digest(await readFile(file));
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
  for (const file of sourceFiles) assert.equal(digest(await readFile(file)), originalHashes[file], `${file} remained unchanged`);
  if (process.env.MA7FATH_EMULATOR_RESULT) await writeFile(process.env.MA7FATH_EMULATOR_RESULT, 'completed');
});

test('rules deny self promotion, system counters, and membership edits', async () => {
  for (const update of [
    { role: 'admin' }, { roles: { user: true, admin: true } }, { roles: { user: true, teacher: true } },
    ...['xp', 'level', 'streak', 'memoryScore'].map(field => ({ [field]: 999 })),
    { lastActiveDate: '2099-01-01' }, { groupId: 'group-2' }, { teacherId: 'teacher-2' },
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
});

const practicePayload = (sessionId, extra = {}) => ({
  sessionId, autoSave: true, pageNumber: 604, surahNumber: 112,
  surahName: 'الإخلاص', ayahNumber: 6222, expectedText: 'قل هو الله أحد',
  spokenText: 'قل هو الله أحد', ...extra
});
const postPractice = body => ({ method: 'POST', body: JSON.stringify(body) });

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
  assert.equal(first.savedSession.referenceVerified, false);
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
  assert.deepEqual((await db.doc('users/practice-student').get()).data(), profileBefore);
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
    assert.equal(report.stats.verifiedMemorizedPages, 0);
    assert.equal(report.referenceVerified, false);
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
