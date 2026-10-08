import React, { useMemo, useState } from 'react';
import { FlaskConical, Eye, EyeOff, GitCompare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { REGIONS, MAKHARIJ, LETTERS, getSifat, isEmphatic } from '../../data/tajweedLetters';
import { ArticulationDiagram, resolvePose } from './ArticulationDiagram';

const poseFor = (letter) => resolvePose(MAKHARIJ[letter.makhraj].pose, { emphatic: isEmphatic(letter.char), nasal: letter.nasal });

const chip = (active) => ({
  padding: '6px 12px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
  border: `1px solid ${active ? 'var(--primary)' : 'var(--glass-border)'}`,
  background: active ? 'var(--primary-light)' : 'var(--bg-surface)',
  color: active ? 'var(--primary)' : 'var(--text-secondary)'
});

const panel = { padding: '20px', borderRadius: '22px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' };

/** Admin-only preview of the makharij & sifat module (tongue-position diagram per letter). */
export const TajweedLab = () => {
  const { lang, isRTL } = useLanguage();
  const ar = lang === 'ar';
  const [selected, setSelected] = useState('ق');
  const [previous, setPrevious] = useState(null);
  const [regionFilter, setRegionFilter] = useState('all');
  const [showLabels, setShowLabels] = useState(true);
  const [compare, setCompare] = useState(false);

  const letter = LETTERS.find(l => l.char === selected);
  const makhraj = MAKHARIJ[letter.makhraj];
  const pose = useMemo(() => poseFor(letter), [letter]);
  const prevLetter = previous && LETTERS.find(l => l.char === previous);
  const ghostPose = compare && prevLetter ? poseFor(prevLetter) : null;
  const sifat = getSifat(letter.char);
  const sameMakhraj = LETTERS.filter(l => l.makhraj === letter.makhraj && l.char !== letter.char);
  const visibleLetters = LETTERS.filter(l => regionFilter === 'all' || MAKHARIJ[l.makhraj].region === regionFilter);
  const regionName = REGIONS.find(r => r.id === makhraj.region);

  const pick = (char) => {
    if (char === selected) return;
    setPrevious(selected);
    setSelected(char);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ ...panel, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FlaskConical size={22} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {ar ? 'مختبر مخارج الحروف وصفاتها' : 'Makharij & Sifat Lab'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {ar
              ? 'معاينة تجريبية للمشرف فقط. الرسم تعليمي تقريبي لمقطع جانبي للفم والحلق، والمحتوى بانتظار مراجعة معلم تجويد مُجاز قبل إتاحته للطلاب.'
              : 'Admin-only preview. The side-view diagram is an approximate teaching aid; content awaits review by a certified tajweed teacher before students see it.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Diagram */}
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div dir="ltr">
            <ArticulationDiagram
              pose={pose}
              ghostPose={ghostPose}
              region={makhraj.region}
              showLabels={showLabels}
              lang={lang}
              ariaLabel={`${letter.name}: ${makhraj.ar}`}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" style={chip(showLabels)} onClick={() => setShowLabels(v => !v)} aria-pressed={showLabels}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}{ar ? 'أسماء الأجزاء' : 'Labels'}
              </span>
            </button>
            <button type="button" style={chip(compare)} onClick={() => setCompare(v => !v)} aria-pressed={compare} disabled={!prevLetter}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: prevLetter ? 1 : 0.5 }}>
                <GitCompare size={14} />
                {ar ? `قارن مع ${prevLetter ? prevLetter.char : 'الحرف السابق'}` : `Compare with ${prevLetter ? prevLetter.char : 'previous'}`}
              </span>
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {ar
              ? 'النقطة النابضة = موضع المخرج · الخط المتقطع الأزرق = مجرى الهواء (من الفم أو من الأنف)'
              : 'Pulsing dot = point of articulation · blue dashed line = airflow (oral or nasal)'}
          </div>
        </div>

        {/* Letter details */}
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontFamily: 'var(--font-quran)', fontSize: letter.isFeature ? '34px' : '56px', lineHeight: 1, color: 'var(--primary)', minWidth: '64px', textAlign: 'center' }}>
              {letter.char}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{letter.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {regionName ? (ar ? regionName.ar : regionName.en) : ''} · {ar ? makhraj.ar : makhraj.en}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {ar ? 'كيف تضع لسانك؟' : 'How to place the tongue'}
            </div>
            <ol style={{ margin: 0, paddingInlineStart: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }} dir="rtl">
              {makhraj.steps.map(step => <li key={step}>{step}</li>)}
            </ol>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', fontSize: '13px', color: 'var(--text-primary)' }} dir="rtl">
            {letter.isFeature ? 'تدرّب: ' : 'لمعرفة مخرج الحرف انطقه ساكنًا بعد همزة مفتوحة: '}
            <strong style={{ fontFamily: 'var(--font-quran)', fontSize: '20px', color: 'var(--primary)' }}>{letter.practice}</strong>
          </div>

          {(sifat.pairs.length > 0 || sifat.single.length > 0) && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>{ar ? 'الصفات' : 'Sifat'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }} dir="rtl">
                {sifat.pairs.map(p => (
                  <span
                    key={p.ar}
                    title={`ضدها: ${p.opposite}`}
                    style={{
                      padding: '5px 10px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700,
                      background: p.strong === true ? 'rgba(220, 38, 38, 0.1)' : p.strong === false ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-surface-elevated)',
                      color: p.strong === true ? '#dc2626' : p.strong === false ? 'var(--accent)' : 'var(--text-secondary)'
                    }}
                  >
                    {p.ar}
                  </span>
                ))}
                {sifat.single.map(s => (
                  <span key={s.id} style={{ padding: '5px 10px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                    {s.ar}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }} dir="rtl">
                أحمر = صفة قوية · أزرق = صفة ضعيفة · أخضر = صفة لا ضد لها
              </div>
            </div>
          )}

          {(sameMakhraj.length > 0 || letter.confused?.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} dir="rtl">
              {sameMakhraj.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span>من نفس المخرج:</span>
                  {sameMakhraj.map(l => <button key={l.char} type="button" style={chip(false)} onClick={() => pick(l.char)}>{l.char}</button>)}
                </div>
              )}
              {letter.confused?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span>يُخلط عادةً مع:</span>
                  {letter.confused.map(c => (
                    <button key={c} type="button" style={chip(false)} onClick={() => { pick(c); setCompare(true); }}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Letter picker */}
      <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button type="button" style={chip(regionFilter === 'all')} onClick={() => setRegionFilter('all')}>{ar ? 'الكل' : 'All'}</button>
          {REGIONS.map(r => (
            <button key={r.id} type="button" style={chip(regionFilter === r.id)} onClick={() => setRegionFilter(r.id)}>{ar ? r.ar : r.en}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: '8px' }} dir="rtl">
          {visibleLetters.map(l => {
            const active = l.char === selected;
            return (
              <button
                key={l.char}
                type="button"
                onClick={() => pick(l.char)}
                aria-pressed={active}
                aria-label={l.name}
                style={{
                  height: '52px', borderRadius: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-quran)', fontSize: l.isFeature ? '15px' : '24px',
                  border: `1.5px solid ${active ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: active ? 'var(--primary)' : 'var(--bg-color)',
                  color: active ? '#fff' : isEmphatic(l.char) ? '#dc2626' : 'var(--text-primary)'
                }}
              >
                {l.char}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} dir="rtl">الحروف الحمراء حروف استعلاء (مفخّمة): خُصَّ ضَغْطٍ قِظْ</div>
      </div>
    </div>
  );
};

export default TajweedLab;
