import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from './ui/Card';
import { useLanguage } from '../context/LanguageContext';

export const VisualProgressTracker = ({ analytics }) => {
  const { lang } = useLanguage();
  const ar = lang !== 'en';
  if (!analytics) return null;
  const dailyPractice = analytics.practice.dailyPractice || [];
  const maximum = Math.max(1, ...dailyPractice.map(day => day.attempts));
  return <Card data-testid="real-progress-tracker" style={{ padding: 22 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={20} color="var(--primary)" /><h3 style={{ margin: 0 }}>{ar ? 'محاولات التدريب خلال آخر 7 أيام' : 'Practice attempts, last 7 days'}</h3></div>
    <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{ar ? 'عدد الجلسات المحفوظة لكل يوم بتوقيت عمّان؛ لا تُعرض كصفحات حفظ معتمدة.' : 'Saved sessions per day (Amman time); not shown as approved pages.'}</p>
    {dailyPractice.every(day => day.attempts === 0) ? <div data-testid="analytics-empty-chart" style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>{ar ? 'لا توجد محاولات تدريب في هذه المدة.' : 'No practice attempts in this period.'}</div> :
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, minHeight: 190, alignItems: 'end' }}>
        {dailyPractice.map(day => <div key={day.date} style={{ textAlign: 'center' }}>
          <div title={ar ? `${day.attempts} محاولة` : `${day.attempts} attempts`} style={{ height: `${Math.max(8, day.attempts / maximum * 130)}px`, background: 'var(--primary)', borderRadius: '8px 8px 2px 2px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 5, color: 'white', fontWeight: 700 }}>{day.attempts}</div>
          <small style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{day.date.slice(5)}</small>
        </div>)}
      </div>}
    <div style={{ marginTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
      <span>{ar ? <>المصرّح بها: {analytics.declaredProgress.totalAyahs} آية</> : <>Self-logged: {analytics.declaredProgress.totalAyahs} ayahs</>}</span>
      <span>{ar ? 'محاولات التدريب الكلية: ' : 'Total practice attempts: '}{analytics.practice.totalAttempts}</span>
      <span>{ar ? 'مراجعات المعلم: ' : 'Teacher reviews: '}{analytics.teacherReviews.approved + analytics.teacherReviews.rejected}</span>
    </div>
  </Card>;
};
