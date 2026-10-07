import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingScreens = () => {
  const { isRTL } = useLanguage();
  const [activeId, setActiveId] = useState('recitation');

  const screens = [
    { id: 'recitation', image: '/voice_recitation_preview.png', label: isRTL ? 'التسميع' : 'Recitation', caption: isRTL ? 'سمّع الآيات وشاهد مواضع الخطأ ملوّنة.' : 'Recite and see your mistakes highlighted.' },
    { id: 'map', image: '/quran_map_preview.png', label: isRTL ? 'خريطة المصحف' : 'Quran map', caption: isRTL ? 'صفحات المصحف الـ٦٠٤ في خريطة واحدة تبيّن ما حفظت.' : 'All 604 pages in one map of what you have memorized.' },
    { id: 'mindmaps', image: '/mind_maps_preview.png', label: isRTL ? 'الخرائط الذهنية' : 'Mind maps', caption: isRTL ? 'مقاصد كل سورة ومحاورها لتفهم ما تحفظ.' : 'The themes of every surah, to understand what you memorize.' },
    { id: 'fortresses', image: '/five_fortresses_preview.png', label: isRTL ? 'الحصون الخمسة' : 'Five Fortresses', caption: isRTL ? 'خطة يومك وعلامات إنجاز كل حصن.' : 'Your daily plan and progress for each fortress.' },
    { id: 'teacher', image: '/admin_analytics_preview.png', label: isRTL ? 'لوحة المعلمة' : 'Teacher view', caption: isRTL ? 'متابعة الطالبات والحلقات وجلسات التسميع.' : 'Follow students, circles and recitation sessions.' }
  ];
  const active = screens.find(screen => screen.id === activeId) || screens[0];

  return (
    <section id="screens" className="lp-section" style={{ paddingTop: 0 }}>
      <div className="container">
        <h2 className="lp-heading">{isRTL ? 'جولة في المنصة' : 'A look inside'}</h2>
        <div className="lp-tabs" role="tablist" aria-label={isRTL ? 'صور من المنصة' : 'Platform screenshots'}>
          {screens.map(screen => (
            <button
              key={screen.id}
              type="button"
              role="tab"
              id={`lp-tab-${screen.id}`}
              aria-selected={screen.id === active.id}
              aria-controls="lp-screen-panel"
              className="lp-tab"
              onClick={() => setActiveId(screen.id)}
            >
              {screen.label}
            </button>
          ))}
        </div>
        <figure id="lp-screen-panel" role="tabpanel" aria-labelledby={`lp-tab-${active.id}`} className="lp-screen">
          <img src={active.image} alt={active.caption} loading="lazy" />
          <figcaption>{active.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
};
