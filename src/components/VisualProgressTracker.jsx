import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from './ui/Card';

export const VisualProgressTracker = ({ analytics }) => {
  if (!analytics) return null;
  const dailyPractice = analytics.practice.dailyPractice || [];
  const maximum = Math.max(1, ...dailyPractice.map(day => day.attempts));
  return <Card data-testid="real-progress-tracker" style={{ padding: 22 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={20} color="var(--primary)" /><h3 style={{ margin: 0 }}>محاولات التدريب خلال آخر 7 أيام</h3></div>
    <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>عدد الجلسات المحفوظة لكل يوم بتوقيت عمّان؛ لا تُعرض كصفحات حفظ معتمدة.</p>
    {dailyPractice.every(day => day.attempts === 0) ? <div data-testid="analytics-empty-chart" style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد محاولات تدريب في هذه المدة.</div> :
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, minHeight: 190, alignItems: 'end' }}>
        {dailyPractice.map(day => <div key={day.date} style={{ textAlign: 'center' }}>
          <div title={`${day.attempts} محاولة`} style={{ height: `${Math.max(8, day.attempts / maximum * 130)}px`, background: 'var(--primary)', borderRadius: '8px 8px 2px 2px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 5, color: 'white', fontWeight: 700 }}>{day.attempts}</div>
          <small style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{day.date.slice(5)}</small>
        </div>)}
      </div>}
    <div style={{ marginTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
      <span>المصرّح بها: {analytics.declaredProgress.totalAyahs} آية</span>
      <span>محاولات التدريب الكلية: {analytics.practice.totalAttempts}</span>
      <span>مراجعات المعلم: {analytics.teacherReviews.approved + analytics.teacherReviews.rejected}</span>
    </div>
  </Card>;
};
