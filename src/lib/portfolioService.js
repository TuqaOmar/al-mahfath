import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';
import surahsCatalog from '../utils/quranSurahsList.json';

/**
 * Key format for an Ayah: `${surahNumber}_${ayahNumber}`
 */
export const makeAyahKey = (surahNumber, ayahNumber) => `${Number(surahNumber)}_${Number(ayahNumber)}`;

/**
 * Seed an initial portfolio for a user based on their memorized pages count
 * If user has memorized pages (e.g. 49 pages for Demo user),
 * it calculates which surahs and ayahs are inside those pages and marks them as memorized!
 */
export function generateInitialPortfolioFromPages(memorizedPagesCount = 0) {
  const portfolio = {};
  const pagesCount = Math.max(0, Number(memorizedPagesCount) || 0);

  if (pagesCount <= 0) return portfolio;

  // Sura 1 (Al-Fatiha) has 7 ayahs on page 1
  if (pagesCount >= 1) {
    for (let a = 1; a <= 7; a++) {
      portfolio[makeAyahKey(1, a)] = {
        surahNumber: 1,
        ayahNumber: a,
        globalAyahNumber: a,
        status: 'memorized',
        repetitionCount: 40,
        recitationScore: 98,
        lastReviewed: 'اليوم',
        notes: 'سورة الفاتحة - السبع المثاني',
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Sura 2 (Al-Baqarah) starts at page 2 and ends at page 49
  // Page 2 to 49 covers all 286 verses of Al-Baqarah!
  // At page 49, Al-Baqarah finishes (286 ayahs).
  if (pagesCount >= 2) {
    // Determine how many ayahs of Al-Baqarah are covered by the user's memorized pages
    // Al-Baqarah has 286 ayahs across 48 pages (~6 ayahs/page)
    const baqarahPages = Math.min(48, pagesCount - 1);
    const baqarahAyahsCount = Math.min(286, Math.round((baqarahPages / 48) * 286));

    for (let a = 1; a <= baqarahAyahsCount; a++) {
      let status = 'memorized';
      let score = 95;
      let repetition = 40;

      if (a % 15 === 0) {
        status = 'review';
        score = 75;
        repetition = 20;
      } else if (a % 23 === 0) {
        status = 'learning';
        score = 60;
        repetition = 10;
      }

      portfolio[makeAyahKey(2, a)] = {
        surahNumber: 2,
        ayahNumber: a,
        globalAyahNumber: 7 + a,
        status,
        repetitionCount: repetition,
        recitationScore: score,
        lastReviewed: status === 'memorized' ? 'أمس' : 'منذ 3 أيام',
        notes: a === 255 ? 'آية الكرسي - أعظم آية في كتاب الله' : '',
        updatedAt: new Date().toISOString()
      };
    }
  }

  // If user has even more pages (e.g. 604 pages - full Quran)
  if (pagesCount >= 50) {
    // Add additional Surahs proportionally
    for (const s of surahsCatalog) {
      if (s.number <= 2) continue; // already handled
      if (s.startPage <= pagesCount) {
        // This surah is at least partially or fully memorized
        const isFullyInside = (s.number < 114 ? surahsCatalog[s.number].startPage : 605) <= pagesCount;
        const count = isFullyInside ? s.numberOfAyahs : Math.max(1, Math.round(s.numberOfAyahs * 0.5));
        for (let a = 1; a <= count; a++) {
          portfolio[makeAyahKey(s.number, a)] = {
            surahNumber: s.number,
            ayahNumber: a,
            status: 'memorized',
            repetitionCount: 40,
            recitationScore: 95,
            lastReviewed: 'مؤخراً',
            notes: '',
            updatedAt: new Date().toISOString()
          };
        }
      }
    }
  }

  return portfolio;
}

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

    // 2. Try REST backend
    const res = await fetch(`/api/user/${userId}/portfolio`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.portfolio) && json.portfolio.length > 0) {
        const restPortfolio = {};
        json.portfolio.forEach(item => {
          const key = makeAyahKey(item.surahNumber, item.ayahNumber);
          restPortfolio[key] = item;
        });
        localStorage.setItem(cacheKey, JSON.stringify(restPortfolio));
        return restPortfolio;
      }
    }
  } catch (error) {
    console.warn('Network fetch error for portfolio, using local fallback:', error);
  }

  // 3. Fallback to local cache if valid
  if (localData && Object.keys(localData).length > 0) {
    return localData;
  }

  // 4. Generate initial portfolio based on memorized pages count
  const initial = generateInitialPortfolioFromPages(memorizedPagesCount);
  if (Object.keys(initial).length > 0) {
    localStorage.setItem(cacheKey, JSON.stringify(initial));
    // Persist async to Firestore and REST
    saveBulkPortfolio(userId, initial).catch(e => console.warn('Background sync failed:', e));
  }
  return initial;
}

/**
 * Save an individual Ayah's memorization state to user's portfolio in Firestore, REST, and LocalStorage
 */
export async function saveAyahToPortfolio(userId, ayahData) {
  if (!userId || !ayahData) return null;

  const key = makeAyahKey(ayahData.surahNumber, ayahData.ayahNumber);
  const cacheKey = `ma7fath_portfolio_${userId}`;

  // Update local cache immediately for zero-latency UI
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

  currentPortfolio[key] = updatedRecord;
  localStorage.setItem(cacheKey, JSON.stringify(currentPortfolio));

  // Sync to Firestore
  try {
    const docRef = doc(db, 'users', userId, 'ayah_progress', key);
    await setDoc(docRef, updatedRecord, { merge: true });
  } catch (err) {
    console.warn('Firestore write error for ayah:', err);
  }

  // Sync to backend REST API
  try {
    fetch(`/api/user/${userId}/portfolio/ayah`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord)
    }).catch(() => {});
  } catch (e) {}

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
  localStorage.setItem(cacheKey, JSON.stringify(merged));

  // Batch write to Firestore (in chunks of up to 400 docs)
  const items = Object.values(portfolioMap);
  try {
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
  } catch (err) {
    console.warn('Batch Firestore write error:', err);
  }

  // Also sync to REST
  try {
    if (items.length > 0 && items[0]?.surahNumber) {
      fetch(`/api/user/${userId}/portfolio/bulk-surah`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahNumber: items[0].surahNumber,
          ayahs: items
        })
      }).catch(() => {});
    }
  } catch (e) {}

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
