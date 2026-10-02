import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { createServer as createViteServer } from 'vite';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { validateEmulatorEnvironment } from '../server/emulatorSafety.js';

assert.equal(validateEmulatorEnvironment(), true);
assert.equal(process.env.VITE_MA7FATH_EMULATOR, '1');
const password = 'Browser-test-only-123!';
const names = { admin: 'إدارة اختبار المتصفح', teacher1: 'معلمة اختبار أولى', teacher2: 'معلمة اختبار ثانية', student: 'طالبة رحلة المتصفح', applicant: 'طالبة طلب المتصفح', multi: 'حساب متعدد الأدوار' };
const uids = Object.fromEntries(Object.keys(names).map(key => [key, `browser-${key}`]));
const evidence = { project: process.env.GCLOUD_PROJECT, date: '2026-10-02', steps: [], externalRequestsBlocked: 0,
  pendingRequestSource: 'synthetic fixture; submission UI is not tested', practiceReferenceSource: 'one-verse page fixture; not a verified Quran page' };
const sourceFiles = ['server/db.json', 'server/safar_data.json'];
const hashes = {};
const hash = data => createHash('sha256').update(data).digest('hex');
let db, auth, server, vite, browser, temporary, baseUrl;
const pages = {};
const reportDir = path.resolve('reports/browser-groups');

async function checkpoint(page, stage) {
  await mkdir(reportDir, { recursive: true });
  await page.screenshot({ path: path.join(reportDir, `${stage}.png`), fullPage: false });
  evidence.steps.push(stage);
  console.log(`UI checkpoint: ${stage}`);
}
async function login(page, key) {
  await page.goto(baseUrl);
  await page.getByRole('button', { name: 'ابدأ الآن', exact: true }).click();
  await page.getByRole('button', { name: 'تسجيل الدخول هنا', exact: true }).click();
  await page.locator('#email-field').fill(`${uids[key]}@example.test`);
  await page.locator('#password-field').fill(password);
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function teacherRoster(page) {
  await page.locator('#sidebar-nav-teacher-students').click();
  await expect(page.getByRole('heading', { name: 'سجل طالبات المجموعة' })).toBeVisible();
}
async function refresh(page) {
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function idToken(key) {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-test', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: `${uids[key]}@example.test`, password, returnSecureToken: true })
  });
  const payload = await response.json();
  assert.equal(response.ok, true, JSON.stringify(payload));
  return payload.idToken;
}
async function api(key, pathname, options = {}) {
  const response = await fetch(`${baseUrl}/api${pathname}`, {
    ...options,
    headers: { authorization: `Bearer ${await idToken(key)}`, 'content-type': 'application/json', ...(options.headers || {}) }
  });
  return response;
}

test.before(async () => {
  for (const file of sourceFiles) hashes[file] = hash(await readFile(file));
  temporary = await mkdtemp(path.join(tmpdir(), 'ma7fath-ui-data-'));
  process.env.MA7FATH_TEST_DATA_DIR = temporary;
  process.env.VERCEL = '1';
  ({ db } = await import('../server/middleware/auth.js'));
  const { getAuth } = await import('firebase-admin/auth');
  auth = getAuth();
  for (const key of Object.keys(names)) {
    await auth.createUser({ uid: uids[key], email: `${uids[key]}@example.test`, password, displayName: names[key] });
    const role = key === 'admin' ? 'admin' : 'user';
    const roles = key === 'admin' ? { user: true, admin: true } : key === 'multi' ? { user: true, teacher: true, admin: true } : { user: true };
    await db.doc(`users/${uids[key]}`).set({ uid: uids[key], name: names[key], email: `${uids[key]}@example.test`, photoURL: '',
      role, roles,
      hasCompletedWizard: true, preferences: { dailyTarget: 'صفحة واحدة يومياً', language: 'ar' },
      xp: 100, level: 1, streak: 1, memoryScore: 100, memorizedPagesCount: 0, totalJuz: 0 });
  }
  await db.doc(`enrollmentRequests/${uids.applicant}`).set({ submittedBy: uids.applicant, name: names.applicant,
    email: `${uids.applicant}@example.test`, status: 'pending', requestDate: '2026-10-02', memorizedJuz: 0 });
  await writeFile(path.join(temporary, 'db.json'), JSON.stringify({ users: [] }));
  await writeFile(path.join(temporary, 'safar_data.json'), JSON.stringify({ groups: [], teachers: [], students: [], independentUsers: [], enrollmentRequests: [] }));
  const { default: app } = await import('../server/index.js');
  vite = await createViteServer({ mode: 'emulator', server: { middlewareMode: true, hmr: false }, appType: 'spa' });
  app.use(vite.middlewares);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  evidence.browserVersion = browser.version();
  for (const key of ['admin', 'teacher1', 'teacher2', 'student', 'multi']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', locale: 'ar-JO' });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return route.continue();
      evidence.externalRequestsBlocked++;
      return route.abort();
    });
    pages[key] = await context.newPage();
    pages[key].on('pageerror', error => console.log(`UI error ${key}: ${error.message}`));
  }
});

test.after(async () => {
  if (browser && !evidence.passed) {
    await mkdir(reportDir, { recursive: true });
    for (const [key, page] of Object.entries(pages)) {
      console.log(`FAILED DOM ${key}`, (await page.locator('body').innerText().catch(() => '')).slice(0, 2500));
      await page.screenshot({ path: path.join(reportDir, `failure-${key}.png`) }).catch(() => {});
    }
  }
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (vite) await vite.close();
  if (db) await db.terminate();
  if (temporary) await rm(temporary, { recursive: true, force: true });
  for (const file of sourceFiles) assert.equal(hash(await readFile(file)), hashes[file], `${file} unchanged`);
  evidence.sourceHashesUnchanged = true;
  if (evidence.passed) {
    for (const key of Object.keys(pages)) await rm(path.join(reportDir, `failure-${key}.png`), { force: true });
  }
  await mkdir(reportDir, { recursive: true });
  await writeFile(path.join(reportDir, 'result.json'), JSON.stringify(evidence, null, 2));
  if (process.env.MA7FATH_EMULATOR_RESULT) await writeFile(process.env.MA7FATH_EMULATOR_RESULT, 'completed');
});

test('actual browser group journey: roles, groups, join, reload, transfer, logout, leave, approval', { timeout: 180000 }, async () => {
  const admin = pages.admin;
  await login(admin, 'admin');
  await admin.locator('#sidebar-nav-admin-users').click();
  for (const key of ['teacher1', 'teacher2']) {
    const row = admin.getByTestId(`user-${uids[key]}`);
    await row.getByRole('button', { name: 'تعيين كمعلمة', exact: true }).click();
    await admin.getByRole('button', { name: 'تأكيد العملية', exact: true }).click();
    await expect.poll(async () => (await db.doc(`users/${uids[key]}`).get()).data().roles.teacher).toBe(true);
  }
  await checkpoint(admin, '01-teacher-roles');
  await admin.getByRole('button', { name: 'توزيع الطالبات والانتساب 🌿', exact: true }).click();
  for (const [key, name] of [['teacher1', 'حلقة المتصفح الأولى'], ['teacher2', 'حلقة المتصفح الثانية']]) {
    await admin.getByRole('button', { name: 'إنشاء حلقة', exact: true }).click();
    await admin.getByPlaceholder('مثال: حلقة النور').fill(name);
    await admin.getByLabel('المعلمة المشرفة', { exact: true }).selectOption(uids[key]);
    await admin.getByRole('button', { name: 'حفظ وإنشاء الحلقة', exact: true }).click();
    await expect(admin.getByPlaceholder('مثال: حلقة النور')).toHaveCount(0);
    await expect(admin.getByText('تم إنشاء الحلقة', { exact: true })).toBeVisible();
  }
  const groups = (await db.collection('groups').get()).docs.map(doc => ({ ...doc.data(), id: doc.id }));
  assert.equal(groups.length, 2);
  const first = groups.find(g => g.teacherId === uids.teacher1);
  const second = groups.find(g => g.teacherId === uids.teacher2);
  await admin.locator('#sidebar-nav-admin-groups').click();
  await expect(admin.getByText(first.name, { exact: true })).toBeVisible();
  await expect(admin.getByText(second.name, { exact: true })).toBeVisible();
  const displayedCode = await admin.getByTestId(`group-${first.id}`).getByTestId('group-code').innerText();
  assert.equal(displayedCode, first.code);
  await checkpoint(admin, '02-created-groups');
  await login(pages.student, 'student');
  await pages.student.getByRole('button', { name: 'انضمام لحلقة', exact: true }).click();
  await pages.student.getByRole('button', { name: 'انضم إلى حلقة (رمز دعوة)', exact: true }).click();
  await pages.student.getByPlaceholder('رمز الدعوة من المعلم').fill(displayedCode);
  await pages.student.getByRole('button', { name: 'التحقق والبحث عن الحلقة', exact: true }).click();
  await expect(pages.student.getByText(first.name, { exact: true })).toBeVisible();
  await pages.student.getByRole('button', { name: 'تأكيد الانضمام للحلقة', exact: true }).click();
  await expect(pages.student.getByText(`عضوة مسجلة في ${first.name} 🌸`, { exact: true })).toBeVisible();
  await pages.student.getByRole('button', { name: 'إدارة عضوية الحلقة', exact: true }).click();
  await expect(pages.student.getByRole('button', { name: 'المتابعة كحافظ مستقل دون حلقة', exact: true })).toBeVisible();
  await pages.student.getByRole('button', { name: 'إغلاق نافذة الحلقة', exact: true }).click();
  await refresh(pages.student);
  await expect(pages.student.getByText(`عضوة مسجلة في ${first.name} 🌸`, { exact: true })).toBeVisible();
  await checkpoint(pages.student, '03-student-joined-reloaded');
  await login(pages.teacher1, 'teacher1');
  await pages.teacher1.locator('#sidebar-nav-teacher-groups').click();
  await expect(pages.teacher1.getByText(first.code, { exact: true })).toBeVisible();
  await pages.teacher1.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await pages.teacher1.getByRole('button', { name: 'نسخ الرمز', exact: true }).click();
  assert.equal(await pages.teacher1.evaluate(() => navigator.clipboard.readText()), displayedCode);
  await teacherRoster(pages.teacher1);
  await expect(pages.teacher1.getByText(names.student, { exact: true })).toBeVisible();
  await refresh(pages.teacher1);
  await teacherRoster(pages.teacher1);
  await expect(pages.teacher1.getByText(names.student, { exact: true })).toBeVisible();
  await checkpoint(pages.teacher1, '04-teacher-roster');
  await refresh(admin);
  await admin.getByRole('button', { name: 'توزيع الطالبات والانتساب 🌿', exact: true }).click();
  await admin.getByTestId(`distribution-student-${uids.student}`).getByRole('button', { name: 'نقل لمجموعة أخرى', exact: true }).click();
  await admin.getByLabel('اختر المجموعة المستهدفة:').selectOption(second.id);
  await admin.getByRole('button', { name: 'تأكيد التوزيع والحفظ 🌿', exact: true }).click();
  await expect(admin.getByText('تم نقل الطالب', { exact: true })).toBeVisible();
  await refresh(pages.student);
  await expect(pages.student.getByText(`عضوة مسجلة في ${second.name} 🌸`, { exact: true })).toBeVisible();
  await refresh(pages.teacher1);
  await teacherRoster(pages.teacher1);
  await expect(pages.teacher1.getByText(names.student, { exact: true })).toHaveCount(0);
  await login(pages.teacher2, 'teacher2');
  await teacherRoster(pages.teacher2);
  await expect(pages.teacher2.getByText(names.student, { exact: true })).toBeVisible();
  await checkpoint(pages.teacher2, '05-transferred-teacher-roster');
  await pages.student.getByTitle('تسجيل الخروج', { exact: true }).click();
  await expect(pages.student).toHaveURL(baseUrl + '/');
  await login(pages.student, 'student');
  await expect(pages.student.getByText(`عضوة مسجلة في ${second.name} 🌸`, { exact: true })).toBeVisible();
  await pages.student.getByRole('button', { name: 'إدارة عضوية الحلقة', exact: true }).click();
  await pages.student.getByRole('button', { name: 'المتابعة كحافظ مستقل دون حلقة', exact: true }).click();
  await expect(pages.student.getByRole('button', { name: 'انضمام لحلقة', exact: true })).toBeVisible();
  await refresh(pages.student);
  await expect(pages.student.getByRole('button', { name: 'انضمام لحلقة', exact: true })).toBeVisible();
  await refresh(pages.teacher2);
  await teacherRoster(pages.teacher2);
  await expect(pages.teacher2.getByText(names.student, { exact: true })).toHaveCount(0);
  await checkpoint(pages.student, '06-left-group-reloaded');
  await refresh(admin);
  await admin.getByRole('button', { name: 'توزيع الطالبات والانتساب 🌿', exact: true }).click();
  await admin.getByTestId(`request-${uids.applicant}`).getByRole('button', { name: 'توزيع وتعيين الطالبة الآن 🎯', exact: true }).click();
  await admin.getByLabel('اختر المجموعة المستهدفة:').selectOption(first.id);
  await admin.getByRole('button', { name: 'تأكيد التوزيع والحفظ 🌿', exact: true }).click();
  await expect(admin.getByText('تم قبول الطلب', { exact: true })).toBeVisible();
  await expect(admin.getByTestId(`request-${uids.applicant}`)).toContainText(`عضوة في ${first.name}`);
  await refresh(pages.teacher1);
  await teacherRoster(pages.teacher1);
  await expect(pages.teacher1.getByText(names.applicant, { exact: true })).toBeVisible();
  assert.equal((await db.doc(`memberships/${uids.student}`).get()).exists, false);
  assert.equal((await db.doc(`memberships/${uids.applicant}`).get()).data().groupId, first.id);
  await checkpoint(pages.teacher1, '07-approved-request-roster');
  await pages.student.getByTitle('تسجيل الخروج', { exact: true }).click();
  await expect(pages.student).toHaveURL(baseUrl + '/');
  await login(pages.student, 'applicant');
  await expect(pages.student.getByText(`عضوة مسجلة في ${first.name} 🌸`, { exact: true })).toBeVisible();
  await refresh(pages.student);
  await expect(pages.student.getByText(`عضوة مسجلة في ${first.name} 🌸`, { exact: true })).toBeVisible();
  await checkpoint(pages.student, '08-approved-student-reloaded');
  evidence.groupsPassed = true;
});

test('browser practice attempts persist once and show real teacher/admin counts, zero and failure states', { timeout: 180000 }, async () => {
  assert.equal(evidence.groupsPassed, true);
  const student = pages.student;
  const teacher = pages.teacher1;
  const admin = pages.admin;
  await teacher.getByText(names.applicant, { exact: true }).click();
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  await expect(teacher.getByTestId('student-practice-count')).toHaveText('0');
  await expect(teacher.getByTestId('student-practice-average')).toHaveText('—');
  await expect(teacher.getByTestId('student-practice-empty')).toBeVisible();
  await admin.getByRole('button', { name: 'تحليلات الحفظ والإتقان 📊', exact: true }).click();
  await expect(admin.getByTestId('performance-totalRecitationSessions')).toHaveText('٠');
  await expect(admin.getByTestId('performance-averageAccuracy')).toHaveText('—');
  await student.context().route('https://api.alquran.cloud/v1/page/**', route => route.fulfill({
    status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ code: 200, data: { ayahs: [{ number: 8, numberInSurah: 1, text: 'الم', surah: { number: 2, name: 'البقرة' } }] } })
  }));
  await student.getByRole('button', { name: 'ابدأ التسميع والقراءة الآن', exact: true }).click();
  await expect(student.getByText('﴿ الم ﴾', { exact: true })).toBeVisible();
  await student.getByRole('button', { name: '📖 تسميع الصفحة 2 كاملة 🎯', exact: true }).click();
  await student.getByRole('button', { name: 'تسميع كتابي', exact: true }).click();
  await student.locator('textarea').fill('كلمات مختلفة');
  const submit = student.getByRole('button', { name: 'فحص وتصحيح التسميع الكتابي', exact: true });
  await submit.click();
  await expect(student.getByText('تم حفظ محاولة التسميع في سجلك', { exact: true })).toBeVisible();
  const collection = db.collection(`users/${uids.applicant}/recitation_sessions`);
  await expect.poll(async () => (await collection.get()).size).toBe(1);
  const saved = (await collection.get()).docs[0].data();
  assert.equal(saved.accuracy, 0);
  assert.equal(saved.rewardedXp, 0);
  await submit.click();
  await expect(student.getByText('تم حفظ محاولة التسميع في سجلك', { exact: true })).toBeVisible();
  assert.equal((await collection.get()).size, 1);
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().xp, 100);
  await checkpoint(student, '09-practice-zero-idempotent');
  await refresh(teacher);
  await teacherRoster(teacher);
  await teacher.getByText(names.applicant, { exact: true }).click();
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  await expect(teacher.getByTestId('student-practice-count')).toHaveText('1');
  await expect(teacher.getByTestId('student-practice-average')).toHaveText('0%');
  await expect(teacher.getByTestId(`student-practice-${saved.id}`)).toBeVisible();
  await checkpoint(teacher, '10-teacher-practice-zero');
  await admin.getByRole('button', { name: 'تحديث التقرير', exact: true }).click();
  await expect(admin.getByTestId('performance-totalRecitationSessions')).toHaveText('١');
  await expect(admin.getByTestId('performance-averageAccuracy')).toHaveText('٠%');
  await admin.route('**/api/admin/memorization-performance', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Injected report failure' }) }));
  await admin.getByRole('button', { name: 'تحديث التقرير', exact: true }).click();
  await expect(admin.getByRole('alert')).toBeVisible();
  await expect(admin.getByTestId('performance-totalRecitationSessions')).toHaveCount(0);
  await admin.unroute('**/api/admin/memorization-performance');
  await admin.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(admin.getByTestId('performance-averageAccuracy')).toHaveText('٠%');
  await checkpoint(admin, '11-admin-practice-zero-retry');
  await student.route('**/api/ai/recitation-check', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'تعذر حفظ المحاولة الاختبارية' }) }));
  await student.locator('textarea').fill('الم');
  await submit.click();
  await expect(student.getByText('تعذر حفظ المحاولة الاختبارية', { exact: true })).toBeVisible();
  await expect(student.getByText('تم حفظ محاولة التسميع في سجلك', { exact: true })).toHaveCount(0);
  assert.equal((await collection.get()).size, 1);
  await student.unroute('**/api/ai/recitation-check');
  await submit.click();
  await expect(student.getByText('تم حفظ محاولة التسميع في سجلك', { exact: true })).toBeVisible();
  assert.equal((await collection.get()).size, 2);
  await student.getByTitle('تسجيل الخروج', { exact: true }).click();
  await expect(student).toHaveURL(baseUrl + '/');
  await login(student, 'applicant');
  await student.getByRole('button', { name: 'ابدأ التسميع والقراءة الآن', exact: true }).click();
  await expect.poll(async () => (await db.doc(`users/${uids.applicant}/page_progress/2`).get()).data()?.totalAttempts).toBe(2);
  await expect(student.getByText('(أعلى نتيجة: 100% • 2 محاولات مسجلة)', { exact: true })).toBeVisible();
  await checkpoint(student, '12-practice-after-sign-in');
  evidence.practicePassed = true;
  evidence.practicePassed = true;
});

test('browser roles, Firestore community notifications, and Storage profile photo journeys', { timeout: 180000 }, async () => {
  assert.equal(evidence.practicePassed, true);
  const owner = pages.student;
  const multi = pages.multi;

  await login(multi, 'multi');
  const switcher = multi.locator('#active-role-switcher');
  await expect(switcher).toHaveValue('user');
  await expect(multi.locator('#sidebar-nav-community')).toBeVisible();
  await switcher.selectOption('teacher');
  await expect(multi.locator('#sidebar-nav-teacher-dashboard')).toBeVisible();
  await expect(multi.locator('#sidebar-nav-community')).toHaveCount(0);
  await switcher.selectOption('admin');
  await expect(multi.locator('#sidebar-nav-admin-dashboard')).toBeVisible();
  await expect(multi.locator('#sidebar-nav-teacher-dashboard')).toHaveCount(0);
  await refresh(multi);
  await expect(multi.locator('#active-role-switcher')).toHaveValue('admin');
  await multi.locator('#active-role-switcher').selectOption('user');
  await expect(multi.locator('#sidebar-nav-community')).toBeVisible();
  assert.deepEqual((await db.doc(`users/${uids.multi}`).get()).data().roles, { user: true, teacher: true, admin: true });
  assert.equal((await api('student', '/admin/overview')).status, 403);
  assert.equal((await api('multi', '/admin/overview')).status, 200);
  await checkpoint(multi, '13-multirole-user-surface');

  await owner.locator('#sidebar-nav-community').click();
  const content = 'منشور تكامل حقيقي من واجهة Chrome';
  await owner.getByLabel('نص المنشور الجديد').fill(content);
  await owner.getByRole('button', { name: 'نشر المشاركة', exact: true }).click();
  await expect(owner.getByTestId('community-feedback')).toContainText('Firestore');
  const postSnapshot = await db.collection('community_posts').where('content', '==', content).get();
  assert.equal(postSnapshot.size, 1);
  const postId = postSnapshot.docs[0].id;
  assert.equal(postSnapshot.docs[0].data().authorId, uids.applicant);
  await refresh(owner);
  await owner.locator('#sidebar-nav-community').click();
  await expect(owner.getByTestId(`community-post-${postId}`)).toContainText(content);

  await multi.locator('#sidebar-nav-community').click();
  const otherPost = multi.getByTestId(`community-post-${postId}`);
  await expect(otherPost).toContainText(content);
  await expect(otherPost.getByRole('button', { name: 'تعديل المنشور' })).toHaveCount(0);
  assert.equal((await api('student', `/community/posts/${postId}`, { method: 'PUT', body: JSON.stringify({ content: 'تزوير' }) })).status, 403);
  assert.equal((await api('student', `/community/posts/${postId}`, { method: 'DELETE' })).status, 403);
  await otherPost.getByRole('button', { name: `إعجاب بالمنشور ${postId}` }).click();
  await otherPost.getByPlaceholder('اكتب تجربتك، إجابتك، أو دعاءك...').fill('تعليق تكامل حقيقي');
  await otherPost.getByRole('button', { name: `إرسال تعليق على المنشور ${postId}` }).click();
  await expect(otherPost).toContainText('تعليق تكامل حقيقي');
  await expect.poll(async () => (await db.collection(`users/${uids.applicant}/notifications`).get()).size).toBe(2);
  assert.equal((await api('multi', '/notifications')).status, 200);
  const ownerNotifications = await db.collection(`users/${uids.applicant}/notifications`).get();
  const foreignNotificationId = ownerNotifications.docs[0].id;
  assert.equal((await api('multi', `/notifications/${foreignNotificationId}/read`, { method: 'PATCH' })).status, 404);

  await owner.getByLabel('فتح مركز الإشعارات').click();
  await expect(owner.getByText('إعجاب جديد بمنشورك', { exact: true })).toBeVisible();
  await expect(owner.getByText('تعليق جديد على منشورك', { exact: true })).toBeVisible();
  await owner.getByRole('button', { name: 'مقروء للكل', exact: true }).click();
  await expect.poll(async () => (await db.collection(`users/${uids.applicant}/notifications`).where('read', '==', false).get()).size).toBe(0);
  await owner.getByLabel('فتح مركز الإشعارات').click();
  const ownerPost = owner.getByTestId(`community-post-${postId}`);
  await ownerPost.getByRole('button', { name: 'تعديل المنشور' }).click();
  await ownerPost.getByLabel('نص تعديل المنشور').fill('منشور معدل ومحفوظ فعليًا');
  await ownerPost.getByRole('button', { name: 'حفظ التعديل', exact: true }).click();
  await expect(ownerPost).toContainText('منشور معدل ومحفوظ فعليًا');
  await checkpoint(owner, '14-community-notifications-read');

  await owner.locator('#sidebar-user-profile-card').click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await owner.getByLabel('اختيار صورة شخصية').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
  await expect(owner.getByTestId('profile-success')).toBeVisible({ timeout: 20000 });
  const savedPhoto = (await db.doc(`users/${uids.applicant}`).get()).data().photoURL;
  assert.match(savedPhoto, /127\.0\.0\.1:9199|localhost:9199/);
  await expect(owner.getByTestId('profile-photo-preview')).toHaveAttribute('src', savedPhoto);
  await owner.getByRole('button', { name: 'إلغاء', exact: true }).click();
  await expect(owner.getByTestId('sidebar-profile-photo')).toHaveAttribute('src', savedPhoto);
  await refresh(owner);
  await expect(owner.getByTestId('sidebar-profile-photo')).toHaveAttribute('src', savedPhoto);
  await owner.getByTitle('تسجيل الخروج', { exact: true }).click();
  await login(owner, 'applicant');
  await expect(owner.getByTestId('sidebar-profile-photo')).toHaveAttribute('src', savedPhoto);
  assert.equal((await db.doc(`users/${uids.multi}`).get()).data().photoURL, '');

  await owner.locator('#sidebar-user-profile-card').click();
  await owner.getByLabel('اختيار صورة شخصية').setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(owner.getByTestId('profile-error')).toBeVisible({ timeout: 20000 });
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().photoURL, savedPhoto);
  await owner.getByRole('button', { name: 'إلغاء', exact: true }).click();
  await expect(owner.getByTestId('sidebar-profile-photo')).toHaveAttribute('src', savedPhoto);

  await owner.locator('#sidebar-nav-community').click();
  await owner.getByTestId(`community-post-${postId}`).getByRole('button', { name: 'حذف المنشور' }).click();
  await expect(owner.getByTestId(`community-post-${postId}`)).toHaveCount(0);
  assert.equal((await db.doc(`community_posts/${postId}`).get()).exists, false);
  await expect.poll(async () => (await db.collection(`users/${uids.applicant}/notifications`).where('postId', '==', postId).get()).size).toBe(0);
  await checkpoint(owner, '15-profile-photo-persisted-failure-retained');
  evidence.rolesPassed = true;
  evidence.communityPassed = true;
  evidence.profilePhotoPassed = true;
});

test('student plan and recorded ayah progress persist and reach teacher and admin without XP', { timeout: 120000 }, async () => {
  assert.equal(evidence.profilePhotoPassed, true);
  const student = pages.student;
  const teacher = pages.teacher1;
  const admin = pages.admin;
  const before = (await db.doc(`users/${uids.applicant}`).get()).data();

  await student.locator('#sidebar-nav-home').click();
  await student.getByRole('button', { name: 'تعديل الخطة', exact: true }).click();
  await student.getByTestId('plan-unit-surahs').click();
  await student.getByTestId('plan-mode-manual').click();
  await student.getByLabel('مستهدف الحفظ الجديد اليومي').fill('3 آيات');
  await student.getByLabel('مستهدف المراجعة القديمة اليومي').fill('7 آيات');
  await student.getByTestId('save-plan').click();
  await expect(student.getByTestId('plan-save-success')).toBeVisible();
  await expect.poll(async () => (await db.doc(`users/${uids.applicant}`).get()).data().preferences?.manualNewTarget).toBe('3 آيات');

  await student.locator('#sidebar-nav-quran-map').click();
  await student.getByLabel('رقم السورة للتقدم').fill('2');
  await student.getByLabel('رقم الآية للتقدم').fill('5');
  await student.getByLabel('حالة تقدم الآية').selectOption('review');
  await student.getByTestId('save-ayah-progress').click();
  await expect(student.getByTestId('ayah-progress-feedback')).toContainText('Firestore');
  await expect(student.getByTestId('ayah-progress-count')).toContainText('1');
  const ayahPath = `users/${uids.applicant}/ayah_progress/2_5`;
  await expect.poll(async () => (await db.doc(ayahPath).get()).data()?.status).toBe('review');
  let after = (await db.doc(`users/${uids.applicant}`).get()).data();
  assert.equal(after.xp, before.xp);
  assert.equal(after.memorizedPagesCount, before.memorizedPagesCount);

  await student.getByTitle('تسجيل الخروج', { exact: true }).click();
  await login(student, 'applicant');
  await student.getByRole('button', { name: 'تعديل الخطة', exact: true }).click();
  await expect(student.getByTestId('plan-unit-surahs')).toHaveAttribute('aria-pressed', 'true');
  await expect(student.getByLabel('مستهدف الحفظ الجديد اليومي')).toHaveValue('3 آيات');
  await student.locator('#sidebar-nav-quran-map').click();
  await expect(student.getByTestId('ayah-progress-count')).toContainText('1');
  await checkpoint(student, '16-plan-ayah-after-sign-in');

  await refresh(teacher);
  await teacherRoster(teacher);
  await teacher.getByText(names.applicant, { exact: true }).click();
  await expect(teacher.getByTestId('teacher-plan-unit')).toHaveText('surahs');
  await expect(teacher.getByTestId('teacher-plan-mode')).toHaveText('manual');
  await expect(teacher.getByTestId('teacher-plan-target')).toHaveText('3 آيات');
  await expect(teacher.getByTestId('teacher-recorded-ayahs')).toHaveText('1');
  await checkpoint(teacher, '17-teacher-plan-ayah-progress');

  await refresh(admin);
  await admin.getByRole('button', { name: 'تحليلات الحفظ والإتقان 📊', exact: true }).click();
  await expect(admin.getByTestId('performance-totalRecordedAyahs')).toHaveText('١');
  await expect(admin.getByTestId('performance-learnersWithRecordedProgress')).toHaveText('١');
  await checkpoint(admin, '18-admin-recorded-ayah-report');
  after = (await db.doc(`users/${uids.applicant}`).get()).data();
  assert.equal(after.xp, before.xp);
  assert.equal(after.memorizedPagesCount, before.memorizedPagesCount);
  assert.equal((await db.doc(ayahPath).get()).data().source, 'student_recorded');
  evidence.learningPlanPassed = true;
  evidence.ayahProgressPassed = true;
  evidence.passed = true;
});
