import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, Clock, Flame, Target } from 'lucide-react';
import { fetchWithAuth } from '../lib/api';
import { Card } from './ui/Card';
import { VisualProgressTracker } from './VisualProgressTracker';

const Metric = ({ testId, icon: Icon, label, value, detail }) => (
  <Card style={{ padding: '18px' }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}><Icon size={18} /><strong>{label}</strong></div>
    <div data-testid={testId} style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{detail}</div>
  </Card>
);

export const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    fetchWithAuth('/api/student/analytics').then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'تعذر تحميل التحليلات');
      if (alive) setAnalytics(data.analytics);
    }).catch(err => alive && setError(err.message));
    return () => { alive = false; };
  }, []);

  if (error) return <Card style={{ padding: 24, color: '#DC2626' }} data-testid="student-analytics-error">{error}</Card>;
  if (!analytics) return <Card style={{ padding: 24 }} data-testid="student-analytics-loading">جارٍ تحميل بياناتك الفعلية…</Card>;
  const { declaredProgress, practice, teacherReviews, profile } = analytics;
  return <div data-testid="student-analytics" style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1100, margin: '0 auto' }}>
    <div>
      <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>تحليلات الطالب</h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>بيانات Firestore الخاصة بالحساب الحالي. تقدم الآيات المصرّح به، ومحاولات التدريب، ومراجعات المعلم مقاييس مستقلة.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
      <Metric testId="analytics-declared-ayahs" icon={BookOpen} label="آيات مسجلة ذاتيًا" value={declaredProgress.totalAyahs} detail="كل سجلات ayah_progress؛ ليست حفظًا معتمدًا من المعلم." />
      <Metric testId="analytics-practice-week" icon={Activity} label="محاولات آخر 7 أيام" value={practice.attemptsLast7Days} detail="محاولات تدريب محفوظة خلال سبعة أيام تقويمية بتوقيت عمّان." />
      <Metric testId="analytics-practice-accuracy" icon={Target} label="متوسط دقة التدريب" value={practice.averageAccuracy == null ? 'غير متاح' : `${practice.averageAccuracy}%`} detail="متوسط كل محاولات التدريب ذات الدرجة؛ لا يمثل اعتماد الحفظ." />
      <Metric testId="analytics-approved-pages" icon={CheckCircle2} label="صفحات الحفظ المعتمد" value="غير متاح" detail="لا يوجد مسار مكتمل لاعتماد صفحات الحفظ. تقدم الطالب وقرارات مراجعة التدريب ليست اعتمادًا للحفظ." />
      <Metric testId="analytics-streak" icon={Flame} label="أيام صحبة القرآن" value={profile.streak} detail="أيام متتالية لها نشاط قرآني مؤهل، ويُحسب اليوم مرة واحدة بتوقيت عمّان." />
      <Metric testId="analytics-pending-reviews" icon={Clock} label="بانتظار مراجعة المعلم" value={teacherReviews.pending} detail={`قرارات مراجعة التدريب: مقبول ${teacherReviews.approved}، مرفوض ${teacherReviews.rejected}. القبول لا يحوّلها إلى حفظ معتمد.`} />
    </div>
    <VisualProgressTracker analytics={analytics} />
  </div>;
};
