import { readFileSync } from 'node:fs';

const corpus = JSON.parse(readFileSync(new URL('./data/quran-uthmani.json', import.meta.url), 'utf8'));

if (corpus.identifier !== 'quran-uthmani' || corpus.surahs?.length !== 114 ||
    corpus.surahs.reduce((sum, surah) => sum + surah.ayahs.length, 0) !== 6236) {
  throw new Error('The bundled Quran reference is incomplete');
}

const surahs = new Map(corpus.surahs.map(surah => [surah.number, surah]));
const globalAyahs = new Map(corpus.surahs.flatMap(surah => surah.ayahs.map(ayah => [ayah.number, { ...ayah, surah }])))

const publicAyah = (ayah, surah) => ({
  number: ayah.number,
  numberInSurah: ayah.numberInSurah,
  page: ayah.page,
  text: ayah.text,
  surah: { number: surah.number, name: surah.name, englishName: surah.englishName }
});

export function quranPageReference(pageNumber) {
  const page = Number(pageNumber);
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    throw Object.assign(new Error('رقم الصفحة غير صالح'), { status: 400 });
  }
  const ayahs = corpus.surahs.flatMap(surah => surah.ayahs
    .filter(ayah => ayah.page === page)
    .map(ayah => publicAyah(ayah, surah)));
  if (!ayahs.length) throw Object.assign(new Error('الصفحة القرآنية غير موجودة'), { status: 404 });
  return { pageNumber: page, ayahs };
}

export function quranSurahReference(surahNumber) {
  const surah = surahs.get(Number(surahNumber));
  if (!surah) throw Object.assign(new Error('رقم السورة غير صالح'), { status: 400 });
  return {
    number: surah.number,
    name: surah.name,
    englishName: surah.englishName,
    ayahs: surah.ayahs.map(ayah => publicAyah(ayah, surah))
  };
}

export function trustedQuranReference({ surahNumber, ayahNumber, pageNumber, isFullPage }) {
  const surah = surahs.get(Number(surahNumber));
  if (!surah) throw Object.assign(new Error('رقم السورة غير صالح'), { status: 400 });

  if (isFullPage) {
    const page = Number(pageNumber);
    if (!Number.isInteger(page) || page < 1 || page > 604) throw Object.assign(new Error('رقم الصفحة غير صالح'), { status: 400 });
    const ayahs = corpus.surahs.flatMap(item => item.ayahs
      .filter(ayah => ayah.page === page)
      .map(ayah => ({ text: ayah.text, number: ayah.number, numberInSurah: ayah.numberInSurah,
        surah: { number: item.number, name: item.name } })));
    if (!ayahs.length || !ayahs.some(ayah => ayah.surah.number === surah.number)) {
      throw Object.assign(new Error('السورة لا تطابق الصفحة المحددة'), { status: 400 });
    }
    return { expectedText: ayahs.map(ayah => ayah.text).join(' '), ayahs, pageNumber: page,
      surahNumber: surah.number, surahName: surah.name, ayahNumber: null };
  }

  const ayah = globalAyahs.get(Number(ayahNumber));
  if (!ayah || ayah.surah.number !== surah.number) throw Object.assign(new Error('رقم الآية لا يطابق السورة المحددة'), { status: 400 });
  if (pageNumber != null && Number(pageNumber) !== ayah.page) throw Object.assign(new Error('رقم الصفحة لا يطابق الآية المحددة'), { status: 400 });
  return { expectedText: ayah.text, ayahs: [], pageNumber: ayah.page, surahNumber: surah.number,
    surahName: surah.name, ayahNumber: ayah.number, numberInSurah: ayah.numberInSurah };
}

export const quranReferenceMetadata = Object.freeze({
  source: corpus.source, sourceUrl: corpus.sourceUrl, identifier: corpus.identifier,
  surahs: 114, ayahs: 6236
});
