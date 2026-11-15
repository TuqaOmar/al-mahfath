// QA recitation-accuracy cases (TC-REC-*). Pure engine, no network.
// Run: node --test QA-REPORT/automation/recitation-accuracy.qa.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../server/recitationEngine.js';
import * as Q from '../../server/quranReference.js';

const ayah = (s, a) => Q.quranSurahReference(s).ayahs.find(x => x.numberInSurah === a).text;
const plain = t => E.normalizeQuran(t);
const words = t => plain(t).split(/\s+/);
const run = (exp, spk) => E.compareRecitation(exp, spk);
const statuses = r => r.results.map(x => x.status);
const log = (id, r) => console.log(`${id}: accuracy=${r.accuracy} statuses=${JSON.stringify(statuses(r))}`);

// Al-Ikhlas 112:1  «قُلْ هُوَ ٱللَّهُ أَحَدٌ»
const IKH1 = ayah(112, 1);
// Al-Baqarah 2:2 (8 words incl. waqf marks)
const BQ2 = ayah(2, 2);

test('TC-REC-10 missing word is flagged as missing_word and lowers score', () => {
  const w = words(IKH1); const r = run(IKH1, [w[0], w[1], w[3]].join(' ')); log('TC-REC-10', r);
  assert.ok(statuses(r).includes('missing_word')); assert.ok(r.accuracy < 100);
});
test('TC-REC-11 extra word is flagged as extra_word', () => {
  const r = run(IKH1, plain(IKH1) + ' الصمد'); log('TC-REC-11', r);
  assert.ok(statuses(r).includes('extra_word')); assert.ok(r.accuracy < 100);
});
test('TC-REC-12 substituted word is flagged on that exact word', () => {
  const t = ayah(112, 4); const w = words(t); w[3] = 'مثلا'; const r = run(t, w.join(' ')); log('TC-REC-12', r);
  const bad = r.results.filter(x => x.status !== 'correct');
  assert.equal(bad.length, 1); assert.equal(plain(bad[0].expected), 'كفوا'); assert.equal(bad[0].status, 'word_error');
});
test('TC-REC-12b a different word replacing an «ال» word is reported as a different word, not as «حذف أداة التعريف»', () => {
  const t = ayah(1, 2); const w = words(t); w[0] = 'شكرا'; const r = run(t, w.join(' ')); log('TC-REC-12b', r);
  const bad = r.results.find(x => x.status !== 'correct');
  console.log('TC-REC-12b message:', bad.status, bad.message);
  assert.equal(bad.status, 'word_error', 'got ' + bad.status + ': ' + bad.message);
});
test('TC-REC-13 swapped word order is penalised', () => {
  const w = words(BQ2); [w[0], w[1]] = [w[1], w[0]]; const r = run(BQ2, w.join(' ')); log('TC-REC-13', r);
  assert.ok(r.accuracy < 100);
});
test('TC-REC-14 repeated word (stutter) is penalised only lightly', () => {
  const w = words(BQ2); w.splice(1, 0, w[1]); const r = run(BQ2, w.join(' ')); log('TC-REC-14', r);
  assert.ok(r.accuracy < 100 && r.accuracy >= 90, 'got ' + r.accuracy);
});
test('TC-REC-15 wrong final harakah (i‘rab) with diacritics is detected', () => {
  // «أَحَدٌ» read as «أَحَدَ»
  const spoken = IKH1.replace('أَحَدٌ', 'أَحَدَ'); const r = run(IKH1, spoken); log('TC-REC-15', r);
  assert.ok(r.accuracy < 100, 'diacritic slip should not be a perfect score');
});
test('TC-REC-16 plain text without tashkeel (speech-to-text) is not punished', () => {
  const r = run(BQ2, plain(BQ2)); log('TC-REC-16', r); assert.ok(r.accuracy >= 95, 'got ' + r.accuracy);
});
test('TC-REC-17 stopping mid-ayah gives a partial score, not success', () => {
  const w = words(BQ2); const r = run(BQ2, w.slice(0, 3).join(' ')); log('TC-REC-17', r);
  assert.ok(r.accuracy < 70, 'got ' + r.accuracy);
});
test('TC-REC-18 reading a different ayah scores low', () => {
  const r = run(BQ2, plain(ayah(112, 1))); log('TC-REC-18', r); assert.ok(r.accuracy < 30, 'got ' + r.accuracy);
});
test('TC-REC-19 two consecutive ayahs read together match the two-ayah reference', () => {
  const exp = ayah(2, 2) + ' ' + ayah(2, 3); const r = run(exp, plain(exp)); log('TC-REC-19', r);
  assert.ok(r.accuracy >= 95, 'got ' + r.accuracy);
});
test('TC-REC-20 accepted spelling variants (alif wasla / hamza forms) are not errors', () => {
  const r = run(ayah(1, 2), 'الحمد لله رب العالمين'); log('TC-REC-20', r);
  assert.ok(r.accuracy >= 95, 'standard spelling of «العالمين» vs Uthmani «ٱلْعَٰلَمِينَ» got ' + r.accuracy);
});
test('TC-REC-21 accuracy is always within 0..100 and never NaN', () => {
  for (const spk of ['', '   ', 'x', plain(BQ2).repeat(5)]) {
    const r = run(BQ2, spk); assert.ok(Number.isFinite(r.accuracy) && r.accuracy >= 0 && r.accuracy <= 100, JSON.stringify(spk.slice(0, 10)) + ' -> ' + r.accuracy);
  }
});
test('TC-REC-22 Quran reference text is untouched (al-Fatiha matches the bundled Uthmani source)', () => {
  const t = Q.quranSurahReference(1).ayahs.map(a => a.text);
  assert.equal(t.length, 7); assert.equal(t[0].normalize('NFC'), 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'.normalize('NFC'));
  const pages = new Set(); let ayahs = 0;
  for (let p = 1; p <= 604; p++) { const a = Q.quranPageReference(p).ayahs; ayahs += a.length; a.forEach(x => pages.add(x.surah?.number ?? x.surahNumber)); }
  assert.equal(ayahs, 6236, 'total ayahs across 604 pages');
});
