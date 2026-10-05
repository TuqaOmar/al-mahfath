import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTeacherRefresh } from '../../hooks/useTeacherRefresh';
import { fetchWithAuth } from '../../lib/api';

export const TeacherReportsView = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const requestVersion = useRef(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setReport(null); setError('');
    if (!user?.uid) return;
    try {
      const response = await fetchWithAuth(`/api/teacher/${encodeURIComponent(user.uid)}/reports`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      if (version === requestVersion.current) setReport(data.report);
    } catch { if (version === requestVersion.current) { setReport(null); setError(lang === 'en' ? 'Could not load the report.' : 'تعذر تحميل التقرير الحقيقي.'); } }
  }, [user?.uid, lang]);
  useTeacherRefresh(load);
  useEffect(() => () => { requestVersion.current += 1; }, []);
  const totals = report?.totals;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
    <div><h2>{lang === 'en' ? 'Teacher reports' : 'تقارير المعلم'}</h2><p style={{ color: 'var(--text-secondary)' }}>{lang === 'en' ? 'Live Firestore data for your assigned students.' : 'بيانات Firestore الفعلية للطلاب المعيّنين لك.'}</p></div>
    <button data-testid="teacher-report-refresh" onClick={load}>تحديث التقرير</button>
    {error && <div role="alert">{error} <button onClick={load}><RefreshCw size={14}/> إعادة المحاولة</button></div>}
    {totals && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
        {[['report-students','الطلاب',totals.students],['report-attempts','جلسات التدريب',totals.attempts],['report-pending','بانتظار المراجعة',totals.pending],['report-approved','تدريب مقبول بالمراجعة',totals.approved],['report-rejected','مرفوضة',totals.rejected],['report-notes','ملاحظات المعلم',totals.notes]].map(([id,label,value]) => <div key={id} style={{ padding:'16px',background:'var(--bg-surface)',border:'1px solid var(--glass-border)',borderRadius:'14px' }}><span>{label}</span><strong data-testid={id} style={{display:'block',fontSize:'24px'}}>{value}</strong></div>)}
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>{report.students.map(student => <div key={student.uid} data-testid={`report-student-${student.uid}`} style={{padding:'14px',background:'var(--bg-surface)',borderRadius:'12px'}}><strong>{student.name || student.uid}</strong><span style={{display:'block',color:'var(--text-secondary)'}}>محاولات: {student.attempts} • معلقة: {student.pending} • تدريب مقبول: {student.approved} • مرفوضة: {student.rejected} • ملاحظات: {student.notes} • متوسط التطابق: {student.attempts ? `${student.averageAccuracy}%` : '—'}</span></div>)}</div>
    </>}
  </div>;
};
