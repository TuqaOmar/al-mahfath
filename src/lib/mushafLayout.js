// Line-by-line layout of the Madinah mushaf (King Fahd Complex, 15 lines per page) from quran.com,
// rendered with the matching per-page QPC V2 font so the page looks exactly like the printed copy.
// Display only: recitation checking keeps using the bundled Uthmani text from /api/quran/reference.

const LAYOUT_URL = page => `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=code_v2,line_number&fields=verse_key&per_page=50`;
const FONT_URL = page => `https://verses.quran.com/fonts/quran/hafs/v2/woff2/p${page}.woff2`;

export const mushafFontFamily = page => `qpc-v2-p${page}`;
export const linesOnPage = page => (page <= 2 ? 8 : 15);

const layoutCache = new Map();
const fontCache = new Map();

const loadFont = page => {
  if (!fontCache.has(page)) {
    const face = new FontFace(mushafFontFamily(page), `url(${FONT_URL(page)}) format('woff2')`, { display: 'block' });
    fontCache.set(page, face.load().then(loaded => { document.fonts.add(loaded); return loaded; }));
    fontCache.get(page).catch(() => fontCache.delete(page));
  }
  return fontCache.get(page);
};

const fetchVerses = async page => {
  const res = await fetch(LAYOUT_URL(page));
  if (!res.ok) throw new Error(`mushaf layout ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.verses) || data.verses.length === 0) throw new Error('mushaf layout empty');
  return data.verses;
};

/**
 * Builds the page's lines. Each line is one of:
 *   { type: 'words', number, words: [{ code, ayahNumber, isEnd }] }
 *   { type: 'surah', number, surahNumber }   (surah title band)
 *   { type: 'basmala', number }
 * Lines with no words are surah titles/basmalas: before a surah's first verse (title then basmala,
 * title only for At-Tawbah and Al-Fatiha), or at the bottom of a page for the next surah.
 */
const buildLines = (page, verses) => {
  const total = linesOnPage(page);
  const byLine = new Map();
  const surahStartLine = new Map();
  for (const verse of verses) {
    const surahNumber = Number(verse.verse_key.split(':')[0]);
    verse.words.forEach((word, index) => {
      if (!byLine.has(word.line_number)) byLine.set(word.line_number, []);
      byLine.get(word.line_number).push({ code: word.code_v2, ayahNumber: verse.id, isEnd: word.char_type_name === 'end' });
      if (verse.verse_number === 1 && index === 0) surahStartLine.set(word.line_number, surahNumber);
    });
  }

  const lines = [];
  for (let number = 1; number <= total; number += 1) {
    if (byLine.has(number)) lines.push({ type: 'words', number, words: byLine.get(number) });
    else lines.push({ type: 'empty', number });
  }

  // Fill the empty lines from the surah each one introduces.
  const lastSurah = Number(verses[verses.length - 1].verse_key.split(':')[0]);
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].type !== 'empty') continue;
    let j = i;
    while (j < lines.length && lines[j].type === 'empty') j += 1;
    const gap = lines.slice(i, j);
    const nextSurah = j < lines.length ? surahStartLine.get(lines[j].number) : lastSurah + 1;
    if (nextSurah) {
      const hasBasmala = nextSurah !== 1 && nextSurah !== 9;
      gap.forEach((line, k) => {
        const fromEnd = gap.length - k;
        const trailing = j >= lines.length;
        // Leading gap: [..., title, basmala]. Trailing gap (bottom of page): [title, basmala].
        const isBasmala = hasBasmala && (trailing ? k === 1 : fromEnd === 1);
        Object.assign(line, isBasmala ? { type: 'basmala' } : { type: 'surah', surahNumber: nextSurah });
      });
    }
    i = j - 1;
  }
  return lines.filter(line => line.type !== 'empty');
};

/** Layout + font for a page; cached, so flipping back is instant. */
export const loadMushafPage = page => {
  if (!layoutCache.has(page)) {
    const promise = Promise.all([fetchVerses(page), loadFont(page)]).then(([verses]) => buildLines(page, verses));
    layoutCache.set(page, promise);
    promise.catch(() => layoutCache.delete(page));
  }
  return layoutCache.get(page);
};

/** Warm the cache for neighbouring pages without surfacing errors. */
export const prefetchMushafPage = page => {
  if (page >= 1 && page <= 604) loadMushafPage(page).catch(() => {});
};
