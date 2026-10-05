import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  canActAsTeacher,
  hasRole,
  isAdmin,
  isTeacher,
  teacherCanAccessStudent,
  teacherOwnsGroup
} from '../server/accessControl.js';
import { calculatePageRecitationStats } from '../server/recitationStats.js';
import { ammanDateKey, nextQuranActivityStreak } from '../server/quranActivityStreak.js';
import { requireAdmin } from '../server/middleware/auth.js';

const student = { uid: 'student-1', role: 'user', roles: { user: true } };
const teacher = { uid: 'teacher-1', role: 'teacher', roles: { user: true, teacher: true } };
const admin = { uid: 'admin-1', role: 'admin', roles: { user: true, admin: true } };
const multiRole = {
  uid: 'multi-1',
  role: 'user',
  roles: { user: true, teacher: true, admin: true }
};

const groups = [
  { id: 'group-1', teacherId: 'teacher-1' },
  { id: 'group-2', teacherId: 'teacher-2' },
  { id: 'group-3', teacherId: 'multi-1' }
];

function runMiddleware(middleware, user) {
  let statusCode = 200;
  let payload;
  let nextCalled = false;
  const req = { user };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    }
  };
  middleware(req, res, () => { nextCalled = true; });
  return { statusCode, payload, nextCalled };
}

test('student has no teacher or admin authority', () => {
  assert.equal(isTeacher(student), false);
  assert.equal(isAdmin(student), false);
  assert.equal(canActAsTeacher(student, student.uid), false);
  assert.equal(runMiddleware(requireAdmin, student).statusCode, 403);
});

test('teacher can act only as their own teacher identity', () => {
  assert.equal(isTeacher(teacher), true);
  assert.equal(isAdmin(teacher), false);
  assert.equal(canActAsTeacher(teacher, 'teacher-1'), true);
  assert.equal(canActAsTeacher(teacher, 'teacher-2'), false);
  assert.equal(runMiddleware(requireAdmin, teacher).statusCode, 403);
});

test('admin can administer any teacher scope', () => {
  assert.equal(isAdmin(admin), true);
  assert.equal(canActAsTeacher(admin, 'teacher-1'), true);
  assert.equal(runMiddleware(requireAdmin, admin).nextCalled, true);
});

test('multi-role account receives every role from roles map', () => {
  assert.equal(hasRole(multiRole, 'user'), true);
  assert.equal(isTeacher(multiRole), true);
  assert.equal(isAdmin(multiRole), true);
  assert.equal(canActAsTeacher(multiRole, 'multi-1'), true);
  assert.equal(canActAsTeacher(multiRole, 'teacher-1'), true);
  assert.equal(runMiddleware(requireAdmin, multiRole).nextCalled, true);
});

test('teacher group and student relationship is enforced', () => {
  assert.equal(teacherOwnsGroup(groups, 'teacher-1', 'group-1'), true);
  assert.equal(teacherOwnsGroup(groups, 'teacher-1', 'group-2'), false);
  assert.equal(
    teacherCanAccessStudent(groups, { uid: 's1', teacherId: 'teacher-1', groupId: 'group-1', status: 'active' }, 'teacher-1'),
    true
  );
  assert.equal(
    teacherCanAccessStudent(groups, { uid: 's2', teacherId: 'teacher-2', groupId: 'group-2', status: 'active' }, 'teacher-1'),
    false
  );
});

test('recitation page statistics are isolated per user', () => {
  const sessions = [
    { id: 'a', userId: 'student-1', pageNumber: 2, accuracy: 80, createdAt: '2026-10-02T10:00:00Z' },
    { id: 'b', userId: 'student-2', pageNumber: 2, accuracy: 100, createdAt: '2026-10-02T11:00:00Z' },
    { id: 'c', userId: 'student-1', pageNumber: 2, accuracy: 90, createdAt: '2026-10-02T12:00:00Z' },
    { id: 'd', userId: 'student-1', pageNumber: 3, accuracy: 20, createdAt: '2026-10-02T13:00:00Z' }
  ];

  const stats = calculatePageRecitationStats(sessions, 'student-1', 2);
  assert.equal(stats.totalAttempts, 2);
  assert.equal(stats.averageAccuracy, 85);
  assert.equal(stats.bestAccuracy, 90);
  assert.deepEqual(stats.recentAttempts.map(item => item.id), ['a', 'c']);

  const anonymousStats = calculatePageRecitationStats(sessions, null, 2);
  assert.equal(anonymousStats.totalAttempts, 0);
});

test('Firestore rules keep roles and system counters outside self-editable fields', async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  const profileUpdateBody = rules.match(/function isSafeProfileUpdate\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';
  const onboardingBody = rules.match(/function isSafeOnboardingUpdate\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';

  for (const field of ['role', 'roles', 'xp', 'level', 'streak', 'memoryScore', 'memorizedPages', 'memorizedPagesCount', 'totalJuz', 'lastActiveDate', 'lastQuranActivityDate', 'teacherId', 'groupId']) {
    assert.equal(profileUpdateBody.includes(`'${field}'`), false, field);
    assert.equal(onboardingBody.includes(`'${field}'`), false, field);
  }
  assert.match(rules, /request\.resource\.data\.role == 'user'/);
  assert.match(rules, /request\.resource\.data\.roles == \{'user': true\}/);
});

test('Quran activity streak uses the Amman calendar boundary', () => {
  assert.equal(ammanDateKey('2026-10-03T20:59:59.000Z'), '2026-10-03');
  assert.equal(ammanDateKey('2026-10-03T21:00:01.000Z'), '2026-10-04');
  assert.deepEqual(nextQuranActivityStreak({ streak: 4, lastQuranActivityDate: '2026-10-03' }, '2026-10-03T21:00:01.000Z'), {
    streak: 5, lastQuranActivityDate: '2026-10-04', changed: true
  });
});

test('teacher relationship requires canonical active membership and current group ownership', () => {
  const membership = { uid: 's1', groupId: 'group-1', teacherId: 'teacher-1', status: 'active' };
  assert.equal(teacherCanAccessStudent(groups, membership, 'teacher-1'), true);
  for (const overrides of [{status:'inactive'}, {status:undefined}, {uid:'wrong'}, {groupId:'missing'}, {teacherId:'teacher-2'}]) {
    assert.equal(teacherCanAccessStudent(groups, {...membership,...overrides}, 'teacher-1', 's1'), false);
  }
  assert.equal(teacherCanAccessStudent([{id:'group-1', teacherId:'teacher-2'}], membership, 'teacher-1'), false);
  assert.equal(teacherCanAccessStudent([{id:'group-1', teacherId:'teacher-1',active:false}], membership, 'teacher-1'), false);
  assert.equal(teacherCanAccessStudent(groups, {uid:'s1',teacherId:'teacher-1',groupId:'group-1'}, 'teacher-1'), false);
});
