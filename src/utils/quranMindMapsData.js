// Authoritative Quran Mind Maps Database (الخرائط الذهنية ومقاصد سور القرآن الكريم لجميع الـ 114 سورة)
// Source: المختصر في التفسير (مركز تفسير للدراسات القرآنية) + أطلس سور القرآن ومقاصد السور
import quranSurahsList from './quranSurahsList.json';
import quran114MindMaps from '../data/quran114MindMaps.json';

export const MIND_MAPS_SOURCE_INFO = {
  title: "الخرائط الذهنية ومقاصد سور القرآن الكريم (114 سورة كاملة)",
  primarySource: "المختصر في التفسير (مركز تفسير للدراسات القرآنية)",
  secondarySources: [
    "أطلس سور القرآن الكريم (الخرائط الذهنية لسور القرآن الكريم)",
    "مقاصد سور القرآن الكريم (د. محمد الخضيري)",
    "نظم الدرر في تناسب الآيات والسور (الإمام البقاعي)"
  ],
  verifiedSurahsCount: 114
};

// Normalizes Arabic text for flexible matching
function normalizeArabic(text = '') {
  return String(text)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .trim()
    .toLowerCase();
}

/**
 * Returns full mind map record for any of the 114 surahs
 * @param {number|string} surahIdentifier - Surah number (1-114) or Surah name
 */
export function getSurahMindMap(surahIdentifier) {
  let surahNum = 1;

  if (typeof surahIdentifier === 'number') {
    surahNum = Math.min(114, Math.max(1, surahIdentifier));
  } else if (typeof surahIdentifier === 'string') {
    const cleanQuery = normalizeArabic(surahIdentifier);
    // First check if it's a numeric string
    const parsed = parseInt(cleanQuery, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 114) {
      surahNum = parsed;
    } else {
      const found = quranSurahsList.find(s => {
        const normClean = normalizeArabic(s.cleanName);
        const normFull = normalizeArabic(s.name);
        return normClean === cleanQuery || 
               normFull === cleanQuery || 
               normClean.includes(cleanQuery) || 
               cleanQuery.includes(normClean);
      });
      if (found) {
        surahNum = found.number;
      }
    }
  }

  // Retrieve pre-built full record from complete 114 database
  const record = quran114MindMaps[String(surahNum)] || quran114MindMaps[surahNum];

  if (record) {
    return record;
  }

  // Safe fallback to first surah if not found
  return quran114MindMaps["1"];
}

/**
 * Get all 114 Surahs summary list for UI selector and filters
 */
export function getAllSurahsList() {
  return quranSurahsList.map(s => {
    const record = quran114MindMaps[String(s.number)];
    return {
      number: s.number,
      name: s.cleanName,
      fullName: s.name,
      revelationType: s.revelationType,
      ayahCount: s.numberOfAyahs,
      startPage: s.startPage,
      juz: s.juz,
      axisPreview: record ? record.axis : ''
    };
  });
}
