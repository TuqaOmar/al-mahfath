import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../server/recitationEngine.js';
import * as Q from '../server/quranReference.js';
import * as S from '../server/quranActivityStreak.js';

// Pure recitation-engine checks (no network, no Firebase). Run: npm run test:engine
const sc = r => r.accuracy ?? r.score;
const pick = a => a.text;
const surahText = n => Q.quranSurahReference(n).ayahs.map(a => a.text).join(' ');
const fullText = surahText(1);

test('reference: 604 pages and 114 surahs load', () => {
  for (const p of [1, 2, 300, 604]) assert.ok(Q.quranPageReference(p));
  assert.throws(() => Q.quranPageReference(0));
  assert.throws(() => Q.quranPageReference(605));
  assert.throws(() => Q.quranSurahReference(115));
});

test('perfect recitation of al-Fatiha scores 100', () => {
  const r = E.compareRecitation(fullText, fullText);
  assert.ok(r.accuracy >= 99 || r.score >= 99, JSON.stringify(Object.keys(r)) + ' ' + (r.accuracy ?? r.score));
});

test('same words without diacritics (speech-to-text style) still pass', () => {
  const plain = E.normalizeQuran(fullText);
  const r = E.compareRecitation(fullText, plain);
  assert.ok((r.accuracy ?? r.score) >= 90, 'got ' + (r.accuracy ?? r.score));
});

test('empty / unrelated recitation scores low', () => {
  const r = E.compareRecitation(fullText, 'مرحبا كيف الحال اليوم');
  assert.ok((r.accuracy ?? r.score) < 30, 'got ' + (r.accuracy ?? r.score));
});

test('missing half of the text lowers the score', () => {
  const words = E.normalizeQuran(fullText).split(/\s+/);
  const r = E.compareRecitation(fullText, words.slice(0, Math.floor(words.length / 2)).join(' '));
  const s = r.accuracy ?? r.score;
  assert.ok(s < 70 && s > 20, 'got ' + s);
});

test('full-page comparison works on page 1', () => {
  const page = Q.quranPageReference(1);
  const list = page.ayahs || page.verses;
  const txt = list.map(pick).join(' ');
  const r = E.comparePageRecitation(list, txt);
  assert.ok((r.accuracy ?? r.score) >= 99, 'got ' + (r.accuracy ?? r.score));
});

test('repeating the same ayah twice is not rewarded as extra correct words', () => {
  const r = E.compareRecitation(fullText, fullText + ' ' + fullText);
  const s = r.accuracy ?? r.score;
  assert.ok(s <= 100, 'got ' + s);
});

test('streak: same day keeps, next day +1, gap resets (Amman time)', () => {
  const d1 = new Date('2026-11-14T20:00:00Z'); // 23:00 Amman
  const p = { streak: 3, lastQuranActivityDate: S.ammanDateKey(d1) };
  const same = S.nextQuranActivityStreak(p, new Date('2026-11-14T20:30:00Z'));
  const next = S.nextQuranActivityStreak(p, new Date('2026-11-14T21:30:00Z')); // 00:30 next day Amman
  const gap = S.nextQuranActivityStreak(p, new Date('2026-11-17T10:00:00Z'));
  const v = x => (typeof x === 'object' ? x.streak : x);
  assert.equal(v(same), 3); assert.equal(v(next), 4); assert.equal(v(gap), 1);
});

test('Al-Fatiha: skipping ayah 1 (the Basmalah) must NOT give 100%', () => {
  const ay = Q.quranSurahReference(1).ayahs;
  const full = ay.map(a => a.text).join(' ');
  const withoutFirst = ay.slice(1).map(a => a.text).join(' ');
  const s = sc(E.compareRecitation(full, withoutFirst));
  assert.ok(s < 100, 'skipping a whole ayah of al-Fatiha scored ' + s);
});

test('empty recitation gives 0, not a crash or NaN', () => {
  const r = E.compareRecitation(surahText(112), '');
  assert.ok(Number.isFinite(sc(r)) && sc(r) === 0, 'got ' + sc(r));
});

test('words in shuffled order are penalised', () => {
  const w = E.normalizeQuran(surahText(112)).split(/\s+/);
  const s = sc(E.compareRecitation(surahText(112), [...w].reverse().join(' ')));
  assert.ok(s < 60, 'reversed scored ' + s);
});

test('full page: reading only first ayah of page 2 is not near-perfect', () => {
  const p = Q.quranPageReference(2).ayahs;
  const s = sc(E.comparePageRecitation(p, p[0].text));
  assert.ok(s < 40, 'got ' + s);
});

test('At-Tawbah (no Basmalah) perfect recitation = 100', () => {
  const t = Q.quranSurahReference(9).ayahs.slice(0, 3).map(a => a.text).join(' ');
  assert.ok(sc(E.compareRecitation(t, t)) >= 99);
});

test('Muqattaat spelled out (ألف لام ميم) are accepted', () => {
  const t = Q.quranSurahReference(2).ayahs.slice(0, 2).map(a => a.text).join(' ');
  const spoken = E.normalizeQuran(t).replace(/^بسم الله الرحمن الرحيم\s*/, '').replace(/^الم/, 'ألف لام ميم');
  const s = sc(E.compareRecitation(t, spoken));
  assert.ok(s >= 90, 'got ' + s + ' spoken=' + spoken.slice(0, 40));
});

test('every one of the 604 pages self-compares to >=99', () => {
  const bad = [];
  for (let p = 1; p <= 604; p++) {
    const a = Q.quranPageReference(p).ayahs;
    const s = sc(E.comparePageRecitation(a, a.map(x => x.text).join(' ')));
    if (!(s >= 99)) bad.push(p + ':' + s);
  }
  assert.deepEqual(bad, []);
});

test('every page passes when read as plain (no tashkeel) text, as speech-to-text returns', () => {
  const bad = [];
  for (let p = 1; p <= 604; p++) {
    const a = Q.quranPageReference(p).ayahs;
    const plain = a.map(x => E.normalizeQuran(x.text)).join(' ');
    const s = sc(E.comparePageRecitation(a, plain));
    if (!(s >= 90)) bad.push(p + ':' + s);
  }
  assert.ok(bad.length === 0, bad.length + ' pages: ' + bad.slice(0, 15).join(', '));
});

test('missing ffmpeg is reported as an error instead of crashing the server', async () => {
  const savedPath = process.env.PATH;
  process.env.PATH = '/nonexistent-ffmpeg-test';
  try {
    await assert.rejects(() => E.convertTo16kHzWav(Buffer.from('not audio')), /ENOENT|ffmpeg/i);
  } finally {
    process.env.PATH = savedPath;
  }
});
