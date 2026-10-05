import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const defaultUiConfiguration = Object.freeze({
  sections: {
    community: { visible: true, order: 40 },
    achievements: { visible: true, order: 50 }
  },
  badges: [
    { id: 'streak_7', visible: true, order: 10, title: 'رباط الاستمرار', description: 'صحبة متتالية لكتاب الله لـ 7 أيام أو أكثر' },
    { id: 'baqarah', visible: true, order: 20, title: 'حافظ البقرة', description: 'حفظ سورة البقرة بالكامل (أكثر من 48 صفحة)' },
    { id: 'xp_500', visible: true, order: 30, title: 'المستمع الحاضر', description: 'الحصول على خبرة تراكمية تزيد عن 500 XP' },
    { id: 'fortresses_3', visible: true, order: 40, title: 'فارس الحصون', description: 'الالتزام بإنجاز 3 حصون يومية أو أكثر اليوم' },
    { id: 'stability_95', visible: true, order: 50, title: 'المتدبر الخاشع', description: 'حفظ أكثر من 10 صفحات بدرجة استقرار تزيد عن 95%' },
    { id: 'level_5', visible: true, order: 60, title: 'أهل القرآن', description: 'بلوغ المستوى الخامس في رحلة تدبر القرآن' }
  ]
});

const normalize = data => ({
  sections: {
    community: { ...defaultUiConfiguration.sections.community, ...data?.sections?.community },
    achievements: { ...defaultUiConfiguration.sections.achievements, ...data?.sections?.achievements }
  },
  badges: defaultUiConfiguration.badges.map(fallback => ({
    ...fallback,
    ...(Array.isArray(data?.badges) ? data.badges.find(item => item.id === fallback.id) : null)
  }))
});

export function useUiConfiguration() {
  const [configuration, setConfiguration] = useState(defaultUiConfiguration);
  const [loading, setLoading] = useState(true);
  useEffect(() => onSnapshot(doc(db, 'app_config', 'navigation'), snapshot => {
    setConfiguration(normalize(snapshot.exists() ? snapshot.data() : null));
    setLoading(false);
  }, error => {
    console.error('Failed to read UI configuration:', error);
    setConfiguration(defaultUiConfiguration);
    setLoading(false);
  }), []);
  return { configuration, loading };
}

export async function saveUiConfiguration(configuration) {
  const normalized = normalize(configuration);
  await setDoc(doc(db, 'app_config', 'navigation'), {
    ...normalized,
    updatedAt: new Date().toISOString()
  });
  return normalized;
}
