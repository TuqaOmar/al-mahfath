import { createHash } from 'node:crypto';
import { db } from './middleware/auth.js';
import { hasRole } from './accessControl.js';
import { calculatePageRecitationStats } from './recitationStats.js';

export class RecitationError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new RecitationError(status, message); };
const clean = data => JSON.parse(JSON.stringify(data));
const sessionIdPattern = /^[A-Za-z0-9_-]{8,128}$/;
const weekAgo = () => Date.now() - 7 * 24 * 60 * 60 * 1000;

function integer(value, fallback, max, field) {
  const number = value == null ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) fail(400, `${field} غير صالح`);
  return number;
}

// Client-supplied Quran references are deliberately unverified. A comparison
// attempt cannot award XP, establish memorization, or update the portfolio.
export function preparePracticeRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'بيانات المحاولة غير صالحة');
  if (!sessionIdPattern.test(input.sessionId || '')) fail(400, 'معرف محاولة ثابت sessionId مطلوب');
  const expectedText = String(input.expectedText || '').trim();
  const spokenText = String(input.spokenText || '').trim();
  const audioBase64 = String(input.audioBase64 || '');
  if (!spokenText && !audioBase64) fail(400, 'نص التسميع أو التسجيل مطلوب');
  const isFullPage = Boolean(input.isFullPage);
  if (input.ayahs != null && (!Array.isArray(input.ayahs) || input.ayahs.some(ayah => !ayah || typeof ayah !== 'object'))) {
    fail(400, 'بيانات آيات المقارنة غير صالحة');
  }
  const ayahs = Array.isArray(input.ayahs) ? input.ayahs.map(ayah => ({
    text: String(ayah.text || ''), number: ayah.number ?? null,
    numberInSurah: ayah.numberInSurah ?? null,
    surah: { number: ayah.surah?.number ?? null, name: String(ayah.surah?.name || '') }
  })) : [];
  const reference = expectedText || ayahs.map(ayah => ayah.text).join(' ');
  if (!reference) fail(400, 'نص المقارنة مطلوب');
  // Bound the LCS calculation and the size of the resulting Firestore document.
  const ayahReference = ayahs.map(ayah => ayah.text).join(' ');
  if (reference.length > 20000 || ayahReference.length > 20000 || spokenText.length > 20000 || ayahs.length > 300 ||
      reference.split(/\s+/).length > 1500 || spokenText.split(/\s+/).length > 1500 ||
      ayahReference.split(/\s+/).length > 1500 ||
      audioBase64.length > 20 * 1024 * 1024 || String(input.surahName || '').length > 256) fail(400, 'المحاولة أطول من الحد المسموح');
  const normalized = {
    expectedText, spokenText, audioBase64, ayahs, isFullPage,
    pageNumber: integer(input.pageNumber, 1, 604, 'رقم الصفحة'),
    surahNumber: integer(input.surahNumber, 1, 114, 'رقم السورة'),
    // Existing UI uses the global Quran verse ID; keep it distinct from the
    // within-surah number and never use it as a portfolio key.
    ayahNumber: isFullPage ? null : integer(input.ayahNumber, 1, 6236, 'معرف الآية'),
    surahName: String(input.surahName || ''), type: audioBase64 ? 'voice' : 'text'
  };
  return { ...normalized, sessionId: input.sessionId,
    fingerprint: createHash('sha256').update(JSON.stringify(normalized)).digest('hex') };
}

function publicSession(snapshot) {
  const { fingerprint, analysisResult, ...session } = snapshot.data();
  return { ...session, id: snapshot.id, sessionId: snapshot.id };
}

export async function findPracticeAttempt(uid, prepared) {
  const snapshot = await db.doc(`users/${uid}/recitation_sessions/${prepared.sessionId}`).get();
  if (!snapshot.exists) return null;
  if (snapshot.data().fingerprint !== prepared.fingerprint) fail(409, 'معرف المحاولة مستخدم لمدخل مختلف');
  return { session: publicSession(snapshot), result: snapshot.data().analysisResult };
}

export async function confirmPracticeAttempt(uid, body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'بيانات تأكيد المحاولة غير صالحة');
  if (Object.keys(body || {}).some(key => !['sessionId', 'userId'].includes(key))) {
    fail(400, 'هذا المسار يؤكد محاولة محفوظة فقط؛ لا يقبل درجات أو نتائج جديدة');
  }
  if (body.userId && body.userId !== uid) fail(403, 'لا يمكن تأكيد محاولة مستخدم آخر');
  if (!sessionIdPattern.test(body.sessionId || '')) fail(400, 'معرف المحاولة sessionId مطلوب');
  const snapshot = await db.doc(`users/${uid}/recitation_sessions/${body.sessionId}`).get();
  if (!snapshot.exists) fail(404, 'المحاولة غير محفوظة');
  return publicSession(snapshot);
}

function addAttempt(previous, accuracy, createdAt) {
  const totalAttempts = Number(previous?.totalAttempts ?? 0) + 1;
  const accuracyTotal = Number(previous?.accuracyTotal ?? 0) + accuracy;
  return {
    classification: 'practice', referenceVerified: false, rewardedXp: 0,
    totalAttempts, totalSessions: totalAttempts, accuracyTotal,
    averageAccuracy: Math.round(accuracyTotal / totalAttempts),
    bestAccuracy: Math.max(Number(previous?.bestAccuracy ?? 0), accuracy),
    lastRecitedAt: createdAt, hasAttempts: true
  };
}

export async function savePracticeAttempt(uid, prepared, result) {
  const accuracy = Number(result.accuracy ?? result.pageAccuracy);
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) fail(500, 'نتيجة المقارنة غير صالحة');
  const storedResult = clean({ ...result,
    ayahBreakdown: (result.ayahBreakdown || []).map(ayah => ({ ...ayah, status: 'practice', referenceVerified: false }))
  });
  if (Buffer.byteLength(JSON.stringify(storedResult), 'utf8') > 350000) fail(400, 'نتيجة المحاولة أطول من الحد المسموح');
  const sessionRef = db.doc(`users/${uid}/recitation_sessions/${prepared.sessionId}`);
  const summaryRef = db.doc(`users/${uid}/recitation_stats/summary`);
  const pageRef = db.doc(`users/${uid}/page_progress/${prepared.pageNumber}`);
  return db.runTransaction(async tx => {
    const [session, summary, page, profile] = await tx.getAll(sessionRef, summaryRef, pageRef, db.doc(`users/${uid}`));
    if (!profile.exists) fail(404, 'حساب الطالب غير موجود');
    if (session.exists) {
      if (session.data().fingerprint !== prepared.fingerprint) fail(409, 'معرف المحاولة مستخدم لمدخل مختلف');
      return { session: publicSession(session), result: session.data().analysisResult };
    }
    const createdAt = new Date().toISOString();
    const entry = clean({
      id: prepared.sessionId, sessionId: prepared.sessionId, userId: uid,
      pageNumber: prepared.pageNumber, surahNumber: prepared.surahNumber,
      surahName: prepared.surahName, ayahNumber: prepared.ayahNumber,
      isFullPage: prepared.isFullPage, accuracy,
      classification: 'practice', referenceVerified: false, rewardedXp: 0,
      status: 'practice', type: prepared.type, createdAt,
      stats: storedResult.stats || {}, results: storedResult.results || [],
      // Remove the engine's 'memorized' status: this is practice, not approval.
      ayahBreakdown: (storedResult.ayahBreakdown || []).map(ayah => ({ ...ayah, status: 'practice', referenceVerified: false })),
      transcribedText: storedResult.transcribedText || storedResult.transcribedSpoken || '',
      expectedText: storedResult.originalExpected || prepared.expectedText,
      fingerprint: prepared.fingerprint,
      analysisResult: { ...storedResult, classification: 'practice', referenceVerified: false, rewardedXp: 0 }
    });
    tx.create(sessionRef, entry);
    tx.set(summaryRef, addAttempt(summary.data(), accuracy, createdAt));
    tx.set(pageRef, { ...addAttempt(page.data(), accuracy, createdAt), pageNumber: prepared.pageNumber, userId: uid });
    const { fingerprint, analysisResult, ...visible } = entry;
    return { session: visible, result: entry.analysisResult };
  });
}

export async function readPracticeHistory(uid, options = {}) {
  // A single-field collection read avoids production composite-index changes.
  // Pagination/indexing should be added before large-scale production use.
  const snapshot = await db.collection(`users/${uid}/recitation_sessions`).get();
  let sessions = snapshot.docs.map(publicSession);
  for (const field of ['pageNumber', 'surahNumber', 'ayahNumber']) {
    if (options[field] != null) sessions = sessions.filter(session => session[field] === Number(options[field]));
  }
  sessions.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id));
  const limit = options.limit == null ? 50 : Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) fail(400, 'حد سجل المحاولات غير صالح');
  return sessions.slice(0, limit);
}

function summarize(sessions) {
  const accuracies = sessions.map(session => Number(session.accuracy ?? 0));
  const totalAttempts = sessions.length;
  return {
    classification: 'practice', referenceVerified: false, rewardedXp: 0,
    hasAttempts: totalAttempts > 0, totalAttempts, totalSessions: totalAttempts,
    totalWeeklySessions: sessions.filter(session => Date.parse(session.createdAt) >= weekAgo()).length,
    averageAccuracy: totalAttempts ? Math.round(accuracies.reduce((a, b) => a + b, 0) / totalAttempts) : 0,
    bestAccuracy: totalAttempts ? Math.max(...accuracies) : 0,
    lastRecitedAt: sessions.reduce((latest, session) => session.createdAt > (latest || '') ? session.createdAt : latest, null)
  };
}

export async function readPracticeStats(uid) {
  const snapshot = await db.collection(`users/${uid}/recitation_sessions`).get();
  return summarize(snapshot.docs.map(publicSession));
}

export async function readPracticePageStats(uid, pageNumber) {
  const page = integer(pageNumber, 1, 604, 'رقم الصفحة');
  const history = await readPracticeHistory(uid, { pageNumber: page, limit: 500 });
  const snapshot = await db.doc(`users/${uid}/page_progress/${page}`).get();
  const stats = calculatePageRecitationStats(history, uid, page);
  if (snapshot.exists) Object.assign(stats, {
    hasAttempts: snapshot.data().hasAttempts, totalAttempts: snapshot.data().totalAttempts,
    averageAccuracy: snapshot.data().averageAccuracy, bestAccuracy: snapshot.data().bestAccuracy,
    lastRecitedAt: snapshot.data().lastRecitedAt
  });
  return { ...stats, classification: 'practice', referenceVerified: false, rewardedXp: 0 };
}

export async function practicePerformanceReport() {
  const [userDocs, groupDocs, memberDocs, sessionDocs] = await Promise.all([
    db.collection('users').get(), db.collection('groups').get(),
    db.collection('memberships').get(), db.collectionGroup('recitation_sessions').get()
  ]);
  const sessions = sessionDocs.docs.map(publicSession);
  const membership = new Map(memberDocs.docs.map(member => [member.id, member.data()]));
  const learners = userDocs.docs.filter(user => !hasRole(user.data(), 'teacher') && !hasRole(user.data(), 'admin'));
  const students = learners.map(user => {
    const member = membership.get(user.id);
    const stats = summarize(sessions.filter(session => session.userId === user.id));
    return { uid: user.id, name: user.data().name || '', groupId: member?.groupId ?? null, teacherId: member?.teacherId ?? null,
      totalRecitationSessions: stats.totalSessions, totalWeeklySessions: stats.totalWeeklySessions,
      averageAccuracy: stats.averageAccuracy, bestAccuracy: stats.bestAccuracy,
      lastRecitedAt: stats.lastRecitedAt, hasAttempts: stats.hasAttempts };
  });
  const groups = groupDocs.docs.map(group => {
    const members = memberDocs.docs.filter(member => member.data().groupId === group.id);
    const ids = new Set(members.map(member => member.id));
    const stats = summarize(sessions.filter(session => ids.has(session.userId)));
    return { id: group.id, name: group.data().name || '', teacherId: group.data().teacherId,
      teacherName: group.data().teacherName || '', membersCount: members.length,
      totalRecitationSessions: stats.totalSessions, totalWeeklySessions: stats.totalWeeklySessions,
      averageAccuracy: stats.averageAccuracy, bestAccuracy: stats.bestAccuracy, hasAttempts: stats.hasAttempts };
  });
  const stats = summarize(sessions);
  const grouped = students.filter(student => student.groupId).length;
  return {
    success: true, classification: 'practice', referenceVerified: false,
    stats: { totalStudentsCount: grouped, independentUsersCount: students.length - grouped,
      totalLearners: students.length, groupsCount: groups.length,
      teachersCount: userDocs.docs.filter(user => hasRole(user.data(), 'teacher')).length,
      totalRecitationSessions: stats.totalSessions, totalWeeklySessions: stats.totalWeeklySessions,
      averageAccuracy: stats.averageAccuracy, bestAccuracy: stats.bestAccuracy,
      hasAttempts: stats.hasAttempts, verifiedMemorizedPages: 0 }, groups, students
  };
}
