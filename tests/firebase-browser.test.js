import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { createServer as createViteServer } from 'vite';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { validateEmulatorEnvironment } from '../server/emulatorSafety.js';
import { ammanDateKey } from '../server/quranActivityStreak.js';

assert.equal(validateEmulatorEnvironment(), true);
assert.equal(process.env.VITE_MA7FATH_EMULATOR, '1');
const password = 'Browser-test-only-123!';
const names = { admin: 'إدارة اختبار المتصفح', teacher1: 'معلمة اختبار أولى', teacher2: 'معلمة اختبار ثانية', student: 'طالبة رحلة المتصفح', applicant: 'طالبة طلب المتصفح', multi: 'حساب متعدد الأدوار' };
const uids = Object.fromEntries(Object.keys(names).map(key => [key, `browser-${key}`]));
const evidence = { project: process.env.GCLOUD_PROJECT, date: ammanDateKey(new Date()), steps: [], externalRequestsBlocked: 0,
  pendingRequestSource: 'synthetic fixture; submission UI is not tested', practiceReferenceSource: 'bundled quran-uthmani server corpus shared by browser display and recitation' };
const sourceFiles = ['server/db.json', 'server/safar_data.json', 'server/db.backup.json', 'server/safar_data.backup.json'];
const hashes = {};
const hash = data => createHash('sha256').update(data).digest('hex');
let db, auth, server, vite, browser, temporary, baseUrl;
const pages = {};
const reportDir = path.resolve(process.env.MA7FATH_BROWSER_REPORT_DIR || 'reports/browser-groups');

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
// Logout lives in the top-bar settings menu (web and mobile).
async function logout(page) {
  await page.locator('#quick-settings-trigger-btn').click();
  await page.locator('#menu-logout-btn').click();
}
// Account refresh lives in the same settings menu.
async function refreshAccount(page) {
  await page.locator('#quick-settings-trigger-btn').click();
  await page.getByTestId('dashboard-refresh').click();
}
async function teacherRoster(page) {
  await page.locator('#sidebar-nav-teacher-students').click();
  await expect(page.getByRole('heading', { name: 'سجل طالبات المجموعة' })).toBeVisible();
}
async function refresh(page) {
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  // URL restoration alone precedes Firebase hydration. Wait for the authenticated UI.
  await expect(page.locator('[id^="sidebar-nav-"]').first()).toBeVisible();
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
const localizedNumber = text => Number(String(text).replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)).replace(/[^0-9.-]/g, ''));
async function api(key, pathname, options = {}) {
  const response = await fetch(`${baseUrl}/api${pathname}`, {
    ...options,
    headers: { authorization: `Bearer ${await idToken(key)}`, 'content-type': 'application/json', ...(options.headers || {}) }
  });
  return response;
}

// A repository data file may be absent (e.g. local backups removed); it must then stay absent.
const fileHash = file => readFile(file).then(hash, error => { if (error.code === 'ENOENT') return 'absent'; throw error; });

test.before(async () => {
  for (const file of sourceFiles) hashes[file] = await fileHash(file);
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
      xp: 100, level: 1, streak: key === 'applicant' ? 0 : 1, memoryScore: 100, memorizedPagesCount: 0, totalJuz: 0,
      ...(key === 'applicant' ? { earnedBadges: ['legacy-award'] } : {}) });
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
  evidence.passed = process.env.MA7FATH_MOBILE_LAYOUT_ONLY === '1'
    ? Boolean(evidence.mobileLayoutPassed)
    : Boolean(evidence.passed && evidence.falsePersistencePassed && evidence.teacherScopeRevocationP1Passed && evidence.memorizationIntegrityP1Passed && evidence.privateDataP0Passed);
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
  for (const file of sourceFiles) assert.equal(await fileHash(file), hashes[file], `${file} unchanged`);
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
  // Leaving asks first; "stay" keeps the membership.
  await pages.student.getByRole('button', { name: 'الخروج من الحلقة والمتابعة كحافظ مستقل', exact: true }).click();
  await expect(pages.student.getByText(`هل تريدين الخروج من ${first.name}؟`, { exact: true })).toBeVisible();
  await pages.student.getByRole('button', { name: 'البقاء في الحلقة', exact: true }).click();
  await pages.student.getByRole('button', { name: 'إغلاق نافذة الحلقة', exact: true }).click();
  await refresh(pages.student);
  await expect(pages.student.getByText(`عضوة مسجلة في ${first.name} 🌸`, { exact: true })).toBeVisible();
  await checkpoint(pages.student, '03-student-joined-reloaded');
  await login(pages.teacher1, 'teacher1');
  await pages.teacher1.locator('#sidebar-nav-teacher-groups').click();
  await expect(pages.teacher1.getByText(first.code, { exact: true })).toBeVisible();
  await expect(pages.teacher1.getByTestId(`teacher-group-count-${first.id}`)).toHaveText('1');
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
  await pages.teacher2.locator('#sidebar-nav-teacher-groups').click();
  await expect(pages.teacher2.getByTestId(`teacher-group-count-${second.id}`)).toHaveText('1');
  await checkpoint(pages.teacher2, '05-transferred-teacher-roster');
  await logout(pages.student);
  await expect(pages.student).toHaveURL(baseUrl + '/');
  await login(pages.student, 'student');
  await expect(pages.student.getByText(`عضوة مسجلة في ${second.name} 🌸`, { exact: true })).toBeVisible();
  await pages.student.getByRole('button', { name: 'إدارة عضوية الحلقة', exact: true }).click();
  await pages.student.getByRole('button', { name: 'الخروج من الحلقة والمتابعة كحافظ مستقل', exact: true }).click();
  await pages.student.getByRole('button', { name: 'نعم، الخروج من الحلقة', exact: true }).click();
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
  await refresh(admin);
  await admin.locator('#sidebar-nav-admin-groups').click();
  await expect(admin.getByTestId(`admin-group-count-${first.id}`)).toContainText('1');
  await expect(admin.getByTestId(`admin-group-count-${second.id}`)).toContainText('0');
  await checkpoint(pages.teacher1, '07-approved-request-roster');
  await logout(pages.student);
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
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().streak, 0, 'sign-in and membership activity do not count');
  await teacher.getByText(names.applicant, { exact: true }).click();
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  await expect(teacher.getByTestId('student-practice-count')).toHaveText('0');
  await expect(teacher.getByTestId('student-practice-average')).toHaveText('—');
  await expect(teacher.getByTestId('student-practice-empty')).toBeVisible();
  await admin.getByRole('button', { name: 'تحليلات الحفظ والإتقان 📊', exact: true }).click();
  await expect(admin.getByTestId('performance-totalRecitationSessions')).toHaveText('٠');
  await expect(admin.getByTestId('performance-averageAccuracy')).toHaveText('غير متاح');
  await student.getByRole('button', { name: 'ابدأ التسميع والقراءة الآن', exact: true }).click();
  const referenceResponse = await api('applicant', '/quran/reference/page/2');
  assert.equal(referenceResponse.status, 200);
  const referencePage = await referenceResponse.json();
  const displayedAyah = student.getByTestId(`quran-display-${referencePage.ayahs[0].number}`);
  await expect(displayedAyah).toBeVisible();
  assert.equal(await displayedAyah.getAttribute('data-quran-text'), referencePage.ayahs[0].text);
  const displayStyle = await displayedAyah.evaluate(element => ({
    direction: getComputedStyle(element).direction,
    fontFamily: getComputedStyle(element).fontFamily
  }));
  assert.equal(displayStyle.direction, 'rtl');
  assert.match(displayStyle.fontFamily, /Noto Naskh Arabic|Amiri/);
  const quranFontLoaded = await displayedAyah.evaluate(async element => {
    await document.fonts.load('700 22px "Noto Naskh Arabic"', element.getAttribute('data-quran-text'));
    return document.fonts.check('700 22px "Noto Naskh Arabic"', element.getAttribute('data-quran-text'));
  });
  assert.equal(quranFontLoaded, true, 'the bundled Quran font is loaded for the displayed text');
  const displayedTexts = await student.locator('[data-testid^="quran-display-"]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-quran-text')).join(' '));
  assert.equal(displayedTexts, referencePage.ayahs.map(ayah => ayah.text).join(' '));
  for (const mark of ['َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ً']) {
    assert.equal(displayedTexts.includes(mark), true, `visible Uthmani page contains ${mark}`);
  }
  const comparisonResponse = await api('applicant', '/ai/recitation-check', {
    method: 'POST',
    body: JSON.stringify({
      spokenText: referencePage.ayahs[0].text,
      expectedText: 'نص عميل مزور بلا تشكيل',
      pageNumber: 2,
      surahNumber: 2,
      ayahNumber: referencePage.ayahs[0].number,
      isFullPage: false,
      autoSave: false
    })
  });
  assert.equal(comparisonResponse.status, 200);
  const comparison = await comparisonResponse.json();
  assert.equal(comparison.referenceText, referencePage.ayahs[0].text);
  assert.equal(comparison.accuracy, 100);
  evidence.uthmaniDisplayPassed = true;
  await checkpoint(student, '08b-uthmani-diacritics-shared-reference');
  await student.getByRole('button', { name: '📖 تسميع الصفحة 2 كاملة 🎯', exact: true }).click();
  await student.getByRole('button', { name: 'آية محددة (1)', exact: true }).click();
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
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().streak, 1);
  assert.equal(saved.referenceVerified, true);
  await student.getByTestId('submit-session-review').click();
  await expect(student.getByTestId('submit-session-review')).toHaveText('أُرسلت الجلسة للمعلم');
  await expect.poll(async () => (await collection.doc(saved.id).get()).data()?.reviewStatus).toBe('pending');
  await submit.click();
  await expect(student.getByText('تم حفظ محاولة التسميع في سجلك', { exact: true })).toBeVisible();
  assert.equal((await collection.get()).size, 1);
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().streak, 1, 'same-day retry counts once');
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().xp, 100);
  await checkpoint(student, '09-practice-zero-idempotent');
  await refresh(teacher);
  await teacherRoster(teacher);
  await teacher.getByText(names.applicant, { exact: true }).click();
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  await expect(teacher.getByTestId('student-practice-count')).toHaveText('1');
  await expect(teacher.getByTestId('student-practice-average')).toHaveText('0%');
  await expect(teacher.getByTestId(`student-practice-${saved.id}`)).toBeVisible();
  await teacher.getByTestId(`approve-session-${saved.id}`).click();
  await expect.poll(async () => (await collection.doc(saved.id).get()).data()?.reviewStatus).toBe('approved');
  await teacher.getByTestId('teacher-note-input').fill('واصل المراجعة اليومية');
  await teacher.getByTestId('send-teacher-note').click();
  await expect(teacher.getByTestId('teacher-action-message')).toContainText('تم حفظ الملاحظة');
  assert.equal((await db.collection(`users/${uids.applicant}/teacher_notes`).get()).size, 1);
  const profileAfterReview = (await db.doc(`users/${uids.applicant}`).get()).data();
  assert.equal(profileAfterReview.xp, 100);
  assert.equal(profileAfterReview.memorizedPagesCount, 0);
  await checkpoint(teacher, '10-teacher-practice-zero');
  await teacher.getByRole('button', { name: 'إغلاق', exact: true }).click();
  await teacher.locator('#sidebar-nav-teacher-reports').click();
  await expect(teacher.getByTestId('report-approved')).toHaveText('1');
  await expect(teacher.getByTestId('report-notes')).toHaveText('1');
  await checkpoint(teacher, '10b-teacher-review-note-report');
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
  await logout(student);
  await expect(student).toHaveURL(baseUrl + '/');
  await login(student, 'applicant');
  await expect(student.getByTestId('quran-companion-streak')).toContainText('1');
  const teacherNoteNotification = (await db.collection(`users/${uids.applicant}/notifications`).where('type', '==', 'teacher_note').get()).docs[0];
  await student.getByRole('button', { name: 'فتح مركز الإشعارات', exact: true }).click();
  await expect(student.getByTestId(`notification-${teacherNoteNotification.id}`)).toContainText('واصل المراجعة اليومية');
  await student.getByRole('button', { name: 'فتح مركز الإشعارات', exact: true }).click();
  await student.getByRole('button', { name: 'ابدأ التسميع والقراءة الآن', exact: true }).click();
  await expect.poll(async () => (await db.doc(`users/${uids.applicant}/page_progress/2`).get()).data()?.totalAttempts).toBe(2);
  await expect(student.getByText('(أعلى نتيجة: 100% • 2 محاولات مسجلة)', { exact: true })).toBeVisible();
  await checkpoint(student, '12-practice-after-sign-in');
  evidence.practicePassed = true;
  evidence.streakPassed = true;
  evidence.teacherReviewPassed = true;
  evidence.teacherNotesPassed = true;
  evidence.teacherReportsPassed = true;
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
  await expect.poll(async () => (await db.collection(`users/${uids.applicant}/notifications`).get()).docs
    .filter(doc => String(doc.data().type).startsWith('community_')).length).toBe(2);
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
  await logout(owner);
  await login(owner, 'applicant');
  await expect(owner.getByTestId('sidebar-profile-photo')).toHaveAttribute('src', savedPhoto);
  assert.equal((await db.doc(`users/${uids.multi}`).get()).data().photoURL, '');

  await owner.locator('#sidebar-user-profile-card').click();
  await owner.getByLabel('اختيار صورة شخصية').setInputFiles({ name: 'not-an-image.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(owner.getByTestId('profile-error')).toBeVisible({ timeout: 20000 });
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().photoURL, savedPhoto);
  await owner.getByLabel('اختيار صورة شخصية').setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(owner.getByTestId('profile-error')).toBeVisible({ timeout: 20000 });
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().photoURL, savedPhoto);

  const profileBeforeFailedSave = (await db.doc(`users/${uids.applicant}`).get()).data();
  await db.doc(`users/${uids.applicant}`).delete();
  await owner.getByLabel('اختيار صورة شخصية').setInputFiles({ name: 'profile-save-failure.png', mimeType: 'image/png', buffer: png });
  await expect(owner.getByTestId('profile-error')).toBeVisible({ timeout: 20000 });
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).exists, false);
  await expect(owner.getByTestId('profile-photo-preview')).toHaveAttribute('src', savedPhoto);
  await db.doc(`users/${uids.applicant}`).set(profileBeforeFailedSave);
  const foreignUpload = await fetch(`http://127.0.0.1:9199/v0/b/demo-ma7fath-test.appspot.com/o?uploadType=media&name=${encodeURIComponent(`avatars/${uids.multi}/forbidden.png`)}`, {
    method: 'POST', headers: { authorization: `Firebase ${await idToken('applicant')}`, 'content-type': 'image/png' }, body: png
  });
  assert.equal(foreignUpload.status, 403);
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

  await logout(student);
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

test('admin controls Community and achievements visibility, order, and badge display data', { timeout: 120000 }, async () => {
  const admin = pages.admin;
  const student = pages.student;
  const multi = pages.multi;
  await refresh(admin);
  await admin.getByRole('button', { name: 'ظهور المجتمع والأوسمة', exact: true }).click();
  await expect(admin.getByTestId('admin-experience-settings')).toBeVisible();
  await admin.getByLabel('ترتيب المجتمع').fill('20');
  await admin.getByLabel('ترتيب الأوسمة والثمار').fill('10');
  await admin.getByTestId('save-experience-settings').click();
  await expect(admin.getByTestId('experience-settings-status')).toContainText('Firestore');

  await refresh(student);
  const configuredSections = student.locator('#sidebar-nav-achievements, #sidebar-nav-community');
  await expect(configuredSections).toHaveCount(2);
  await expect.poll(() => configuredSections.evaluateAll(elements => elements.map(element => element.id)))
    .toEqual(['sidebar-nav-achievements', 'sidebar-nav-community']);

  await admin.getByTestId('section-setting-community').getByRole('checkbox').uncheck();
  await admin.getByTestId('badge-setting-xp_500').getByRole('checkbox').uncheck();
  await admin.getByLabel('عنوان streak_7').fill('وسام الصحبة المتجددة');
  await admin.getByTestId('save-experience-settings').click();
  await expect(admin.getByTestId('experience-settings-status')).toContainText('Firestore');
  await expect.poll(async () => (await db.doc('app_config/navigation').get()).data()?.sections?.community?.visible).toBe(false);

  await refresh(student);
  await expect(student.locator('#sidebar-nav-community')).toHaveCount(0);
  await student.locator('#sidebar-nav-achievements').click();
  await expect(student.getByTestId('achievement-streak_7')).toContainText('وسام الصحبة المتجددة');
  await expect(student.getByTestId('achievement-xp_500')).toHaveCount(0);
  assert.deepEqual((await db.doc(`users/${uids.applicant}`).get()).data().earnedBadges, ['legacy-award']);

  await refresh(multi);
  await expect(multi.locator('#sidebar-nav-community')).toHaveCount(0);
  const studentWrite = await fetch(`http://127.0.0.1:8080/v1/projects/${process.env.GCLOUD_PROJECT}/databases/(default)/documents/app_config/navigation?updateMask.fieldPaths=sections`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${await idToken('applicant')}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: { sections: { mapValue: { fields: { community: { mapValue: { fields: { visible: { booleanValue: true } } } } } } } } })
  });
  assert.equal(studentWrite.status, 403);
  await checkpoint(student, '19-admin-controlled-community-badges');
  evidence.adminExperienceSettingsPassed = true;
});

test('admin dashboard renders membership counts and real activity metrics including empty data', { timeout: 120000 }, async () => {
  const admin = pages.admin;
  const userSnapshots = await db.collection('users').get();
  for (const user of userSnapshots.docs) await user.ref.update({ lastQuranActivityDate: null, createdAt: null });
  const membershipSnapshots = await db.collection('memberships').get();
  for (const membership of membershipSnapshots.docs) await membership.ref.update({ updatedAt: '2000-01-01T00:00:00.000Z' });
  const oldSessions = await db.collectionGroup('recitation_sessions').get();
  for (const session of oldSessions.docs) await session.ref.delete();

  await refresh(admin);
  await admin.locator('#sidebar-nav-admin-dashboard').click();
  await expect.poll(async () => localizedNumber(await admin.getByTestId('admin-active-today').innerText())).toBe(0);
  await expect.poll(async () => localizedNumber(await admin.getByTestId('admin-active-week').innerText())).toBe(0);
  await admin.getByRole('button', { name: 'التحليلات ومعدلات النمو', exact: true }).click();
  await expect.poll(async () => localizedNumber(await admin.getByTestId('admin-monthly-activities').innerText())).toBe(0);

  const now = new Date();
  const today = ammanDateKey(now);
  const earlierThisWeek = ammanDateKey(new Date(now.getTime() - (3 * 86400000)));
  await db.doc(`users/${uids.applicant}`).update({ lastQuranActivityDate: today, createdAt: now.toISOString() });
  await db.doc(`users/${uids.student}`).update({ lastQuranActivityDate: earlierThisWeek });
  await db.doc(`memberships/${uids.applicant}`).update({ updatedAt: now.toISOString() });
  await db.doc(`users/${uids.applicant}/recitation_sessions/dashboard-one`).set({ createdAt: now.toISOString(), reviewedAt: now.toISOString(), reviewedBy: uids.teacher1 });
  await db.doc(`users/${uids.student}/recitation_sessions/dashboard-two`).set({ createdAt: now.toISOString() });

  const overview = await api('admin', '/admin/overview');
  const overviewBody = await overview.json();
  assert.equal(overview.status, 200);
  assert.equal(overviewBody.realTimeActivity.activeToday, 1);
  assert.equal(overviewBody.realTimeActivity.activeThisWeek, 2);
  assert.equal(overviewBody.realTimeActivity.newRegistrationsWeek, 1);
  assert.equal(overviewBody.realTimeActivity.newGroupJoinsWeek, 1);
  assert.equal(overviewBody.realTimeActivity.activeTeachers, 1);
  assert.equal(overviewBody.realTimeActivity.activeGroups, 1);
  assert.equal(overviewBody.realTimeActivity.monthlyActivities, 2);

  await refresh(admin);
  await admin.locator('#sidebar-nav-admin-dashboard').click();
  await expect.poll(async () => localizedNumber(await admin.getByTestId('admin-active-today').innerText())).toBe(1);
  await expect.poll(async () => localizedNumber(await admin.getByTestId('admin-active-week').innerText())).toBe(2);
  await admin.getByRole('button', { name: 'التحليلات ومعدلات النمو', exact: true }).click();
  await expect.poll(async () => localizedNumber(await admin.getByTestId('admin-monthly-activities').innerText())).toBe(2);
  await checkpoint(admin, '20-real-group-counts-dashboard-metrics');
  evidence.realDashboardMetricsPassed = true;
});

test('student analytics and teacher dashboard render scoped real metrics after refresh', { timeout: 120000 }, async () => {
  const student = pages.student;
  const teacher1 = pages.teacher1;
  const teacher2 = pages.teacher2;
  const now = new Date().toISOString();
  const membership = (await db.doc(`memberships/${uids.applicant}`).get()).data();
  await db.doc(`users/${uids.applicant}/recitation_sessions/dashboard-one`).set({
    id: 'dashboard-one', userId: uids.applicant, accuracy: 80, createdAt: now,
    classification: 'practice', reviewStatus: 'pending', submittedTeacherId: uids.teacher1, rewardedXp: 0
  });
  await db.doc('groups/browser-teacher1-empty').set({
    name: 'حلقة بلا أعضاء', code: 'BROWSEREMPTY', teacherId: uids.teacher1, teacherName: names.teacher1,
    active: true, studentsCount: 999
  });
  await db.doc('memberships/browser-inactive-fixture').set({
    uid: 'browser-inactive-fixture', groupId: membership.groupId, teacherId: uids.teacher1, status: 'inactive'
  });

  await refresh(student);
  await student.locator('#sidebar-nav-analytics').click();
  await expect(student.getByTestId('student-analytics')).toBeVisible();
  await expect(student.getByTestId('analytics-declared-ayahs')).toHaveText('1');
  await expect(student.getByTestId('analytics-practice-week')).toHaveText('1');
  await expect(student.getByTestId('analytics-practice-accuracy')).toHaveText('80%');
  await expect(student.getByTestId('analytics-approved-pages')).toHaveText('غير متاح');
  await refresh(student);
  await student.locator('#sidebar-nav-analytics').click();
  await expect(student.getByTestId('analytics-practice-accuracy')).toHaveText('80%');

  await refresh(teacher1);
  await teacher1.locator('#sidebar-nav-teacher-dashboard').click();
  await expect(teacher1.getByTestId('teacher-students-count')).toHaveText('1');
  await expect(teacher1.getByTestId('teacher-groups-button')).toContainText('(2)');
  await expect(teacher1.getByTestId('teacher-practice-sessions')).toHaveText('1');
  await expect(teacher1.getByTestId('teacher-group-summary')).toContainText('حلقة بلا أعضاء: 0');
  await expect(teacher1.getByTestId('teacher-pending-reviews')).toHaveText('1');

  await refresh(teacher2);
  await teacher2.locator('#sidebar-nav-teacher-dashboard').click();
  await expect(teacher2.getByTestId('teacher-students-count')).toHaveText('0');
  await expect(teacher2.getByTestId('teacher-practice-sessions')).toHaveText('0');
  await expect(teacher2.getByTestId('teacher-weekly-commitment')).toHaveText('غير متاح');
  await checkpoint(student, '21-real-student-teacher-analytics');
  evidence.scopedStudentTeacherAnalyticsPassed = true;
});

test('P0 Chrome chat ownership, persisted reload/login, failed delete/send and fortress service roundtrip', { timeout: 120000 }, async () => {
  const student = pages.student;
  await refresh(student);
  await student.locator('#sidebar-nav-ai-assistant').click();
  const marker = 'P0 private browser message';
  await student.getByTestId('chat-input').fill(marker);
  await student.getByTestId('chat-input').press('Enter');
  await expect.poll(async () => (await db.doc(`users/${uids.applicant}/private_ai_chat/current`).get()).data()?.history?.length).toBe(2);
  await expect(student.getByText(marker, { exact: true })).toBeVisible();
  await refresh(student);
  await student.locator('#sidebar-nav-ai-assistant').click();
  await expect(student.getByText(marker, { exact: true })).toBeVisible();
  await logout(student);
  await login(student, 'applicant');
  await student.locator('#sidebar-nav-ai-assistant').click();
  await expect(student.getByText(marker, { exact: true })).toBeVisible();
  // Account B writes through its own real Auth Emulator token; A's UI must not see it.
  await api('student', '/ai/chat', { method: 'POST', body: JSON.stringify({ message: 'B private browser message' }) });
  await student.route('**/api/ai/chat', route => route.request().method() === 'DELETE'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Injected delete failure' }) }) : route.continue());
  await student.getByTestId('clear-chat').click();
  await expect(student.getByTestId('chat-error')).toContainText('Injected delete failure');
  await expect(student.getByText(marker, { exact: true })).toBeVisible();
  await student.unroute('**/api/ai/chat');
  await student.route('**/api/ai/chat', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Injected save failure' }) }) : route.continue());
  await student.getByTestId('chat-input').fill('must not appear saved');
  await student.getByTestId('chat-input').press('Enter');
  await expect(student.getByTestId('chat-error')).toContainText('Injected save failure');
  await expect(student.getByTestId('chat-input')).toHaveValue('must not appear saved');
  assert.equal((await db.doc(`users/${uids.applicant}/private_ai_chat/current`).get()).data().history.length, 2);
  await student.unroute('**/api/ai/chat');
  await student.getByTestId('clear-chat').click();
  await expect(student.getByText(marker, { exact: true })).toHaveCount(0);
  assert.equal((await db.doc(`users/${uids.student}/private_ai_chat/current`).get()).data().history.length, 2);
  await logout(student);
  await login(student, 'student');
  await student.locator('#sidebar-nav-ai-assistant').click();
  await expect(student.getByText('B private browser message', { exact: true })).toBeVisible();
  await expect(student.getByText(marker, { exact: true })).toHaveCount(0);
  const planResult = await student.evaluate(async uid => {
    const service = await import('/src/lib/fortressService.js');
    const saved = await service.saveFortressPlanToFirestore(uid, { dailyTarget: 'P0 browser target' });
    const restored = await service.getFortressPlanFromFirestore(uid);
    return { success: saved.success, target: restored.dailyTarget };
  }, uids.student);
  assert.deepEqual(planResult, { success: true, target: 'P0 browser target' });
  await refresh(student);
  const restored = await student.evaluate(async uid => (await (await import('/src/lib/fortressService.js')).getFortressPlanFromFirestore(uid)).dailyTarget, uids.student);
  assert.equal(restored, 'P0 browser target');
  await student.route('**/api/user/fortress-plan', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Injected plan failure' }) }));
  const failed = await student.evaluate(async uid => {
    try { await (await import('/src/lib/fortressService.js')).saveFortressPlanToFirestore(uid, { dailyTarget: 'must not save' }); return 'unexpected success'; }
    catch (error) { return error.message; }
  }, uids.student);
  assert.equal(failed, 'Injected plan failure');
  assert.equal((await db.doc(`users/${uids.student}/five_fortresses_plans/current`).get()).data().dailyTarget, 'P0 browser target');
  await student.unroute('**/api/user/fortress-plan');
  await student.locator('#sidebar-nav-five-fortresses').click();
  await student.getByRole('button', { name: '⚡ الخطة اليومية المبسطة', exact: true }).click();
  await student.getByTestId('fortress-toggle-khatmah').click();
  await expect.poll(async () => (await db.doc(`users/${uids.student}/five_fortresses_plans/current`).get()).data()?.completionStatus?.khatmah).toBe(true);
  await refresh(student);
  await student.locator('#sidebar-nav-five-fortresses').click();
  await student.getByRole('button', { name: '⚡ الخطة اليومية المبسطة', exact: true }).click();
  await student.route('**/api/user/fortress-plan', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'UI plan persistence failure' }) }));
  await student.getByTestId('fortress-toggle-khatmah').click();
  await expect(student.getByTestId('fortress-save-error')).toContainText('UI plan persistence failure');
  assert.equal((await db.doc(`users/${uids.student}/five_fortresses_plans/current`).get()).data().completionStatus.khatmah, true);
  await student.unroute('**/api/user/fortress-plan');
  await checkpoint(student, '22-private-chat-and-plan');
  evidence.privateDataP0Passed = true;
});

test('P1 Chrome self declarations persist without approved counts and failed saves keep prior state', { timeout: 120000 }, async () => {
  const student = pages.student, teacher = pages.teacher1;
  await db.doc(`users/${uids.applicant}`).update({ memorizedPagesCount: 77, memorizedPages: [1, 2, 3], totalJuz: 12, memoryScore: 99 });
  await logout(student);
  await login(student, 'applicant');
  await expect(student.getByTestId('student-home-view')).toBeVisible();
  await expect(student.getByTestId('home-memory-score')).toHaveCount(0);
  await expect(student.getByTestId('student-home-view')).not.toContainText('99');
  await student.locator('#sidebar-nav-quran-map').click();
  await expect(student.getByTestId('self-reported-page-disclaimer')).toBeVisible();
  await student.getByTestId('open-declared-pages').click();
  await student.getByTestId('declared-pages-input').fill('2');
  await student.getByTestId('save-declared-pages').click();
  await expect(student.getByTestId('declared-pages-feedback')).toContainText('تم حفظ الصفحات المصرّح بها ذاتيًا');
  await expect.poll(async () => (await db.doc(`users/${uids.applicant}`).get()).data().preferences.studentDeclaredPages).toEqual([1, 2]);
  const original = (await db.doc(`users/${uids.applicant}`).get()).data();
  await refresh(student);
  await student.locator('#sidebar-nav-quran-map').click();
  await expect(student.getByTestId('declared-pages-count')).toContainText('2');
  await student.getByTestId('open-declared-pages').click();
  await db.doc(`users/${uids.applicant}`).delete();
  await student.getByTestId('declared-pages-input').fill('6');
  await student.getByTestId('save-declared-pages').click();
  await expect(student.getByTestId('declared-pages-feedback')).toContainText('تعذر');
  await expect(student.getByTestId('declared-pages-count')).toContainText('2');
  await db.doc(`users/${uids.applicant}`).set(original);
  await refresh(student);
  await logout(student);
  await login(student, 'applicant');
  await expect(student.getByTestId('home-declared-pages')).toContainText('2');
  await student.locator('#sidebar-nav-analytics').click();
  await expect(student.getByTestId('analytics-approved-pages')).toHaveText('غير متاح');
  await refresh(teacher);
  await teacherRoster(teacher);
  await teacher.getByText(names.applicant, { exact: true }).click();
  await expect(teacher.getByTestId('teacher-approved-pages')).toHaveText('غير متاح');
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  const record = db.doc(`users/${uids.applicant}/recitation_sessions/dashboard-one`);
  await teacher.route('**/sessions/dashboard-one/review', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Injected P1 review failure' }) }));
  await teacher.getByTestId('approve-session-dashboard-one').click();
  await expect(teacher.getByTestId('teacher-action-message')).toContainText('تعذر حفظ مراجعة التدريب');
  assert.equal((await record.get()).data().reviewStatus, 'pending');
  await expect(teacher.getByTestId('teacher-approved-pages')).toHaveCount(0);
  await teacher.unroute('**/sessions/dashboard-one/review');
  await teacher.getByTestId('teacher-profile-refresh').click();
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  await teacher.getByTestId('approve-session-dashboard-one').click();
  await expect.poll(async () => (await record.get()).data()?.reviewStatus).toBe('approved');
  assert.equal((await record.get()).data().reviewedBy, uids.teacher1);
  await refresh(teacher);
  await teacherRoster(teacher);
  await teacher.getByText(names.applicant, { exact: true }).click();
  await expect(teacher.getByTestId('teacher-approved-pages')).toHaveText('غير متاح');
  await teacher.getByRole('button', { name: 'التسميع والأداء', exact: true }).click();
  await expect(teacher.getByTestId('session-review-dashboard-one')).toHaveText('مراجعة تدريب مقبولة من المعلم');
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().memorizedPagesCount, 77);
  assert.equal((await db.doc(`users/${uids.applicant}`).get()).data().xp, original.xp);
  await logout(student);
  await login(student, 'student');
  await expect(student.getByTestId('home-declared-pages')).toContainText('0');
  await student.locator('#sidebar-nav-analytics').click();
  await expect(student.getByTestId('analytics-declared-ayahs')).toHaveText('0');
  await expect(student.getByTestId('analytics-approved-pages')).toHaveText('غير متاح');
  await checkpoint(student, '23-memorization-integrity');
  evidence.memorizationIntegrityP1Passed = true;
});

test('P1 Chrome revokes teacher data after transfer, leave and failed requests; group roster is scoped', { timeout: 180000 }, async () => {
  const oldTeacher = pages.teacher1, newTeacher = pages.teacher2;
  const createGroup = async (teacherId, name) => {
    const response = await api('admin','/admin/groups/create',{method:'POST',body:JSON.stringify({teacherId,name})});
    assert.equal(response.status,200); return (await response.json()).group;
  };
  const groupA = await createGroup(uids.teacher1,'Scope browser A');
  const groupB = await createGroup(uids.teacher1,'Scope browser B');
  const groupC = await createGroup(uids.teacher2,'Scope browser C');
  const transfer = async group => {
    const response = await api('admin','/admin/distribute-student',{method:'POST',body:JSON.stringify({studentUid:uids.applicant,groupId:group.id,teacherId:group.teacherId})});
    assert.equal(response.status,200);
  };
  await transfer(groupA);
  assert.equal((await api('student','/groups/join',{method:'POST',body:JSON.stringify({code:groupB.code})})).status,200);
  await refresh(oldTeacher);
  await oldTeacher.locator('#sidebar-nav-teacher-groups').click();
  await oldTeacher.getByTestId(`group-roster-${groupA.id}`).click();
  await expect(oldTeacher.getByTestId('teacher-roster-group')).toBeVisible();
  await expect(oldTeacher.getByText(names.applicant,{exact:true})).toBeVisible();
  await expect(oldTeacher.getByText(names.student,{exact:true})).toHaveCount(0);
  await oldTeacher.getByTestId('teacher-roster-all').click();
  await expect(oldTeacher.getByText(names.student,{exact:true})).toBeVisible();
  await oldTeacher.getByText(names.applicant,{exact:true}).click();
  await expect(oldTeacher.getByTestId('teacher-approved-pages')).toBeVisible();
  await oldTeacher.getByTestId('teacher-note-input').fill('Must not save after transfer');
  const notesBefore = (await db.collection(`users/${uids.applicant}/teacher_notes`).get()).size;
  await transfer(groupC);
  await oldTeacher.getByTestId('send-teacher-note').click();
  await expect(oldTeacher.getByTestId('teacher-profile-error')).toBeVisible();
  await expect(oldTeacher.getByTestId('teacher-approved-pages')).toHaveCount(0);
  await expect(oldTeacher.getByTestId('teacher-note-input')).toHaveCount(0);
  assert.equal((await db.collection(`users/${uids.applicant}/teacher_notes`).get()).size,notesBefore);
  await oldTeacher.getByTestId('teacher-profile-close').click();
  await oldTeacher.getByTestId('teacher-roster-refresh').click();
  await expect(oldTeacher.getByText(names.applicant,{exact:true})).toHaveCount(0);
  await expect(oldTeacher.getByText(names.student,{exact:true})).toBeVisible();
  await oldTeacher.locator('#sidebar-nav-teacher-reports').click();
  await expect(oldTeacher.getByTestId('report-students')).toHaveText('1');
  await expect(oldTeacher.getByTestId(`report-student-${uids.applicant}`)).toHaveCount(0);
  await oldTeacher.route('**/api/teacher/*/reports',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Scope report failure'})}));
  await oldTeacher.getByTestId('teacher-report-refresh').click();
  await expect(oldTeacher.getByRole('alert')).toBeVisible();
  await expect(oldTeacher.getByTestId(`report-student-${uids.student}`)).toHaveCount(0);
  await oldTeacher.unroute('**/api/teacher/*/reports');
  await teacherRoster(oldTeacher);
  await expect(oldTeacher.getByText(names.student,{exact:true})).toBeVisible();
  await oldTeacher.route('**/api/teacher/*/students?*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Scope roster failure'})}));
  await oldTeacher.getByTestId('teacher-roster-refresh').click();
  await expect(oldTeacher.getByTestId('teacher-roster-error')).toBeVisible();
  await expect(oldTeacher.getByText(names.student,{exact:true})).toHaveCount(0);
  await oldTeacher.unroute('**/api/teacher/*/students?*');
  await transfer(groupA);
  await oldTeacher.getByTestId('teacher-roster-refresh').click();
  await oldTeacher.getByText(names.student,{exact:true}).click();
  let release, ready, delivered;
  const held = new Promise(resolve => { release = resolve; });
  const responseReady = new Promise(resolve => { ready = resolve; });
  const responseDelivered = new Promise(resolve => { delivered = resolve; });
  await oldTeacher.route('**/student/' + uids.student + '/notes', async route => {
    const response = await route.fetch(); ready(); await held; await route.fulfill({response}); delivered();
  });
  await oldTeacher.getByTestId('teacher-note-input').fill('Delayed response for different student');
  await oldTeacher.getByTestId('send-teacher-note').click();
  await responseReady;
  await oldTeacher.getByTestId('teacher-profile-close').click();
  await oldTeacher.getByText(names.applicant,{exact:true}).click();
  await expect(oldTeacher.getByTestId('teacher-profile-student-name')).toHaveText(names.applicant);
  release(); await responseDelivered;
  await oldTeacher.waitForTimeout(100);
  await expect(oldTeacher.getByTestId('teacher-profile-student-name')).toHaveText(names.applicant);
  await expect(oldTeacher.getByTestId('teacher-action-message')).toHaveCount(0);
  await oldTeacher.unroute('**/student/' + uids.student + '/notes');
  const sessionId='scope-browser-pending';
  assert.equal((await api('applicant','/ai/recitation-check',{method:'POST',body:JSON.stringify({sessionId,autoSave:true,pageNumber:604,surahNumber:112,ayahNumber:6222,spokenText:'قل هو الله أحد'})})).status,200);
  assert.equal((await api('applicant',`/recitation/sessions/${sessionId}/submit`,{method:'POST',body:'{}'})).status,200);
  await oldTeacher.getByTestId('teacher-profile-refresh').click();
  await oldTeacher.getByRole('button',{name:'التسميع والأداء',exact:true}).click();
  await expect(oldTeacher.getByTestId(`approve-session-${sessionId}`)).toBeVisible();
  await transfer(groupC);
  await oldTeacher.getByTestId(`approve-session-${sessionId}`).click();
  await expect(oldTeacher.getByTestId('teacher-profile-error')).toBeVisible();
  await expect(oldTeacher.getByTestId(`student-practice-${sessionId}`)).toHaveCount(0);
  assert.equal((await db.doc(`users/${uids.applicant}/recitation_sessions/${sessionId}`).get()).data().reviewStatus,'pending');
  await oldTeacher.getByTestId('teacher-profile-close').click();
  await oldTeacher.locator('#sidebar-nav-teacher-dashboard').click();
  await expect(oldTeacher.getByTestId('teacher-students-count')).toHaveText('1');
  await expect(oldTeacher.getByText(names.applicant,{exact:true})).toHaveCount(0);
  await oldTeacher.route('**/api/teacher/*/dashboard',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Scope dashboard failure'})}));
  await oldTeacher.getByTestId('teacher-dashboard-refresh').click();
  await expect(oldTeacher.getByTestId('teacher-dashboard-error')).toBeVisible();
  await expect(oldTeacher.getByTestId('teacher-students-count')).toHaveCount(0);
  await oldTeacher.unroute('**/api/teacher/*/dashboard');
  await oldTeacher.locator('#sidebar-nav-teacher-groups').click();
  await expect(oldTeacher.getByTestId('group-roster-' + groupA.id)).toBeVisible();
  await oldTeacher.route('**/api/groups?teacherId=*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Scope group-list failure'})}));
  await oldTeacher.getByTestId('teacher-groups-refresh').click();
  await expect(oldTeacher.getByRole('alert')).toBeVisible();
  await expect(oldTeacher.getByTestId('group-roster-' + groupA.id)).toHaveCount(0);
  await oldTeacher.unroute('**/api/groups?teacherId=*');
  await refresh(newTeacher);
  await teacherRoster(newTeacher);
  await newTeacher.getByText(names.applicant,{exact:true}).click();
  await expect(newTeacher.getByTestId('teacher-approved-pages')).toBeVisible();
  assert.equal((await api('applicant',`/recitation/sessions/${sessionId}/submit`,{method:'POST',body:'{}'})).status,200);
  await newTeacher.getByTestId('teacher-profile-refresh').click();
  await newTeacher.getByRole('button',{name:'التسميع والأداء',exact:true}).click();
  await newTeacher.getByTestId(`approve-session-${sessionId}`).click();
  await expect.poll(async()=>(await db.doc(`users/${uids.applicant}/recitation_sessions/${sessionId}`).get()).data()?.reviewedBy).toBe(uids.teacher2);
  await expect(newTeacher.getByTestId(`session-review-${sessionId}`)).toHaveText('مراجعة تدريب مقبولة من المعلم');
  await newTeacher.getByTestId('teacher-note-input').fill('Current assigned teacher');
  await newTeacher.getByTestId('send-teacher-note').click();
  await expect.poll(async()=>(await db.collection(`users/${uids.applicant}/teacher_notes`).get()).size).toBe(notesBefore+1);
  // Neither stale profile pointers nor an inactive membership may retain access.
  await db.doc(`memberships/${uids.applicant}`).update({status:'inactive'});
  await newTeacher.getByTestId('teacher-profile-refresh').click();
  await expect(newTeacher.getByTestId('teacher-profile-error')).toBeVisible();
  await expect(newTeacher.getByTestId('teacher-approved-pages')).toHaveCount(0);
  await db.doc(`memberships/${uids.applicant}`).update({status:'active'});
  await newTeacher.getByTestId('teacher-profile-refresh').click();
  await expect(newTeacher.getByTestId('student-practice-count')).toBeVisible();
  await expect(newTeacher.getByTestId('teacher-profile-error')).toHaveCount(0);
  assert.equal((await api('applicant','/groups/leave',{method:'POST',body:'{}'})).status,200);
  await newTeacher.getByTestId('teacher-profile-refresh').click();
  await expect(newTeacher.getByTestId('teacher-profile-error')).toBeVisible();
  await expect(newTeacher.getByTestId('teacher-note-input')).toHaveCount(0);
  await newTeacher.getByTestId('teacher-profile-close').click();
  await newTeacher.getByTestId('teacher-roster-refresh').click();
  await expect(newTeacher.getByText(names.applicant,{exact:true})).toHaveCount(0);
  await refresh(newTeacher);
  await newTeacher.locator('#sidebar-nav-teacher-reports').click();
  await expect(newTeacher.getByTestId('report-students')).toHaveText('0');
  await expect(newTeacher.getByTestId(`report-student-${uids.applicant}`)).toHaveCount(0);
  await checkpoint(newTeacher,'24-teacher-scope-revoked');
  evidence.teacherScopeRevocationP1Passed=true;
});

test('Chrome fortress drafts, plan generation and all completion views preserve confirmed saves on failure and retry', { timeout: 240000 }, async () => {
  const student = pages.student, uid = uids.student;
  const profileRef = db.doc(`users/${uid}`), planRef = db.doc(`users/${uid}/five_fortresses_plans/current`);
  const baseline = (await profileRef.get()).data();
  const sessionsBefore = (await db.collection(`users/${uid}/recitation_sessions`).get()).size;
  const notificationsBefore = (await db.collection(`users/${uid}/notifications`).get()).size;
  const getPlan = async () => (await planRef.get()).data();
  const fortressNav = async (tab = 'visual-map') => {
    await student.locator('#sidebar-nav-five-fortresses').click();
    await student.getByTestId(`fortress-tab-${tab}`).click();
    if (tab === 'visual-map') await expect(student.getByTestId('visual-fortress-juz')).toBeEnabled();
    if (tab === 'simplified-plan') await expect(student.getByTestId('simplified-fortress-juz')).toBeEnabled();
    if (tab === 'daily-plan') await expect(student.getByTestId('daily-fortress-complete-1')).toBeEnabled();
  };
  const failPlan = async (status = 503, message = 'Injected fortress persistence failure') => {
    await student.route('**/api/user/fortress-plan', route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, message }) }));
  };
  // A missing saved plan is a clearly labelled draft, even if a previous local cache exists.
  await planRef.delete();
  await student.evaluate(uid => localStorage.setItem(`ma7fath_fortress_plan_${uid}`, JSON.stringify({ userId: uid, dailyTarget: 'stale cache must not be treated as saved', currentPage: 604 })), uid);
  await student.route('**/api/user/fortress-plan/*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Saved plan read failure; cache is not proof' }) }));
  await student.locator('#sidebar-nav-five-fortresses').click();
  await expect(student.getByTestId('visual-fortress-status')).toContainText('تعذر تحميل');
  await expect(student.getByTestId('visual-fortress-juz')).toBeDisabled();
  assert.equal((await planRef.get()).exists, false);
  await student.unroute('**/api/user/fortress-plan/*');
  await student.getByTestId('visual-fortress-reload').click();
  await expect(student.getByTestId('visual-fortress-juz')).toBeEnabled();
  await expect(student.getByTestId('visual-fortress-status')).toContainText('مسودة غير محفوظة');
  assert.equal((await planRef.get()).exists, false, 'loading/generation must not silently persist a draft');
  await student.getByTestId('visual-fortress-juz').selectOption('2');
  await expect(student.getByTestId('visual-fortress-status')).toContainText('تم حفظ الخطة');
  assert.equal((await getPlan()).lastJuzReached, 2);
  assert.equal((await getPlan()).completionDate, ammanDateKey(new Date()));
  const visualSaved = await getPlan();
  await failPlan();
  await student.getByTestId('visual-fortress-juz').selectOption('3');
  await expect(student.getByTestId('fortress-save-error')).toContainText('Injected fortress persistence failure');
  await expect(student.getByTestId('visual-fortress-juz')).toHaveValue('2');
  assert.deepEqual(await getPlan(), visualSaved);
  await student.unroute('**/api/user/fortress-plan');
  await student.getByTestId('visual-fortress-juz').selectOption('3');
  await expect(student.getByTestId('visual-fortress-juz')).toHaveValue('3');
  await expect.poll(async () => (await getPlan()).lastJuzReached).toBe(3);
  const beforeVisualCompletion = await getPlan();
  await failPlan(200, 'HTTP 200 without persistence is not success');
  await student.getByTestId('visual-fortress-complete-1').click();
  await expect(student.getByTestId('fortress-save-error')).toContainText('HTTP 200 without persistence');
  await expect(student.getByTestId('visual-fortress-count')).toContainText('0 / 5');
  assert.deepEqual(await getPlan(), beforeVisualCompletion);
  await student.unroute('**/api/user/fortress-plan');
  await student.getByTestId('visual-fortress-complete-1').click();
  await expect(student.getByTestId('visual-fortress-count')).toContainText('1 / 5');
  await expect(student.getByTestId('fortress-header-count')).toContainText('1 من 5');
  await refresh(student);
  await fortressNav();
  await expect(student.getByTestId('visual-fortress-juz')).toHaveValue('3');
  await expect(student.getByTestId('visual-fortress-count')).toContainText('1 / 5');
  await logout(student);
  await login(student, 'student');
  await fortressNav('simplified-plan');
  await expect(student.getByTestId('simplified-fortress-count')).toContainText('1 من أصل 5');
  await student.getByTestId('simplified-fortress-juz').selectOption('4');
  await expect(student.getByTestId('simplified-fortress-status')).toContainText('تم الحفظ');
  const simplifiedSaved = await getPlan();
  await failPlan();
  await student.getByTestId('simplified-fortress-juz').selectOption('5');
  await expect(student.getByTestId('fortress-save-error')).toBeVisible();
  await expect(student.getByTestId('simplified-fortress-juz')).toHaveValue('4');
  assert.deepEqual(await getPlan(), simplifiedSaved);
  await student.unroute('**/api/user/fortress-plan');
  await student.getByTestId('simplified-fortress-juz').selectOption('5');
  await expect(student.getByTestId('simplified-fortress-juz')).toHaveValue('5');
  const beforePreparation = await getPlan();
  await failPlan();
  await student.getByTestId('simplified-fortress-complete-preparation').click();
  await expect(student.getByTestId('fortress-save-error')).toBeVisible();
  await expect(student.getByTestId('simplified-fortress-count')).toContainText('1 من أصل 5');
  assert.deepEqual(await getPlan(), beforePreparation);
  await student.unroute('**/api/user/fortress-plan');
  await student.getByTestId('simplified-fortress-complete-preparation').click();
  await expect(student.getByTestId('simplified-fortress-count')).toContainText('2 من أصل 5');
  await expect(student.getByTestId('fortress-header-count')).toContainText('2 من 5');
  await fortressNav('daily-plan');
  const beforeDaily = await getPlan();
  await failPlan();
  await student.getByTestId('daily-fortress-complete-3').click();
  await expect(student.getByTestId('fortress-action-error')).toBeVisible();
  assert.deepEqual(await getPlan(), beforeDaily);
  await expect(student.getByTestId('daily-fortress-complete-3')).not.toContainText('تم الإنجاز');
  await student.unroute('**/api/user/fortress-plan');
  await student.getByTestId('daily-fortress-complete-3').click();
  await expect(student.getByTestId('fortress-plan-status')).toContainText('تم حفظ الخطة');
  assert.equal((await getPlan()).completionStatus.newMemorization, true);
  // The customization write checks both HTTP status and the success/persisted contract.
  await fortressNav('plan-customizer');
  const oldPreferences = (await profileRef.get()).data().preferences;
  const oldTarget = oldPreferences.dailyTarget;
  await student.getByTestId('fortress-custom-target').selectOption('نصف صفحة يومياً');
  await expect(student.getByTestId('fortress-custom-draft')).toBeVisible();
  await student.route(`**/api/user/${uid}`, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Custom preference persistence failure' }) }));
  await student.getByTestId('fortress-custom-save').click();
  await expect(student.getByTestId('fortress-action-error')).toContainText('Custom preference persistence failure');
  await expect(student.getByTestId('fortress-custom-target')).toHaveValue(oldTarget);
  await expect(student.getByTestId('fortress-custom-save')).not.toContainText('بنجاح');
  assert.deepEqual((await profileRef.get()).data().preferences, oldPreferences);
  await student.unroute(`**/api/user/${uid}`);
  await student.getByTestId('fortress-custom-target').selectOption('نصف صفحة يومياً');
  await student.getByTestId('fortress-custom-save').click();
  await expect(student.getByTestId('fortress-custom-save')).toContainText('تم حفظ تفضيلات');
  assert.equal((await profileRef.get()).data().preferences.dailyTarget, 'نصف صفحة يومياً');
  await refresh(student);
  await fortressNav('plan-customizer');
  await expect(student.getByTestId('fortress-custom-target')).toHaveValue('نصف صفحة يومياً');
  await fortressNav('daily-plan');
  const beforeAi = await getPlan();
  await student.route('**/api/ai/chat', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'AI draft failed' }) }));
  await student.getByTestId('fortress-ai-generate').click();
  await expect(student.getByTestId('fortress-action-error')).toContainText('AI draft failed');
  assert.deepEqual(await getPlan(), beforeAi);
  await student.unroute('**/api/ai/chat');
  await student.getByTestId('fortress-ai-generate').click();
  await expect(student.getByTestId('fortress-ai-save')).toBeVisible();
  assert.deepEqual(await getPlan(), beforeAi, 'a generated suggestion is not a saved active plan');
  await failPlan();
  await student.getByTestId('fortress-ai-save').click();
  await expect(student.getByTestId('fortress-action-error')).toBeVisible();
  await expect(student.getByTestId('fortress-ai-save')).toBeVisible();
  assert.deepEqual(await getPlan(), beforeAi);
  await student.unroute('**/api/user/fortress-plan');
  await student.getByTestId('fortress-ai-save').click();
  await expect(student.getByTestId('fortress-ai-save')).toHaveCount(0);
  const savedAiText = (await getPlan()).aiPlanText;
  assert.equal(typeof savedAiText, 'string'); assert.ok(savedAiText.length > 0);
  await logout(student);
  await login(student, 'student');
  await fortressNav('daily-plan');
  await expect(student.getByText('اقتراح مساعد محفوظ ضمن خطتك', { exact: false })).toBeVisible();
  assert.equal((await getPlan()).aiPlanText, savedAiText);
  await student.locator('#sidebar-nav-home').click();
  await expect(student.getByTestId('home-fortress-1')).toBeEnabled();
  for (const id of [1, 2, 3, 4, 5]) {
    const current = await getPlan();
    const key = ['khatmah','preparation','newMemorization','nearRevision','farRevision'][id - 1];
    const count = Object.values(current.completionStatus).filter(Boolean).length;
    await failPlan(id % 2 ? 503 : 200);
    await student.getByTestId(`home-fortress-${id}`).click();
    await expect(student.getByTestId('home-fortress-feedback')).toContainText('تعذر حفظ');
    await expect(student.getByTestId('home-fortress-count')).toContainText(`${count} / 5`);
    assert.deepEqual(await getPlan(), current);
    await student.unroute('**/api/user/fortress-plan');
    await student.getByTestId(`home-fortress-${id}`).click();
    await expect(student.getByTestId('home-fortress-feedback')).toContainText('تم حفظ علامة الإنجاز الذاتي');
    assert.equal((await getPlan()).completionStatus[key], !current.completionStatus[key]);
    assert.equal((await getPlan()).aiPlanText, savedAiText, 'completion must preserve saved plan contents');
    await expect(student.getByTestId(`home-fortress-${id}`)).toBeEnabled();
  }
  const finalPlan = await getPlan();
  await refresh(student);
  await expect(student.getByTestId('home-fortress-count')).toContainText(`${Object.values(finalPlan.completionStatus).filter(Boolean).length} / 5`);
  await logout(student);
  await login(student, 'student');
  await expect(student.getByTestId('home-fortress-count')).toContainText(`${Object.values(finalPlan.completionStatus).filter(Boolean).length} / 5`);
  const after = (await profileRef.get()).data();
  for (const field of ['xp','level','streak','memorizedPages','memorizedPagesCount','totalJuz','memoryScore','earnedBadges']) assert.deepEqual(after[field], baseline[field], `${field} receives no fortress/retry reward or approval`);
  assert.equal((await db.collection(`users/${uid}/recitation_sessions`).get()).size, sessionsBefore);
  assert.equal((await db.collection(`users/${uid}/notifications`).get()).size, notificationsBefore);
  assert.equal((await db.collection(`users/${uid}/five_fortresses_plans`).get()).size, 1, 'retry updates the one current plan');
  await checkpoint(student, '25-fortress-confirmed-persistence');
  evidence.fortressFalsePersistencePassed = true;
});

test('Chrome quiz saves, profile refresh failures and dismiss-only reminders report persistence truthfully', { timeout: 180000 }, async () => {
  assert.equal(evidence.fortressFalsePersistencePassed, true);
  const student = pages.student, uid = uids.student;
  const profileRef = db.doc(`users/${uid}`);
  const quizNav = async () => {
    await student.locator('#sidebar-nav-home').click();
    await student.getByRole('button', { name: 'تعديل الخطة', exact: true }).click();
    await expect(student.getByTestId('learning-quiz-start')).toBeVisible();
  };
  const answerQuiz = async option => {
    await student.getByTestId('learning-quiz-start').click();
    for (const id of [1, 2, 3, 4]) await student.getByTestId(`learning-quiz-option-${id}-${option}`).click();
  };
  await quizNav();
  await answerQuiz('a');
  await expect(student.getByTestId('learning-quiz-success')).toBeVisible();
  const savedFirst = (await profileRef.get()).data();
  assert.equal(savedFirst.preferences.learningProfile.percentages.auditory, 100);
  await expect(student.getByTestId('learning-saved-style')).toHaveText(savedFirst.preferences.learningStyle);
  await refresh(student);
  await quizNav();
  await expect(student.getByTestId('learning-saved-style')).toHaveText(savedFirst.preferences.learningStyle);
  await logout(student);
  await login(student, 'student');
  await quizNav();
  await expect(student.getByTestId('learning-saved-style')).toHaveText(savedFirst.preferences.learningStyle);
  await student.route(`**/api/user/${uid}`, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Injected quiz persistence failure' }) }));
  await answerQuiz('b');
  await expect(student.getByTestId('learning-quiz-error')).toContainText('Injected quiz persistence failure');
  await expect(student.getByTestId('learning-quiz-success')).toHaveCount(0);
  await expect(student.getByTestId('learning-saved-style')).toHaveText(savedFirst.preferences.learningStyle);
  assert.deepEqual((await profileRef.get()).data(), savedFirst);
  await student.unroute(`**/api/user/${uid}`);
  await student.getByTestId('learning-quiz-retry').click();
  await expect(student.getByTestId('learning-quiz-success')).toBeVisible();
  const savedSecond = (await profileRef.get()).data();
  assert.equal(savedSecond.preferences.learningProfile.percentages.visual, 100);
  assert.equal(savedSecond.preferences.learningProfile.percentages.auditory, 0);
  assert.equal(savedSecond.xp, savedFirst.xp); assert.equal(savedSecond.streak, savedFirst.streak);
  assert.deepEqual(savedSecond.preferences.fortressesToday, savedFirst.preferences.fortressesToday);
  // A 200 response carrying success:false is also a failure and leaves the second result intact.
  await student.route(`**/api/user/${uid}`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Quiz response did not confirm persistence' }) }));
  await answerQuiz('c');
  await expect(student.getByTestId('learning-quiz-error')).toContainText('did not confirm persistence');
  assert.deepEqual((await profileRef.get()).data(), savedSecond);
  await student.unroute(`**/api/user/${uid}`);
  await student.getByTestId('learning-quiz-retry').click();
  await expect(student.getByTestId('learning-quiz-success')).toBeVisible();
  const savedThird = (await profileRef.get()).data();
  assert.equal(savedThird.preferences.learningProfile.percentages.kinesthetic, 100);
  assert.equal(savedThird.xp, savedFirst.xp);
  await refresh(student);
  await quizNav();
  await expect(student.getByTestId('learning-saved-style')).toHaveText(savedThird.preferences.learningStyle);
  await logout(student);
  await login(student, 'student');
  await quizNav();
  await expect(student.getByTestId('learning-saved-style')).toHaveText(savedThird.preferences.learningStyle);
  await student.locator('#sidebar-nav-home').click();
  // Refresh claims only a server profile read, not that all features/sessions refreshed.
  await profileRef.update({ 'preferences.studentDeclaredPages': [9, 10, 11] });
  await refreshAccount(student);
  await expect(student.getByTestId('dashboard-refresh-feedback')).toHaveAttribute('data-status', 'success');
  await expect(student.getByTestId('dashboard-refresh-feedback')).toContainText('ملف الحساب من Firestore');
  await expect(student.getByTestId('home-declared-pages')).toHaveText('3');
  const confirmedProfile = (await profileRef.get()).data();
  // Inject a missing synthetic profile; the real getDocFromServer must fail instead of reusing cache.
  await profileRef.delete();
  try {
    await refreshAccount(student);
    await expect(student.getByTestId('dashboard-refresh-feedback')).toHaveAttribute('data-status', 'error');
    await expect(student.getByTestId('home-declared-pages')).toHaveText('3');
  } finally { await profileRef.set(confirmedProfile); }
  await refreshAccount(student);
  await expect(student.getByTestId('dashboard-refresh-feedback')).toHaveAttribute('data-status', 'success');
  assert.deepEqual((await profileRef.get()).data(), confirmedProfile);
  await student.setViewportSize({ width: 390, height: 844 });
  await expect(student.locator('#pull-to-refresh-container')).toBeVisible();
  const pull = async () => {
    await student.evaluate(() => { window.scrollTo(0, 0); const el = document.getElementById('pull-to-refresh-container'); el.scrollTop = 0; });
    await student.locator('#pull-to-refresh-container').dispatchEvent('touchstart', { touches: [{ clientX: 100, clientY: 90 }], cancelable: true });
    await student.locator('#pull-to-refresh-container').dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 290 }], cancelable: true });
    await student.locator('#pull-to-refresh-container').dispatchEvent('touchend', { touches: [], cancelable: true });
  };
  await profileRef.delete();
  try {
    await pull();
    await expect(student.getByTestId('pull-refresh-error')).toContainText('تعذر تحديث');
    await expect(student.getByTestId('pull-refresh-success')).toHaveCount(0);
    await expect(student.getByTestId('home-declared-pages')).toHaveText('3');
  } finally { await profileRef.set(confirmedProfile); }
  await student.getByTestId('pull-refresh-retry').click();
  await expect(student.getByTestId('pull-refresh-success')).toContainText('ملف الحساب من Firestore');
  await expect(student.getByTestId('pull-refresh-error')).toHaveCount(0);
  assert.deepEqual((await profileRef.get()).data(), confirmedProfile);
  await checkpoint(student, '26-quiz-and-refresh-confirmation');
  await student.setViewportSize({ width: 1440, height: 1000 });
  // Closing a reminder merely dismisses it; it is never a completed Quran session or reward.
  const beforeReminder = (await profileRef.get()).data();
  const sessionsBefore = (await db.collection(`users/${uid}/recitation_sessions`).get()).size;
  await student.getByRole('button', { name: 'فتح مركز الإشعارات', exact: true }).click();
  await student.getByRole('button', { name: '⏰ التذكير اليومي', exact: true }).click();
  await student.getByTestId('reminder-test').click();
  await expect(student.getByTestId('reminder-dismiss-only')).toHaveText('إغلاق التذكير فقط');
  await student.getByTestId('reminder-dismiss-only').click();
  await expect(student.getByText('أُغلق التذكير فقط؛ لم تُحفظ جلسة أو يُعدّل تقدمك.', { exact: true })).toBeVisible();
  assert.deepEqual((await profileRef.get()).data(), beforeReminder);
  assert.equal((await db.collection(`users/${uid}/recitation_sessions`).get()).size, sessionsBefore);
  evidence.falsePersistencePassed = true;
  evidence.falsePersistenceLimits = ['Quiz measures self-reported learning preferences, not validated proficiency.', 'Refresh covers the authenticated Firestore profile only.', 'Pull-to-refresh used real DOM touch events in desktop Chrome with a mobile viewport; no physical phone test.', 'The disconnected fortress setup wizard was inspected and fixed but is not navigable in the app.', 'Browser failures intercept local requests; transaction failures are additionally executed in the Emulator API suite.'];
  await checkpoint(student, '27-reminder-dismiss-without-reward');
});

test('Chrome mobile navigation, theme persistence, and viewport fit', { timeout: 180000 }, async () => {
  await db.doc(`users/${uids.teacher1}`).set({
    role: 'teacher',
    roles: { user: true, teacher: true }
  }, { merge: true });

  const viewports = [320, 360, 390, 430];
  const accounts = [
    { account: 'student', roles: ['user'] },
    { account: 'teacher1', roles: ['teacher'] },
    { account: 'admin', roles: ['admin'] },
    { account: 'multi', roles: ['user', 'teacher', 'admin'] }
  ];
  const mobileReportDir = path.resolve('reports/mobile-responsive');
  await mkdir(mobileReportDir, { recursive: true });

  const verifyLayout = async (page, width) => {
    const layout = await page.evaluate(() => {
      const rect = selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
        return { left, right, top, bottom, width, height };
      };
      const bottomNavigation = document.querySelector('#mobile-bottom-navigation');
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        profile: rect('#header-user-profile-card'),
        controls: rect('#mobile-header-controls'),
        roleSwitcher: rect('#active-role-switcher'),
        theme: rect('.mobile-theme-toggle'),
        bottomNavigation: rect('#mobile-bottom-navigation'),
        bottomItems: [...bottomNavigation.querySelectorAll('button')].map(button => {
          const { left, right, top, bottom, width, height } = button.getBoundingClientRect();
          return { left, right, top, bottom, width, height };
        }),
        mainPaddingBottom: parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom)
      };
    });
    assert.equal(layout.viewportWidth, width);
    assert.ok(layout.documentWidth <= width, `document overflows at ${width}px: ${layout.documentWidth}px`);
    assert.ok(layout.bottomNavigation.left >= 0 && layout.bottomNavigation.right <= width, `bottom bar is off-screen at ${width}px`);
    assert.ok(layout.bottomNavigation.height <= layout.bottomNavigation.bottom, `bottom bar is clipped at ${width}px`);
    assert.ok(layout.bottomItems.every(item => item.left >= 0 && item.right <= width && item.width >= 44 && item.height >= 44),
      `bottom navigation targets are clipped or too small at ${width}px`);
    assert.ok(layout.mainPaddingBottom >= layout.bottomNavigation.height, `content can be hidden behind bottom bar at ${width}px`);
    if (layout.profile && layout.controls) {
      const overlap = layout.profile.left < layout.controls.right && layout.profile.right > layout.controls.left;
      assert.equal(overlap, false, `header profile overlaps its controls at ${width}px`);
    }
    if (layout.roleSwitcher) {
      assert.ok(layout.roleSwitcher.left >= 0 && layout.roleSwitcher.right <= width,
        `role selector is clipped at ${width}px`);
      await expect(page.locator('#active-role-switcher')).toBeVisible();
      assert.equal(await page.locator('#active-role-switcher').evaluate(element => Boolean(element.closest('header'))), true,
        'role selector must remain in the top bar');
    }
    await expect(page.locator('#quick-settings-trigger-btn')).toBeVisible();
    await expect(page.locator('#mobile-bottom-navigation')).toBeVisible();
    await page.locator('#quick-settings-trigger-btn').click();
    const settingsMenu = page.locator('#quick-settings-dropdown');
    await expect(settingsMenu).toBeVisible();
    await expect(settingsMenu.locator('.mobile-theme-toggle')).toBeVisible();
    const settingsBounds = await settingsMenu.boundingBox();
    assert.ok(settingsBounds && settingsBounds.x >= 0 && settingsBounds.x + settingsBounds.width <= width);
    assert.ok(settingsBounds.y >= 0 && settingsBounds.y + settingsBounds.height <= layout.viewportHeight);
    await page.locator('#quick-settings-trigger-btn').click();
    return layout;
  };

  const verifySections = async (page) => {
    const bottomItemIds = await page.locator('#mobile-bottom-navigation button[id^="mobile-nav-"]:not(#mobile-nav-more-tools):not(#mobile-nav-profile)')
      .evaluateAll(buttons => buttons.map(button => button.id));
    for (const id of bottomItemIds) {
      const button = page.locator(`#${id}`);
      await button.click();
      await expect(button).toHaveAttribute('aria-current', 'page');
    }

    await expect(page.locator('#app-main-sidebar')).toHaveCount(0);
    await page.locator('#mobile-nav-more-tools').click();
    const sectionIds = await page.locator('#more-tools-modal-sheet button[id^="more-tool-item-"]')
      .evaluateAll(buttons => buttons.map(button => button.id));
    await page.locator('#more-tools-close-btn').click();
    for (const id of sectionIds) {
      await page.locator('#mobile-nav-more-tools').click();
      const sheet = await page.locator('#more-tools-modal-sheet').boundingBox();
      assert.ok(sheet && sheet.x >= 0 && sheet.x + sheet.width <= page.viewportSize().width);
      assert.ok(sheet.height <= page.viewportSize().height);
      await page.locator(`#${id}`).click();
      await expect(page.locator('#more-tools-modal-sheet')).toHaveCount(0);
      await expect(page.locator('#mobile-nav-more-tools')).toHaveAttribute('aria-current', 'page');
      if (id === 'more-tool-item-daily-session') {
        await expect(page.getByRole('heading', { name: /تصفح المصحف الشريف والتسميع التفاعلي/ })).toBeVisible();
      }
    }
  };

  const loginMobile = async (page, account) => {
    await page.goto(baseUrl);
    await page.getByRole('button', { name: 'ابدأ مجانًا', exact: true }).click();
    await page.getByRole('button', { name: 'تسجيل الدخول هنا', exact: true }).click();
    await page.locator('#email-field').fill(`${uids[account]}@example.test`);
    await page.locator('#password-field').fill(password);
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('#mobile-bottom-navigation')).toBeVisible();
  };

  const verifyLandingNavbar = async page => {
    await page.goto(baseUrl);
    await expect(page.locator('#landing-language-toggle')).toBeVisible();
    await expect(page.locator('.nav-links-mobile a')).toHaveCount(3);
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 844 });
      const bounds = await page.evaluate(() => {
        const rect = selector => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const { left, right, width, height } = element.getBoundingClientRect();
          return { left, right, width, height, visible: getComputedStyle(element).display !== 'none' };
        };
        return {
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          language: rect('#landing-language-toggle'),
          theme: rect('nav button[aria-pressed]'),
          links: [...document.querySelectorAll('.nav-links-mobile a')].map(link => {
            const { left, right, width, height } = link.getBoundingClientRect();
            return { left, right, width, height, visible: getComputedStyle(link).display !== 'none' };
          })
        };
      });
      console.log(`Landing navigation ${width}px: ${JSON.stringify(bounds)}`);
      assert.equal(bounds.document, width, `landing page overflows at ${width}px`);
      assert.ok(bounds.language?.visible && bounds.language.left >= 0 && bounds.language.right <= width,
        `language control is hidden or clipped at ${width}px`);
      assert.ok(bounds.theme?.visible && bounds.theme.left >= 0 && bounds.theme.right <= width,
        `theme control is hidden or clipped at ${width}px`);
      assert.equal(bounds.links.length, 3);
      assert.ok(bounds.links.every(link => link.visible && link.left >= 0 && link.right <= width && link.height > 0),
        `one or more section links are hidden or clipped at ${width}px`);
      await page.screenshot({
        path: path.join(mobileReportDir, `landing-${width}.png`),
        animations: 'disabled'
      });
    }

    await page.setViewportSize({ width: 320, height: 844 });
    await page.locator('.nav-links-mobile a[href="#features"]').click();
    await expect(page).toHaveURL(/#features$/);
    await page.goto(baseUrl);
    await page.locator('#landing-language-toggle').click();
    await expect(page.locator('.nav-links-mobile')).toContainText('Features');
    await expect(page.locator('.nav-links-mobile a')).toHaveCount(3);
    await page.locator('#landing-language-toggle').click();
    await expect(page.locator('.nav-links-mobile')).toContainText('المميزات');
  };

  for (const { account, roles } of accounts) {
    const context = await browser.newContext({
      viewport: { width: 320, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: 'ar-JO'
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return route.continue();
      evidence.externalRequestsBlocked++;
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => console.log(`Mobile UI error ${account}: ${error.message}`));
    try {
      if (account === 'student') await verifyLandingNavbar(page);
      await loginMobile(page, account);
      for (const width of viewports) {
        await page.setViewportSize({ width, height: 844 });
        const layout = await verifyLayout(page, width);
        await page.screenshot({
          path: path.join(mobileReportDir, `${account}-${width}.png`),
          animations: 'disabled'
        });
        console.log(`Mobile screenshot saved: ${account} at ${width}px`);

        if (account === 'student' && width === 320) {
          await page.locator('#quick-settings-trigger-btn').click();
          const themeToggle = page.locator('.mobile-theme-toggle');
          if (await themeToggle.getAttribute('aria-pressed') !== 'true') await themeToggle.click();
          await expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
          await page.locator('#quick-settings-trigger-btn').click();
          await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
          await expect.poll(() => page.locator('body').evaluate(body => body.classList.contains('dark'))).toBe(true);
          await page.reload();
          await page.locator('#quick-settings-trigger-btn').click();
          await expect(page.locator('.mobile-theme-toggle')).toHaveAttribute('aria-pressed', 'true');
          await page.locator('#quick-settings-trigger-btn').click();
          await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
          await expect.poll(() => page.locator('body').evaluate(body => body.classList.contains('dark'))).toBe(true);

          // App-like back: first closes the open sheet, then returns to the home tab; the URL never changes.
          await page.locator('#mobile-nav-quran-map').click();
          await page.locator('#mobile-nav-more-tools').click();
          await expect(page.locator('#more-tools-modal-sheet')).toBeVisible();
          await page.goBack();
          await expect(page.locator('#more-tools-modal-sheet')).toHaveCount(0);
          await expect(page.locator('#mobile-nav-quran-map')).toHaveAttribute('aria-current', 'page');
          await page.goBack();
          await expect(page.locator('#mobile-nav-home')).toHaveAttribute('aria-current', 'page');
          await expect(page).toHaveURL(/\/dashboard$/);

          // The open tab survives a reload (or the OS killing the backgrounded app).
          await page.locator('#mobile-nav-five-fortresses').click();
          await page.reload();
          await expect(page.locator('#mobile-nav-five-fortresses')).toHaveAttribute('aria-current', 'page');
          await page.locator('#mobile-nav-home').click();

          // Notifications open as a panel under the top bar that fits the screen; back closes it.
          await page.getByLabel('فتح مركز الإشعارات').click();
          const notificationPanel = page.locator('#notification-center-panel');
          await expect(notificationPanel).toBeVisible();
          const panelBounds = await notificationPanel.boundingBox();
          assert.ok(panelBounds.x >= 0 && panelBounds.x + panelBounds.width <= width && panelBounds.y + panelBounds.height <= 844,
            `notification panel does not fit at ${width}px`);
          await page.goBack();
          await expect(notificationPanel).toHaveCount(0);

          // While typing, the bottom bar steps aside so it never covers the field or sits on the keyboard.
          await page.locator('#header-user-profile-card').click();
          const nameField = page.locator('input[type="text"][required]').first();
          await nameField.focus();
          await expect(page.locator('#mobile-bottom-navigation')).toBeHidden();
          await page.goBack();
          await expect(nameField).toHaveCount(0);
          await expect(page.locator('#mobile-bottom-navigation')).toBeVisible();
        }

        if (width === 320) {
          await verifySections(page);
          for (const role of roles.slice(1)) {
            await expect(page.locator('#active-role-switcher')).toBeVisible();
            await page.locator('#active-role-switcher').selectOption(role);
            await expect(page.locator(`#mobile-nav-${role === 'user' ? 'home' : `${role}-dashboard`}`)).toBeVisible();
            await verifySections(page);
          }
          if (account === 'multi') {
            await page.locator('#active-role-switcher').selectOption('user');
            await expect(page.locator('#mobile-nav-home')).toBeVisible();
          }
        } else {
          assert.equal(layout.bottomItems.length, 5, `expected all fixed actions and section tabs at ${width}px`);
          const firstSection = page.locator('#mobile-bottom-navigation button[id^="mobile-nav-"]:not(#mobile-nav-more-tools):not(#mobile-nav-profile)').first();
          await firstSection.click();
          await expect(firstSection).toHaveAttribute('aria-current', 'page');
        }
      }
    } finally {
      await context.close();
    }
  }
  evidence.mobileLayoutPassed = true;
});

test('multi-role account can open both home pages and Quran map uses a wide laptop layout', { timeout: 120000 }, async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ar-JO'
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return route.continue();
    evidence.externalRequestsBlocked++;
    return route.abort();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await mkdir(path.resolve('reports/mobile-responsive'), { recursive: true });
    await page.goto(baseUrl);
    await page.getByRole('button', { name: 'ابدأ مجانًا', exact: true }).click();
    await page.getByRole('button', { name: 'تسجيل الدخول هنا', exact: true }).click();
    await expect(page.locator('#email-field')).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('#password-field')).toHaveAttribute('autocomplete', 'current-password');
    await page.locator('#email-field').fill(`${uids.multi}@example.test`);
    await page.locator('#password-field').fill(password);
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('#mobile-bottom-navigation')).toBeVisible();
    await page.locator('#mobile-nav-home').click();
    await expect(page.getByTestId('student-home-view')).toBeVisible();
    await expect(page.locator('#active-role-switcher')).toBeVisible();
    await page.locator('#active-role-switcher').selectOption('teacher');
    await expect(page.locator('#mobile-nav-teacher-dashboard')).toBeVisible();
    await expect(page.getByTestId('teacher-dashboard')).toBeVisible();
    await expect(page.getByTestId('teacher-dashboard-error')).toHaveCount(0);
    await page.locator('#mobile-nav-more-tools').click();
    await page.locator('#more-tool-item-home').click();
    await expect(page.getByTestId('student-home-view')).toBeVisible();
    assert.deepEqual(pageErrors, [], `JavaScript errors while opening student home: ${pageErrors.join('; ')}`);
    await page.screenshot({
      path: path.join(path.resolve('reports/mobile-responsive'), 'multi-role-teacher-student-home.png'),
      animations: 'disabled'
    });

    const mapWidths = [1024, 1179, 1180, 1280, 1440];
    for (const width of mapWidths) {
      await page.setViewportSize({ width, height: 900 });
      const roleSelector = page.locator('#active-role-switcher');
      await expect(roleSelector).toBeVisible();
      const roleSelectorBounds = await roleSelector.boundingBox();
      assert.ok(roleSelectorBounds && roleSelectorBounds.x >= 0 && roleSelectorBounds.x + roleSelectorBounds.width <= width,
        `top-bar role selector is clipped at ${width}px`);
      if (width === mapWidths[0]) {
        await page.locator('#sidebar-nav-quran-map').click();
        await expect(page.locator('[data-testid="quran-map-layout"]')).toBeVisible();
      }

      const layout = page.locator('[data-testid="quran-map-layout"]');
      await expect(layout).toHaveCSS('flex-direction', width < 1180 ? 'column' : 'row');
      const pageButton = layout.locator('button[title^="صفحة"]').first();
      await pageButton.click();
      if (width < 1180) {
        await expect(page.getByTestId('quran-map-detail-overlay')).toBeVisible();
        await page.getByTestId('quran-map-detail-overlay').click({ position: { x: 10, y: 10 } });
      } else {
        await expect(page.getByTestId('quran-map-detail-panel')).toBeVisible();
      }
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(documentWidth <= width, `document overflows at laptop viewport ${width}px`);
      await page.screenshot({
        path: path.join(path.resolve('reports/mobile-responsive'), `laptop-map-${width}.png`),
        animations: 'disabled'
      });
    }
  } finally {
    await context.close();
  }
});
