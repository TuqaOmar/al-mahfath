import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { surahs, getJuzForPage } from '../utils/quranData';
import { loadMushafPage, prefetchMushafPage, mushafFontFamily } from '../lib/mushafLayout';

const toArabicDigits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const MAX_FONT = 34;

/**
 * One Madinah-mushaf page drawn line for line with the King Fahd page font.
 * Words of the same ayah share a click target and highlight together.
 * Renders `fallback` (the plain-text page) while loading fails, e.g. offline.
 */
export const MushafPage = ({ pageNumber, ayahs, activeAyahNum, isPlaying, recitedAyahs = {}, onAyahClick, fallback }) => {
  const [state, setState] = useState({ page: null, lines: null, error: false });
  const [fontSize, setFontSize] = useState(24);
  const [shortLines, setShortLines] = useState(() => new Set());
  const frameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setState(prev => (prev.page === pageNumber ? prev : { page: pageNumber, lines: null, error: false }));
    loadMushafPage(pageNumber)
      .then(lines => { if (!cancelled) setState({ page: pageNumber, lines, error: false }); })
      .catch(() => { if (!cancelled) setState({ page: pageNumber, lines: null, error: true }); });
    prefetchMushafPage(pageNumber + 1);
    prefetchMushafPage(pageNumber - 1);
    return () => { cancelled = true; };
  }, [pageNumber]);

  const lines = state.page === pageNumber ? state.lines : null;

  // Size the font so the widest line fills the frame, like the printed page.
  useLayoutEffect(() => {
    if (!lines || !frameRef.current) return undefined;
    const canvas = document.createElement('canvas').getContext('2d');
    canvas.font = `100px "${mushafFontFamily(pageNumber)}"`;
    const widths = lines.filter(line => line.type === 'words')
      .map(line => [line.number, line.words.reduce((sum, word) => sum + canvas.measureText(word.code).width, 0)]);
    const widest = Math.max(...widths.map(([, width]) => width));
    // The print centres short lines (a surah's last line) instead of stretching them.
    setShortLines(new Set(widths.filter(([, width]) => width < widest * 0.8).map(([number]) => number)));
    const fit = () => {
      const width = frameRef.current?.clientWidth || 0;
      if (width && widest > 0) setFontSize(Math.min(MAX_FONT, (100 * width) / (widest * 1.06)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [lines, pageNumber]);

  if (state.error && state.page === pageNumber) return fallback;

  const referenceByNumber = new Map((ayahs || []).map(ayah => [ayah.number, ayah]));
  const firstWordSeen = new Set();
  const firstSurah = ayahs?.[0]?.surah?.number;
  const headerSurah = firstSurah ? surahs[firstSurah - 1]?.name : '';

  return (
    <div style={{ maxWidth: '620px', width: '100%', margin: '0 auto' }}>
      <div
        dir="rtl"
        lang="ar"
        style={{
          padding: 'clamp(10px, 3vw, 22px) clamp(10px, 3.5vw, 26px) clamp(8px, 2vw, 14px)',
          borderRadius: '10px',
          background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'inset 0 0 0 5px var(--bg-surface), inset 0 0 0 6px rgba(16, 185, 129, 0.45)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Running header, as printed: surah on one side, juz on the other */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-quran)', fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 6px 8px', borderBottom: '1px solid var(--glass-border)', marginBottom: '6px' }}>
          <span>{headerSurah && `سورة ${headerSurah}`}</span>
          <span>الجزء {toArabicDigits(getJuzForPage(pageNumber))}</span>
        </div>

        <div ref={frameRef} style={{ minHeight: lines ? undefined : '420px', display: 'flex', flexDirection: 'column', justifyContent: lines ? 'flex-start' : 'center' }}>
          {!lines ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>جاري تحميل صفحة المصحف...</div>
          ) : lines.map(line => {
            if (line.type === 'surah') {
              return (
                <div key={line.number} style={{ height: `${fontSize * 1.9}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '100%', height: '78%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid var(--primary)', background: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--primary)', fontFamily: 'var(--font-quran)', fontWeight: 800, fontSize: `${fontSize * 0.72}px`
                  }}>
                    سورة {surahs[line.surahNumber - 1]?.name}
                  </div>
                </div>
              );
            }
            if (line.type === 'basmala') {
              return (
                <div key={line.number} style={{ height: `${fontSize * 1.9}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-quran)', fontSize: `${fontSize * 0.8}px` }}>
                  {BASMALA}
                </div>
              );
            }
            const centered = pageNumber <= 2 || shortLines.has(line.number);
            return (
              <div key={line.number} style={{
                height: `${fontSize * 1.9}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: centered ? 'center' : 'space-between',
                gap: centered ? `${fontSize * 0.2}px` : 0,
                fontFamily: `"${mushafFontFamily(pageNumber)}", var(--font-quran)`,
                fontSize: `${fontSize}px`,
                whiteSpace: 'nowrap'
              }}>
                {line.words.map((word, index) => {
                  const isActive = word.ayahNumber === activeAyahNum;
                  const isFirst = !firstWordSeen.has(word.ayahNumber);
                  firstWordSeen.add(word.ayahNumber);
                  const reference = referenceByNumber.get(word.ayahNumber);
                  // The first word of each ayah carries the reference text for tests and assistive tech.
                  const marker = isFirst && reference
                    ? { 'data-testid': `quran-display-${word.ayahNumber}`, 'data-quran-text': reference.text, 'aria-label': reference.text }
                    : { 'aria-hidden': true };
                  return (
                    <span
                      key={`${line.number}-${index}`}
                      {...marker}
                      dir="rtl"
                      lang="ar"
                      onClick={() => onAyahClick(word.ayahNumber)}
                      style={{
                        cursor: 'pointer',
                        lineHeight: 1,
                        padding: `${fontSize * 0.12}px ${fontSize * 0.04}px`,
                        borderRadius: '4px',
                        background: isActive ? (isPlaying ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.18)') : 'transparent',
                        color: word.isEnd ? 'var(--primary)' : 'inherit',
                        textDecoration: recitedAyahs[word.ayahNumber] && !word.isEnd ? 'underline' : 'none',
                        textDecorationColor: '#10B981',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {word.code}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-quran)', fontSize: '14px', color: 'var(--text-secondary)', paddingTop: '6px', marginTop: '6px', borderTop: '1px solid var(--glass-border)' }}>
          {toArabicDigits(pageNumber)}
        </div>
      </div>
    </div>
  );
};

export default MushafPage;
