import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';
import { fetchWithAuth } from './api';
import { getSurahNameForPage, getJuzForPage, getPageRangeForJuz, getJuzStartPage } from '../utils/quranData';

/**
 * Calculates a complete Five Fortresses Plan based on the user's latest reached Juz
 * @param {number} lastJuzReached - Juz number from 1 to 30
 * @param {number} currentPage - Page number in Quran (1-604)
 * @param {string} dailyTarget - Optional daily memorization pace
 */
export function generateFiveFortressesPlan(lastJuzReached = 1, currentPage = 1, dailyTarget = 'صفحة واحدة يومياً') {
  const safeJuz = Math.min(30, Math.max(1, Number(lastJuzReached) || 1));
  const safePage = Math.min(604, Math.max(1, Number(currentPage) || getJuzStartPage(safeJuz)));
  const currentSurah = getSurahNameForPage(safePage);
  const currentJuz = getJuzForPage(safePage);
  const juzRange = getPageRangeForJuz(safeJuz);

  // 1. الحصن الأول: قراءة الختمة والاستماع بالحدر
  const khatmahJuz = safeJuz;
  const khatmahRange = getPageRangeForJuz(khatmahJuz);
  const fortress1 = {
    title: 'الحصن الأول: قراءة الختمة والاستماع بالحدر',
    shortTitle: 'قراءة الختمة اليومية',
    targetJuz: khatmahJuz,
    pagesRange: `من صفحة ${khatmahRange.startPage} إلى ${khatmahRange.endPage}`,
    description: `قراءة الجزء ${khatmahJuz} كاملاً نظراً بالتدوير أو الحدر السريع لتعهد المصحف كاملاً كل شهر، مع الاستماع للربع المطلوب مرتين بصوت الشيخ الحصري أو المنشاوي.`,
    timeEstimate: '30 دقيقة',
    icon: 'BookOpen',
    badge: `الجزء ${khatmahJuz}`
  };

  // 2. الحصن الثاني: التحضير الثلاثي (أسبوعي، ليلي، قبلي)
  const nextPage = Math.min(604, safePage + 1);
  const nextSurah = getSurahNameForPage(nextPage);
  const fortress2 = {
    title: 'الحصن الثاني: التحضير الثلاثي (الأسبوعي والليلي والقبلي)',
    shortTitle: 'التحضير الثلاثي الذكي',
    weeklyPrep: `قراءة كامل سورة ${currentSurah} أو الجزء ${safeJuz} نظراً في أول الأسبوع لفهم السياق العام.`,
    nightPrep: `تلاوة صفحة الغد (صفحة ${nextPage} - سورة ${nextSurah}) 15 مرة نظراً بصوت مسموع قبل النوم مباشرة.`,
    preMemorizationPrep: `تلاوة صفحة اليوم (صفحة ${safePage}) 15 دقيقة قبل الحفظ والاطلاع على غريب ألفاظها في التفسير الميسر.`,
    description: `التحضير الليلي لصفحة ${nextPage} قبل النوم + التحضير القبلي لصفحة ${safePage} مع فهم المعاني.`,
    timeEstimate: '20 دقيقة (موزعة)',
    icon: 'Moon',
    badge: `ص ${safePage} و ص ${nextPage}`
  };

  // 3. الحصن الثالث: الحفظ الجديد (تكرار 20x و40x)
  const fortress3 = {
    title: 'الحصن الثالث: الحفظ الجديد وتكرار الـ 20x و 40x',
    shortTitle: 'الحفظ الجديد بالتكرار',
    targetPage: safePage,
    targetSurah: currentSurah,
    methodSteps: [
      'تقسيم الصفحة إلى 3 أو 4 مقاطع وفق المعنى.',
      'تكرار الآية الأولى 20 مرة غيباً حتى تستقر كالفاتحة.',
      'تكرار الآية الثانية 20 مرة غيباً، ثم ربط الآيتين معاً 10 مرات.',
      'تكرار كامل الصفحة غيباً 40 مرة متصلة لترسيخ الذاكرة الدائمة.'
    ],
    description: `حفظ الصفحة ${safePage} من سورة ${currentSurah} مع التكرار المتصل (20 مرة للآية و40 للربط الكامل).`,
    timeEstimate: '45 دقيقة',
    icon: 'Sparkles',
    badge: `صفحة ${safePage}`
  };

  // 4. الحصن الرابع: المراجعة القريبة (آخر 20 صفحة)
  const nearStartPage = Math.max(1, safePage - 20);
  const nearEndPage = Math.max(1, safePage - 1);
  const fortress4 = {
    title: 'الحصن الرابع: المراجعة القريبة (آخر 20 صفحة)',
    shortTitle: 'مراجعة الجزء الأخير المحفوظ',
    pagesRange: nearStartPage === nearEndPage ? `صفحة ${nearStartPage}` : `من صفحة ${nearStartPage} إلى ${nearEndPage}`,
    totalPages: safePage > 1 ? (nearEndPage - nearStartPage + 1) : 0,
    description: safePage > 1 
      ? `تسميع آخر 20 صفحة (الصفحات ${nearStartPage} - ${nearEndPage}) غيباً لحمايتها من التفلت في أول 30 يوماً من الحفظ.`
      : `ستبدأ المراجعة القريبة تلقائياً بعد حفظ الصفحة الأولى.`,
    timeEstimate: '25 دقيقة',
    icon: 'RefreshCw',
    badge: `${safePage > 1 ? (nearEndPage - nearStartPage + 1) : 0} صفحة قريبة`
  };

  // 5. الحصن الخامس: المراجعة البعيدة (المحفوظ القديم والصلوات)
  let farJuzList = [];
  if (safeJuz > 1) {
    for (let j = 1; j < safeJuz; j++) {
      farJuzList.push(j);
    }
  }
  const fortress5 = {
    title: 'الحصن الخامس: المراجعة البعيدة وتعهّد الأجزاء السابقة',
    shortTitle: 'مراجعة القديم والصلاة به',
    previousJuz: farJuzList,
    todayFarJuz: farJuzList.length > 0 ? ((safePage % farJuzList.length) + 1) : null,
    description: farJuzList.length > 0
      ? `مراجعة الأجزاء السابقة (من الجزء 1 إلى الجزء ${safeJuz - 1}) بمعدل جزء يومياً مع الصلاة بربعين منها في قيام الليل والسنن.`
      : `عند إتمامك للجزء الأول، سينشط هذا الحصن لتدوير الأجزاء السابقة والصلاة بها.`,
    timeEstimate: '30 دقيقة',
    icon: 'ShieldCheck',
    badge: farJuzList.length > 0 ? `${farJuzList.length} أجزاء قديمة` : 'ينشط بعد الجزء 1'
  };

  return {
    userId: '',
    lastJuzReached: safeJuz,
    currentPage: safePage,
    currentSurah,
    currentJuz,
    dailyTarget,
    fortress1_khatmah: fortress1,
    fortress2_preparation: fortress2,
    fortress3_newMemorization: fortress3,
    fortress4_nearRevision: fortress4,
    fortress5_farRevision: fortress5,
    completionStatus: {
      khatmah: false,
      preparation: false,
      newMemorization: false,
      nearRevision: false,
      farRevision: false
    },
    updatedAt: new Date().toISOString()
  };
}

/**
 * Save or update the user's Five Fortresses Plan in Firestore
 */
export const fortressKeys = ['khatmah', 'preparation', 'newMemorization', 'nearRevision', 'farRevision'];
export const fortressDay = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Amman', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value ? new Date(value) : new Date());
export function normalizeFortressCompletion(status = {}) {
  return Object.fromEntries(fortressKeys.map((key, index) => [key, status[key] === true || status[index + 1] === true]));
}
export function numericFortressCompletion(status = {}) {
  const normalized = normalizeFortressCompletion(status);
  return Object.fromEntries(fortressKeys.map((key, index) => [index + 1, normalized[key]]));
}
export function currentFortressCompletion(plan) {
  const storedDay = plan?.completionDate || (plan?.updatedAt ? fortressDay(plan.updatedAt) : null);
  return normalizeFortressCompletion(storedDay === fortressDay() ? plan?.completionStatus : {});
}

export async function saveFortressPlanToFirestore(userId, planData) {
  if (!userId) throw new Error('User ID is required');
  if (auth.currentUser?.uid !== userId) throw new Error('Authentication/plan ownership required');
  const { persistenceStatus, ...plan } = planData;
  const response = await fetchWithAuth('/api/user/fortress-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: { ...plan, userId, completionStatus: normalizeFortressCompletion(plan.completionStatus), completionDate: fortressDay() } })
  });
  const result = await response.json();
  if (auth.currentUser?.uid !== userId) throw new Error('Authentication changed while saving the plan');
  if (!response.ok || result.success !== true || result.persisted !== true || result.plan?.userId !== userId || !result.plan?.updatedAt) {
    throw new Error(result.message || 'Could not confirm fortress plan persistence');
  }
  return { ...result, plan: { ...result.plan, persistenceStatus: 'saved' } };
}

/**
 * Fetch the user's Five Fortresses Plan from Firestore
 */
export async function getFortressPlanFromFirestore(userId, lastJuz = 1, currentPage = 1) {
  if (!userId || auth.currentUser?.uid !== userId) throw new Error('Authentication/plan ownership required');
  const response = await fetchWithAuth(`/api/user/fortress-plan/${encodeURIComponent(userId)}`);
  const result = await response.json();
  if (auth.currentUser?.uid !== userId) throw new Error('Authentication changed while loading the plan');
  if (response.status === 404 && result.success === false) {
    return { ...generateFiveFortressesPlan(lastJuz, currentPage), userId, persistenceStatus: 'draft' };
  }
  if (!response.ok || result.success !== true || result.plan?.userId !== userId) {
    throw new Error(result.message || 'Could not load the saved fortress plan');
  }
  return { ...result.plan, persistenceStatus: 'saved' };
}

/**
 * Listen to real-time updates for the Five Fortresses Plan
 */
export function subscribeToFortressPlan(userId, onUpdate, onError = () => {}) {
  if (!userId) return () => {};

  try {
    const planRef = doc(db, 'users', userId, 'five_fortresses_plans', 'current');
    return onSnapshot(planRef, (snapshot) => {
      if (snapshot.exists() && !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
        const data = snapshot.data();
        onUpdate({ ...data, persistenceStatus: 'saved' });
      }
    }, (error) => {
      onError(error);
    });
  } catch (e) {
    onError(e);
    return () => {};
  }
}
