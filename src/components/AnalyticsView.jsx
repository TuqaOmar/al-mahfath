import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, Clock, Flame, Target } from 'lucide-react';
import { fetchWithAuth } from '../lib/api';
import { Card } from './ui/Card';
import { VisualProgressTracker } from './VisualProgressTracker';
import { useLanguage } from '../context/LanguageContext';

const Metric = ({ testId, icon: Icon, label, value, detail }) => (
  <Card style={{ padding: '18px' }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}><Icon size={18} /><strong>{label}</strong></div>
    <div data-testid={testId} style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{detail}</div>
  </Card>
);

export const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const { lang } = useLanguage();
  const ar = lang !== 'en';
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    fetchWithAuth('/api/student/analytics').then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر تحميل التحليلات' : 'Could not load analytics'));
      if (alive) setAnalytics(data.analytics);
    }).catch(err => alive && setError(err.message));
    return () => { alive = false; };
  }, []);

  if (error) return <Card style={{ padding: 24, color: '#DC2626' }} data-testid="student-analytics-error">{error}</Card>;
  if (!analytics) return <Card style={{ padding: 24 }} data-testid="student-analytics-loading">{ar ? 'جارٍ تحميل بياناتك الفعلية…' : 'Loading your data…'}</Card>;
  const { declaredProgress, practice, teacherReviews, profile } = analytics;
  return <div data-testid="student-analytics" style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1100, margin: '0 auto' }}>
    <div>
      <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{ar ? 'تحليلات الطالب' : 'Student analytics'}</h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{ar ? 'تقدمك الفعلي: الآيات التي سجّلتها، ومحاولات التدريب، ومراجعات المعلم — كل منها مقياس مستقل.' : 'Your real progress: ayahs you logged, practice attempts and teacher reviews — each is a separate measure.'}</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
      <Metric testId="analytics-declared-ayahs" icon={BookOpen} label={ar ? 'آيات مسجلة ذاتيًا' : 'Self-logged ayahs'} value={declaredProgress.totalAyahs} detail={ar ? 'الآيات التي سجّلت تقدمها بنفسك؛ ليست حفظًا معتمدًا من المعلم.' : 'Ayahs you marked yourself; not teacher-approved memorization.'} />
      <Metric testId="analytics-practice-week" icon={Activity} label={ar ? 'محاولات آخر 7 أيام' : 'Attempts, last 7 days'} value={practice.attemptsLast7Days} detail={ar ? 'محاولات تدريب محفوظة خلال سبعة أيام تقويمية بتوقيت عمّان.' : 'Saved practice attempts over seven calendar days (Amman time).'} />
      <Metric testId="analytics-practice-accuracy" icon={Target} label={ar ? 'متوسط دقة التدريب' : 'Average practice accuracy'} value={practice.averageAccuracy == null ? (ar ? 'غير متاح' : 'N/A') : `${practice.averageAccuracy}%`} detail={ar ? 'متوسط كل محاولات التدريب ذات الدرجة؛ لا يمثل اعتماد الحفظ.' : 'Average of all scored practice attempts; not memorization approval.'} />
      <Metric testId="analytics-approved-pages" icon={CheckCircle2} label={ar ? 'صفحات الحفظ المعتمد' : 'Approved pages'} value={ar ? 'غير متاح' : 'N/A'} detail={ar ? 'لا يوجد مسار مكتمل لاعتماد صفحات الحفظ. تقدم الطالب وقرارات مراجعة التدريب ليست اعتمادًا للحفظ.' : 'There is no page-approval workflow yet. Progress and practice reviews are not memorization approval.'} />
      <Metric testId="analytics-streak" icon={Flame} label={ar ? 'أيام صحبة القرآن' : 'Quran streak (days)'} value={profile.streak} detail={ar ? 'أيام متتالية لها نشاط قرآني مؤهل، ويُحسب اليوم مرة واحدة بتوقيت عمّان.' : 'Consecutive days with Quran activity, counted once per day (Amman time).'} />
      <Metric testId="analytics-pending-reviews" icon={Clock} label={ar ? 'بانتظار مراجعة المعلم' : 'Awaiting teacher review'} value={teacherReviews.pending} detail={ar ? `قرارات مراجعة التدريب: مقبول ${teacherReviews.approved}، مرفوض ${teacherReviews.rejected}. القبول لا يحوّلها إلى حفظ معتمد.` : `Practice review decisions: accepted ${teacherReviews.approved}, rejected ${teacherReviews.rejected}. Acceptance is not memorization approval.`} />
    </div>
    <VisualProgressTracker analytics={analytics} />
  </div>;
};
