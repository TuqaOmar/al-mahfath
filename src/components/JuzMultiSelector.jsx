import React from 'react';
import { Check, Sparkles, Layers, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const JUZ_NAMES_AR = [
  'الجزء 1 (آلم - البقرة)',
  'الجزء 2 (سيقول - البقرة)',
  'الجزء 3 (تلك الرسل - البقرة/آل عمران)',
  'الجزء 4 (لن تنالوا - آل عمران/النساء)',
  'الجزء 5 ( والمحصنات - النساء)',
  'الجزء 6 (لا يحب الله - النساء/المائدة)',
  'الجزء 7 (وإذا سمعوا - المائدة/الأنعام)',
  'الجزء 8 (ولو أننا - الأنعام/الأعراف)',
  'الجزء 9 (قال الملأ - الأعراف/الأنفال)',
  'الجزء 10 (واعلموا - الأنفال/التوبة)',
  'الجزء 11 (يعتذرون - التوبة/يونس/هود)',
  'الجزء 12 (وما من دابة - هود/يوسف)',
  'الجزء 13 (وما أبرئ - يوسف/الرعد/إبراهيم)',
  'الجزء 14 (ربما - الحجر/النحل)',
  'الجزء 15 (سبحان الذي - الإسراء/الكهف)',
  'الجزء 16 (قال ألم - الكهف/مريم/طه)',
  'الجزء 17 (اقترب للناس - الأنبياء/الحج)',
  'الجزء 18 (قد أفلح - المؤمنون/النور/الفرقان)',
  'الجزء 19 (وقال الذين - الفرقان/الشعراء/النمل)',
  'الجزء 20 (أمن خلق - النمل/القصص/العنكبوت)',
  'الجزء 21 (اتل ما أوحي - العنكبوت إلى الأحزاب)',
  'الجزء 22 (ومن يقنت - الأحزاب إلى يس)',
  'الجزء 23 (وما أنزلنا - يس إلى الزمر)',
  'الجزء 24 (فمن أظلم - الزمر إلى الفصلت)',
  'الجزء 25 (إليه يرد - فصلت إلى الجاثية)',
  'الجزء 26 (حم - الأحقاف إلى ق)',
  'الجزء 27 (قال فما خطبكم - الذاريات إلى الحديد)',
  'الجزء 28 (قد سمع الله - المجادلة إلى التحريم)',
  'الجزء 29 (تبارك الذي - الملك إلى المرسلات)',
  'الجزء 30 (عم يتساءلون - النبأ إلى الناس)'
];

export const JuzMultiSelector = ({ selectedJuzs = [1, 30], onChange }) => {
  const { lang, isRTL } = useLanguage();

  // Normalize selectedJuzs into array of numbers
  const currentArray = Array.isArray(selectedJuzs) 
    ? selectedJuzs 
    : (typeof selectedJuzs === 'string' && selectedJuzs.includes(','))
      ? selectedJuzs.split(',').map(n => parseInt(n.trim())).filter(Boolean)
      : [1, 30];

  const handleToggle = (juzNumber) => {
    let next;
    if (currentArray.includes(juzNumber)) {
      next = currentArray.filter(j => j !== juzNumber);
    } else {
      next = [...currentArray, juzNumber].sort((a, b) => a - b);
    }
    onChange(next);
  };

  const selectAll = () => {
    const all = Array.from({ length: 30 }, (_, i) => i + 1);
    onChange(all);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectPreset = (presetArray) => {
    onChange(presetArray);
  };

  const totalPages = currentArray.length * 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Quick Presets & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
            {lang === 'ar' ? 'اختيارات سريعة:' : 'Quick Presets:'}
          </span>
          <button
            type="button"
            onClick={() => selectPreset([30])}
            style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            {lang === 'ar' ? 'جزء عمّ (30)' : 'Juz 30'}
          </button>
          <button
            type="button"
            onClick={() => selectPreset([29, 30])}
            style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            {lang === 'ar' ? 'عمّ وتبارك (29، 30)' : 'Juz 29 & 30'}
          </button>
          <button
            type="button"
            onClick={() => selectPreset([1, 2, 3, 4, 5])}
            style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            {lang === 'ar' ? 'أول 5 أجزاء (1 - 5)' : 'First 5 Juzs'}
          </button>
          <button
            type="button"
            onClick={() => selectPreset([1, 30])}
            style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid var(--primary)', background: 'var(--primary-light)', fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {lang === 'ar' ? 'الجزء 1 والجزء 30 🌟' : 'Juz 1 & 30'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={selectAll}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {lang === 'ar' ? 'تحديد الكل (30)' : 'Select All'}
          </button>
          <span style={{ color: 'var(--glass-border)' }}>|</span>
          <button
            type="button"
            onClick={clearAll}
            style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {lang === 'ar' ? 'إلغاء تحديد الكل' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* Selected Summary Badge */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.08))',
        border: '1px solid var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {lang === 'ar' 
              ? `المحفوظ المحدد: ${currentArray.length} أجزاء (${currentArray.length === 0 ? 'لا يوجد أجزاء مسبقة' : currentArray.map(n => `جزء ${n}`).join('، ')})`
              : `Selected: ${currentArray.length} Juzs (${currentArray.map(n => `Juz ${n}`).join(', ')})`
            }
          </span>
        </div>
        <span style={{ fontSize: '12px', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)', color: 'var(--primary)', fontWeight: 'bold' }}>
          {lang === 'ar' ? `~ ${totalPages} صفحة` : `~ ${totalPages} pages`}
        </span>
      </div>

      {/* 30 Juz Grid Interactive Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '10px',
        maxHeight: '260px',
        overflowY: 'auto',
        padding: '4px',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)',
        background: 'var(--bg-color)'
      }}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
          const isSelected = currentArray.includes(juzNum);
          const label = JUZ_NAMES_AR[juzNum - 1];

          return (
            <div
              key={juzNum}
              onClick={() => handleToggle(juzNum)}
              style={{
                padding: '10px 8px',
                borderRadius: '12px',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)'
                }}>
                  {lang === 'ar' ? `الجزء ${juzNum}` : `Juz ${juzNum}`}
                </span>
                {isSelected && <Check size={14} color="var(--primary)" />}
              </div>

              <span style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }} title={label}>
                {label.split('(')[1]?.replace(')', '') || ''}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
