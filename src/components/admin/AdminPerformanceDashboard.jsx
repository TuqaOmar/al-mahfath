import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calculator, Clock, Layers, RefreshCw, Target, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchWithAuth } from '../../lib/api';

const recordedNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const panelStyle = {
  padding: '20px', borderRadius: '20px', background: 'var(--bg-surface)',
  border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)'
};

export const AdminPerformanceDashboard = () => {
  const { lang, isRTL } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const [simulatedDailyPages, setSimulatedDailyPages] = useState(0);
  const [simulatedActiveStudents, setSimulatedActiveStudents] = useState(0);
  const [simulatedRemainingPages, setSimulatedRemainingPages] = useState(604);
  const text = (ar, en) => lang === 'ar' ? ar : en;
  const format = value => value === null ? '—' : value.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 });

  const fetchPerformanceData = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(false);
    setData(null);
    try {
      const response = await fetchWithAuth('/api/admin/memorization-performance');
      const result = await response.json();
      if (!response.ok || result.success !== true || !result.stats || !Array.isArray(result.groups) ||
          typeof result.stats.hasAttempts !== 'boolean' ||
          recordedNumber(result.stats.totalRecitationSessions) === null ||
          recordedNumber(result.stats.totalWeeklySessions) === null) {
        throw new Error('Performance report unavailable');
      }
      if (requestId.current === currentRequest) setData(result);
    } catch (failure) {
      console.error('Failed to load performance report:', failure);
      if (requestId.current === currentRequest) setError(true);
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformanceData();
    return () => { requestId.current += 1; };
  }, [fetchPerformanceData]);

  const stats = data?.stats;
  const groups = Array.isArray(data?.groups) ? data.groups : [];
  const metric = key => recordedNumber(stats?.[key]);
  const monthlyHypotheticalPages = simulatedActiveStudents * simulatedDailyPages * 30;
  const hypotheticalMonths = simulatedActiveStudents > 0 && simulatedDailyPages > 0
    ? simulatedRemainingPages / (simulatedDailyPages * 30) : null;
  const monthsPerStudent = hypotheticalMonths !== null && Number.isFinite(hypotheticalMonths) ? hypotheticalMonths : null;
  const cards = [
    { key: 'totalLearners', label: text('عدد المتعلمين المسجلين', 'Registered learners'), icon: Users },
    { key: 'totalStudentsCount', label: text('طلاب المجموعات الحالية', 'Current group learners'), icon: Users },
    { key: 'independentUsersCount', label: text('المتعلمون المستقلون', 'Independent learners'), icon: Users },
    { key: 'teachersCount', label: text('المعلمون المسجلون', 'Registered teachers'), icon: Users },
    { key: 'totalRecitationSessions', label: text('إجمالي جلسات التسميع المسجلة', 'All recorded recitation sessions'), icon: Clock },
    { key: 'totalWeeklySessions', label: text('الجلسات في آخر 7 أيام', 'Sessions in the last 7 days'), icon: Clock },
    { key: 'averageAccuracy', label: text('متوسط مطابقة النص', 'Average text match'), icon: Target, suffix: '%', requiresAttempts: true },
    { key: 'groupsCount', label: text('عدد المجموعات المسجلة', 'Registered groups'), icon: Layers },
    { key: 'totalRecordedAyahs', label: text('سجلات تقدم الآيات', 'Recorded ayah progress'), icon: Target },
    { key: 'learnersWithRecordedProgress', label: text('متعلمين لديهم تقدم آيات', 'Learners with ayah progress'), icon: Users }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {text('تقرير التدريب والجلسات المسجلة', 'Recorded practice and sessions report')}
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {text('مؤشرات من السجلات المحفوظة؛ تُحدّث عند تحميل التقرير.', 'Metrics from saved records, refreshed when the report is loaded.')}
          </p>
        </div>
        <button
          onClick={fetchPerformanceData}
          disabled={loading}
          style={{ padding: '9px 16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: loading ? 'wait' : 'pointer' }}
        >
          <RefreshCw size={15} />
          {text('تحديث التقرير', 'Refresh report')}
        </button>
      </div>

      {loading && <div role="status" style={panelStyle}>{text('جارٍ تحميل التقرير من السجلات…', 'Loading the report from saved records…')}</div>}
      {!loading && error && (
        <div role="alert" style={panelStyle}>
          <p style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>
            {text('تعذر تحميل التقرير. أعد المحاولة لاسترجاع البيانات المحفوظة.', 'The report could not be loaded. Retry to retrieve saved data.')}
          </p>
          <button onClick={fetchPerformanceData} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {text('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {cards.map(({ key, label, icon: Icon, suffix, requiresAttempts }) => {
              const value = requiresAttempts && stats.hasAttempts !== true ? null : metric(key);
              return (
                <div key={key} style={panelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <span>{label}</span><Icon size={18} />
                  </div>
                  <div data-testid={`performance-${key}`} style={{ marginTop: '12px', fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {format(value)}{value !== null ? suffix : ''}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ margin: 0, padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
            {text(
              'دقة النص تقيس مطابقة النص المرسل بالنص المرجعي. المرجع غير موثق، وهذه النتيجة لا تعتمد الحفظ أو جودة التجويد. العدد الكلي يشمل جميع الجلسات المسجلة، وعدد آخر 7 أيام يستخدم نافذة متحركة. لا تُعرض نسبة دقة قبل وجود محاولة.',
              'Text accuracy compares submitted text with a reference text. The reference is unverified; this score does not certify memorization or tajweed. The total includes all saved sessions; the last 7 days use a rolling window. Accuracy is unavailable until an attempt is recorded.'
            )}
          </p>

          <div style={panelStyle}>
            <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: 'var(--text-primary)' }}>
              {text('سجلات المجموعات', 'Group records')}
            </h3>
            <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.7 }}>
              {text('تُنسب محاولات الطالب إلى مجموعته الحالية، بما فيها المحاولات السابقة للنقل.', 'Learner attempts are attributed to their current group, including attempts recorded before a transfer.')}
            </p>
            {groups.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                {text('لا توجد مجموعات في التقرير.', 'There are no groups in this report.')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groups.map(group => (
                  <div key={group.id} style={{ padding: '12px 14px', borderRadius: '14px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{group.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {text('طلاب المجموعة: ', 'Group learners: ')}{format(recordedNumber(group.membersCount))}
                      </div>
                    </div>
                    <div style={{ textAlign: isRTL ? 'left' : 'right', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.8 }}>
                      <div>{text('كل الجلسات: ', 'All sessions: ')}{format(recordedNumber(group.totalRecitationSessions))}</div>
                      <div>{text('آخر 7 أيام: ', 'Last 7 days: ')}{format(recordedNumber(group.totalWeeklySessions))}</div>
                      <div>{text('متوسط مطابقة النص: ', 'Average text match: ')}{format(group.hasAttempts === true ? recordedNumber(group.averageAccuracy) : null)}{group.hasAttempts === true && recordedNumber(group.averageAccuracy) !== null ? '%' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>{text('محاكاة افتراضية مستقلة', 'Separate hypothetical calculator')}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {text('غيّر الافتراضات لحساب الصفحات والمدة عند الالتزام بـ30 يومًا شهريًا؛ هذه الأرقام من مدخلات المحاكاة.', 'Change assumptions to calculate pages and time at 30 study days per month; these figures come from the calculator inputs.')}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[
                { label: text('عدد الطلاب الافتراضي', 'Hypothetical learners'), value: simulatedActiveStudents, set: setSimulatedActiveStudents, step: '1' },
                { label: text('صفحات يومية لكل طالب', 'Daily pages per learner'), value: simulatedDailyPages, set: setSimulatedDailyPages, step: '0.5' },
                { label: text('صفحات متبقية لكل طالب', 'Remaining pages per learner'), value: simulatedRemainingPages, set: setSimulatedRemainingPages, step: '1', max: '604' }
              ].map(control => (
                <label key={control.label} style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {control.label}
                  <input
                    type="number" min="0" max={control.max} step={control.step} value={control.value}
                    onChange={event => {
                      const value = Number(event.target.value);
                      const adjusted = control.step === '1' ? Math.round(value) : value;
                      control.set(Number.isFinite(adjusted) ? Math.min(control.max ? Number(control.max) : Number.MAX_SAFE_INTEGER, Math.max(0, adjusted)) : 0);
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  />
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '14px', color: 'var(--text-primary)' }}>
              <span>{text('صفحات المجموعة الافتراضية شهريًا: ', 'Hypothetical group pages per month: ')}<strong>{format(monthlyHypotheticalPages)}</strong></span>
              <span>{text('مدة إنهاء المتبقي لكل طالب بالأشهر: ', 'Months to finish remaining pages per learner: ')}<strong>{format(monthsPerStudent)}</strong></span>
            </div>
            {monthsPerStudent === null && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>{text('أدخل عدد طلاب ومعدلًا يوميًا أكبر من صفر لحساب المدة.', 'Enter a learner count and daily rate above zero to calculate time.')}</p>}
          </div>
        </>
      )}
    </div>
  );
};
