import { doc, setDoc, collection, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import surahsCatalog from '../utils/quranSurahsList.json';

/**
 * Key format for an Ayah: `${surahNumber}_${ayahNumber}`
 */
export const makeAyahKey = (surahNumber, ayahNumber) => `${Number(surahNumber)}_${Number(ayahNumber)}`;

/** Never infer ayah progress from a legacy page count. */
// Legacy helper retained for import compatibility. Counts cannot establish ayah progress.
export function generateInitialPortfolioFromPages() { return {}; }

/**
 * Fetch the user's complete memorization portfolio from Firestore with LocalStorage fallback
 */
export async function fetchUserPortfolio(userId, memorizedPagesCount = 0) {
  if (!userId) {
    return generateInitialPortfolioFromPages(memorizedPagesCount);
  }

  const cacheKey = `ma7fath_portfolio_${userId}`;
  const localCache = localStorage.getItem(cacheKey);
  let localData = null;
  if (localCache) {
    try {
      localData = JSON.parse(localCache);
    } catch (e) {
      localData = null;
    }
  }

  try {
    // 1. Try Firestore ayah_progress subcollection
    const collRef = collection(db, 'users', userId, 'ayah_progress');
    const snapshot = await getDocs(collRef);

    if (!snapshot.empty) {
      const firestorePortfolio = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const key = makeAyahKey(data.surahNumber, data.ayahNumber);
        firestorePortfolio[key] = data;
      });

      localStorage.setItem(cacheKey, JSON.stringify(firestorePortfolio));
      return firestorePortfolio;
    }

    localStorage.setItem(cacheKey, JSON.stringify({}));
    return {};
  } catch (error) {
    console.warn('Network fetch error for portfolio, using local fallback:', error);
  }

  // 3. Fallback to local cache if valid
  if (localData && Object.keys(localData).length > 0) {
    return localData;
  }

  return {};
}

/**
 * Save an individual Ayah's memorization state to user's portfolio in Firestore, REST, and LocalStorage
 */
export async function saveAyahToPortfolio(userId, ayahData) {
  if (!userId || !ayahData) return null;

  const key = makeAyahKey(ayahData.surahNumber, ayahData.ayahNumber);
  const cacheKey = `ma7fath_portfolio_${userId}`;

  // Firestore is the source of truth. Cache only after the committed write.
  let currentPortfolio = {};
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) currentPortfolio = JSON.parse(cached);
  } catch (e) {}

  const updatedRecord = {
    ...currentPortfolio[key],
    ...ayahData,
    userId,
    updatedAt: new Date().toISOString()
  };

  const docRef = doc(db, 'users', userId, 'ayah_progress', key);
  await setDoc(docRef, updatedRecord, { merge: true });
  currentPortfolio[key] = updatedRecord;
  localStorage.setItem(cacheKey, JSON.stringify(currentPortfolio));

  return updatedRecord;
}

/**
 * Bulk save or update multiple ayahs (e.g. marking a whole Surah as memorized)
 */
export async function saveBulkPortfolio(userId, portfolioMap) {
  if (!userId || !portfolioMap) return;

  const cacheKey = `ma7fath_portfolio_${userId}`;
  let current = {};
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) current = JSON.parse(cached);
  } catch (e) {}

  const merged = { ...current, ...portfolioMap };

  // Batch write to Firestore (in chunks of up to 400 docs)
  const items = Object.values(portfolioMap);
  const chunkSize = 300;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const key = makeAyahKey(item.surahNumber, item.ayahNumber);
      const docRef = doc(db, 'users', userId, 'ayah_progress', key);
      batch.set(docRef, { ...item, userId, updatedAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
  }
  localStorage.setItem(cacheKey, JSON.stringify(merged));

  return merged;
}

/**
 * Subscribe to real-time changes in the user's portfolio
 */
export function subscribeToUserPortfolio(userId, onUpdate) {
  if (!userId) return () => {};

  try {
    const collRef = collection(db, 'users', userId, 'ayah_progress');
    return onSnapshot(collRef, (snapshot) => {
      const portfolio = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const key = makeAyahKey(data.surahNumber, data.ayahNumber);
        portfolio[key] = data;
      });

      if (Object.keys(portfolio).length > 0) {
        localStorage.setItem(`ma7fath_portfolio_${userId}`, JSON.stringify(portfolio));
        onUpdate(portfolio);
      }
    }, (err) => {
      console.warn('Firestore snapshot error for portfolio:', err);
    });
  } catch (e) {
    console.warn('Failed to set up Firestore portfolio listener:', e);
    return () => {};
  }
}

/**
 * Calculate statistics for a specific Surah based on the portfolio
 */
export function getSurahMemorizationStats(surahNumber, numberOfAyahs, portfolio = {}) {
  const total = Number(numberOfAyahs) || 1;
  let memorizedCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let totalScoreSum = 0;
  let scoredCount = 0;
  let totalRepetitions = 0;

  for (let a = 1; a <= total; a++) {
    const key = makeAyahKey(surahNumber, a);
    const item = portfolio[key];
    if (item) {
      if (item.status === 'memorized') memorizedCount++;
      else if (item.status === 'learning') learningCount++;
      else if (item.status === 'review') reviewCount++;

      if (item.recitationScore) {
        totalScoreSum += Number(item.recitationScore);
        scoredCount++;
      }
      if (item.repetitionCount) {
        totalRepetitions += Number(item.repetitionCount);
      }
    }
  }

  const percent = Math.min(100, Math.round((memorizedCount / total) * 100));
  const avgScore = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : 0;

  let status = 'unmemorized';
  if (percent === 100) status = 'memorized';
  else if (reviewCount > 0) status = 'review';
  else if (memorizedCount > 0 || learningCount > 0) status = 'learning';

  return {
    surahNumber,
    totalAyahs: total,
    memorizedCount,
    learningCount,
    reviewCount,
    unmemorizedCount: total - (memorizedCount + learningCount + reviewCount),
    percent,
    avgScore,
    totalRepetitions,
    status
  };
}

/**
 * Calculate overall Quran statistics across all 114 Surahs
 */
export function getGlobalPortfolioStats(portfolio = {}) {
  let totalMemorizedAyahs = 0;
  let totalLearningAyahs = 0;
  let totalReviewAyahs = 0;
  let completedSurahsCount = 0;
  let inProgressSurahsCount = 0;
  let totalRepetitions = 0;

  for (const surah of surahsCatalog) {
    const stats = getSurahMemorizationStats(surah.number, surah.numberOfAyahs, portfolio);
    totalMemorizedAyahs += stats.memorizedCount;
    totalLearningAyahs += stats.learningCount;
    totalReviewAyahs += stats.reviewCount;
    totalRepetitions += stats.totalRepetitions;

    if (stats.percent === 100) {
      completedSurahsCount++;
    } else if (stats.memorizedCount > 0 || stats.learningCount > 0 || stats.reviewCount > 0) {
      inProgressSurahsCount++;
    }
  }

  const totalQuranAyahs = 6236;
  const overallPercent = Number(((totalMemorizedAyahs / totalQuranAyahs) * 100).toFixed(1));
  const pagesEquivalent = Number((totalMemorizedAyahs / 10.3).toFixed(0)); // average ~10.3 ayahs per page
  const juzEquivalent = Number((pagesEquivalent / 20).toFixed(1));

  return {
    totalQuranAyahs,
    totalMemorizedAyahs,
    totalLearningAyahs,
    totalReviewAyahs,
    completedSurahsCount,
    inProgressSurahsCount,
    overallPercent,
    pagesEquivalent: Math.min(604, pagesEquivalent),
    juzEquivalent: Math.min(30, juzEquivalent),
    totalRepetitions
  };
}
