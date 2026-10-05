import { readFileSync, writeFileSync } from 'node:fs';

const target = 'tests/firebase-emulator.test.js';
const content = readFileSync(target, 'utf8');

const newTests = `
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
  await db.doc('users/metrics-student-1').update({ currentSurah: '\u0627\u0644\u0628\u0642\u0631\u0629' });
  const withSurah = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/students', 200);
  assert.equal(withSurah.students.find(s => s.uid === 'metrics-student-1').currentSurah, '\u0627\u0644\u0628\u0642\u0631\u0629');
  await db.doc('users/metrics-student-1').update({ currentSurah: null });

  // After setting the denormalized fields they must come back as numbers not null.
  await db.doc('users/metrics-student-1').update({ consistencyRate: 85, thisWeekSessions: 3 });
  const withFields = await api('metrics-teacher-1', '/api/teacher/metrics-teacher-1/students', 200);
  const sf = withFields.students.find(s => s.uid === 'metrics-student-1');
  assert.equal(sf.consistencyRate, 85);
  assert.equal(sf.thisWeekSessions, 3);
  await db.doc('users/metrics-student-1').update({ consistencyRate: null, thisWeekSessions: null });
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
`;

writeFileSync(target, content + newTests, 'utf8');
console.log('done');
