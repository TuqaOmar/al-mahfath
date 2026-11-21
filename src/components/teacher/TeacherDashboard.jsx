import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, AlertTriangle, Layers, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTeacherRefresh } from '../../hooks/useTeacherRefresh';
import { fetchWithAuth } from '../../lib/api';

const Card = ({ testId, label, value, detail }) => <div style={{ padding: 18, borderRadius: 18, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
  <div data-testid={testId} style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
  <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-secondary)' }}>{detail}</div>
</div>;

export const TeacherDashboard = ({ onOpenStudentProfile, onViewAllStudents, onViewGroups }) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setData(null); setError('');
    try {
      if (!user?.uid) return;
      const response = await fetchWithAuth('/api/teacher/' + encodeURIComponent(user.uid) + '/dashboard');
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'تعذر تحميل لوحة المعلم');
      if (version === requestVersion.current) setData(body);
    } catch (error) { if (version === requestVersion.current) { setData(null); setError(error.message); } }
  }, [user?.uid]);
  useTeacherRefresh(load);
  useEffect(() => () => { requestVersion.current += 1; }, []);

  if (error) return <div data-testid="teacher-dashboard-error">{error}</div>;
  if (!data) return <div data-testid="teacher-dashboard-loading">جارٍ تحميل بيانات الحلقات…</div>;
  const { stats, groups = [], studentsWhoNeedAttention = [], recentActivities = [] } = data;
  const groupSummary = groups.length ? groups.map(group => `${group.name}: ${group.studentsCount ?? group.membersCount ?? 0}`).join('، ') : 'لا توجد حلقات معيّنة';
  return <div data-testid="teacher-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
    <section style={{ padding: 24, borderRadius: 22, background: 'linear-gradient(135deg,#064E3B,#047857)', color: 'white' }}>
      <h1 style={{ margin: 0 }}>{lang === 'ar' ? `مرحبًا ${user?.name || 'بالمعلم'}` : `Welcome, ${user?.name || 'teacher'}`}</h1>
      <p>البيانات التالية تخص العضويات النشطة في حلقاتك فقط.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button data-testid="teacher-students-button" onClick={() => onViewAllStudents?.('all')} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>سجل طلابي ({stats.studentsCount})</button>
        <button data-testid="teacher-groups-button" onClick={() => onViewGroups?.()} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>حلقاتي ({stats.groupsCount})</button>
        <button data-testid="teacher-dashboard-refresh" onClick={load} style={{ ...{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }, background: 'transparent' }}>تحديث لوحة المعلم</button>
      </div>
    </section>
    <div data-testid="teacher-group-summary" style={{ padding: 14, borderRadius: 14, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}><Layers size={16} /> {groupSummary}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
      <Card testId="teacher-students-count" label="الطلاب النشطون" value={stats.studentsCount} detail="الطلاب المسجّلون حاليًا في حلقاتك." />
      <Card testId="teacher-active-week" label="طلاب تدربوا آخر 7 أيام" value={stats.activeThisWeek} detail="طلاب فريدون لديهم جلسة تدريب محفوظة في آخر 7 أيام." />
      <Card testId="teacher-weekly-commitment" label="نسبة الطلاب النشطين" value={stats.weeklyCommitment == null ? 'غير متاح' : `${stats.weeklyCommitment}%`} detail="نسبة من تدرّب هذا الأسبوع من طلابك؛ تظهر عند وجود طلاب." />
      <Card testId="teacher-practice-sessions" label="محاولات التدريب آخر 7 أيام" value={stats.weeklyPracticeSessions} detail="عدد الجلسات التدريبية، ولا تمثل حفظًا معتمدًا." />
      <Card testId="teacher-pending-reviews" label="مراجعات معلقة" value={stats.pendingReviews} detail="جلسات أرسلها طلاب هذا المعلم للمراجعة." />
      <Card testId="teacher-attention-count" label="بحاجة لمتابعة" value={stats.needsAttentionCount} detail="لديهم نشاط سابق لكن لا محاولة خلال آخر 7 أيام." />
    </div>
    <section style={{ padding: 20, borderRadius: 18, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
      <h3><AlertTriangle size={18} /> المتابعة</h3>
      {!studentsWhoNeedAttention.length ? <p data-testid="teacher-attention-empty">لا توجد حالات تستند إلى بيانات كافية.</p> :
        studentsWhoNeedAttention.map(student => <button key={student.uid} onClick={() => onOpenStudentProfile?.(student.uid)} style={{ display: 'block', width: '100%', margin: '8px 0', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', textAlign: 'start', cursor: 'pointer' }}><strong>{student.name}</strong>: {student.attentionReason}</button>)}
    </section>
    <section style={{ padding: 20, borderRadius: 18, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
      <h3><Activity size={18} /> أحدث محاولات التدريب</h3>
      {!recentActivities.length ? <p data-testid="teacher-activity-empty">لا توجد محاولات تدريب خلال آخر 7 أيام.</p> :
        recentActivities.map(item => <div key={item.id} style={{ padding: 10, borderBottom: '1px solid var(--glass-border)' }}><Users size={14} /> <strong>{item.studentName}</strong> — {item.action} <small>{item.time}</small></div>)}
    </section>
  </div>;
};
