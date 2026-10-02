import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Mic, 
  Flame, 
  Send,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/api';

export const TeacherStudentProfileModal = ({ studentId, isOpen, onClose }) => {
  const { lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'recitation' | 'revision' | 'consistency'
  const requestVersion = useRef(0);
  const text = (ar, en) => lang === 'en' ? en : ar;

  const fetchStudentProfile = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setStudent(null);
    setLoadError('');
    try {
      if (!user?.uid || !studentId) throw new Error('Authentication and student ID required');
      const res = await fetchWithAuth(
        `/api/teacher/${encodeURIComponent(user.uid)}/student/${encodeURIComponent(studentId)}`
      );
      const data = await res.json();
      if (!res.ok || !data.success || !data.student) throw new Error('Student profile request failed');
      if (version === requestVersion.current) setStudent(data.student);
    } catch (e) {
      console.error('Failed to load student profile:', e);
      if (version === requestVersion.current) setLoadError('failed');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [studentId, user?.uid]);

  useEffect(() => {
    if (studentId && isOpen) {
      setActiveTab('overview');
      fetchStudentProfile();
    }
    return () => { requestVersion.current += 1; };
  }, [studentId, isOpen, fetchStudentProfile]);

  if (!isOpen) return null;

  const numberLabel = (value, suffix = '') => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
    ? `${Number(value)}${suffix}` : '—';
  const dateLabel = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(lang === 'en' ? 'en-GB' : 'ar-JO');
  };
  const stats = student?.recitationStats || {};
  const recentSessions = Array.isArray(student?.recentSessions) ? student.recentSessions : [];

  const statusColor = student?.status === 'needs_attention' 
    ? '#F59E0B' 
    : (student?.status === 'inactive' ? '#EF4444' : '#64748B');
    
  const statusLabel = student?.status === 'needs_attention'
    ? 'بحاجة لمتابعة'
    : (student?.status === 'inactive' ? 'منقطعة' : 'لا يوجد تقييم نشاط معتمد');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              ملف إنجاز الطالبة القرآني
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              جاري تحميل ملف الطالبة...
            </div>
          ) : loadError ? (
            <div role="alert" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>{text('تعذر تحميل ملف الطالبة. تحققي من الاتصال وصلاحية الوصول ثم أعيدي المحاولة.', 'Could not load this learner. Check your connection and access, then retry.')}</p>
              <button onClick={fetchStudentProfile} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {text('إعادة المحاولة', 'Retry')}
              </button>
            </div>
          ) : !student ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              لم يتم العثور على بيانات الطالبة.
            </div>
          ) : (
            <>
              {/* 1. Student Overview Card */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '20px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={student.photoURL}
                    alt={student.name}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${statusColor}` }}
                  />
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {student.name}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>الحلقة: {student.groupName || 'غير محددة'}</span>
                      <span>•</span>
                      <span>المعلمة: {student.teacherName || 'غير محددة'}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      تاريخ الانضمام: {dateLabel(student.joinedDate)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '14px',
                    background: `${statusColor}18`,
                    color: statusColor,
                    display: 'inline-block'
                  }}>
                    {statusLabel}
                  </span>
                  {student.attentionReason && (
                    <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 600, marginTop: '4px' }}>
                      {student.attentionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-tabs Navigation */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', overflowX: 'auto' }}>
                {[
                  { id: 'overview', label: 'التقدم القرآني', icon: BookOpen },
                  { id: 'recitation', label: 'التسميع والأداء', icon: Mic },
                  { id: 'revision', label: 'المراجعة والتثبيت', icon: RefreshCw },
                  { id: 'consistency', label: 'الالتزام والانتظام', icon: Flame }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '8px 14px',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: QURAN PROGRESS */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Progress Bar & Goal */}
                  <div style={{ padding: '18px', borderRadius: '18px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        نسبة إنجاز الهدف المرحلي
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>
                        {numberLabel(student.goalPercent, '%')}
                      </strong>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ width: '100%', height: '10px', borderRadius: '6px', background: 'var(--primary-light)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, Number(student.goalPercent) || 0))}%`, height: '100%', borderRadius: '6px', background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)' }} />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      الهدف الحالي: <strong style={{ color: 'var(--text-primary)' }}>{student.currentTarget || 'غير محدد'}</strong>
                    </div>
                  </div>

                  {/* 4-Box Metric Highlights */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>إجمالي الحفظ</span>
                      <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{numberLabel(student.memorizedJuz)} أجزاء</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>({numberLabel(student.memorizedPagesCount)} صفحة)</span>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>السورة الحالية</span>
                      <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>{student.currentSurah || 'غير محددة'}</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>الوجه {numberLabel(student.currentPage)}</span>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الجزء الحالي</span>
                      <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>الجزء {numberLabel(student.currentJuz)}</strong>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>مؤشر الذاكرة المسجل</span>
                      <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{numberLabel(student.memoryScore, '%')}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RECITATION DETAILS */}
              {activeTab === 'recitation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {text('هذه محاولات تدريب بالمقارنة النصية. النص المرجعي غير متحقق منه؛ النتيجة لا تعتمد الحفظ أو التجويد ولا تمنح نقاط خبرة.', 'These are text comparison practice attempts. The reference text is unverified; results do not certify memorization or tajweed and award no XP.')}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{text('محاولات التدريب', 'Practice attempts')}</span>
                      <strong data-testid="student-practice-count" style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{numberLabel(stats.totalAttempts ?? stats.totalSessions ?? 0)}</strong>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{text('متوسط تطابق النص', 'Average text match')}</span>
                      <strong data-testid="student-practice-average" style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{stats.hasAttempts ? numberLabel(stats.averageAccuracy, '%') : '—'}</strong>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{text('أفضل تطابق نصي', 'Best text match')}</span>
                      <strong style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{stats.hasAttempts ? numberLabel(stats.bestAccuracy, '%') : '—'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>{text('محاولات آخر سبعة أيام:', 'Attempts in the last seven days:')} {numberLabel(stats.totalWeeklySessions ?? 0)}</span>
                    <span>{text('آخر محاولة:', 'Last attempt:')} {dateLabel(stats.lastRecitedAt)}</span>
                  </div>

                  {/* Recent Sessions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {text('أحدث محاولات المقارنة النصية', 'Recent text comparison attempts')}
                    </h4>
                    {recentSessions.length === 0 && (
                      <p data-testid="student-practice-empty" style={{ margin: 0, padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {text('لا توجد محاولات تدريب محفوظة لهذه الطالبة.', 'No saved practice attempts for this learner.')}
                      </p>
                    )}
                    {recentSessions.map(sess => (
                      <div key={sess.id} data-testid={`student-practice-${sess.id}`} style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sess.surahName || text('مقارنة نصية', 'Text comparison')} • {text('الصفحة', 'Page')} {numberLabel(sess.pageNumber)}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{dateLabel(sess.createdAt)} • {text('تدريب؛ مرجع غير متحقق', 'Practice; unverified reference')}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                          {numberLabel(sess.accuracy, '%')} {text('تطابق النص', 'text match')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: REVISION & FORTRESSES */}
              {activeTab === 'revision' && (
                <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {text('متابعة المراجعة والحصون في هذا الملف غير متاحة بعد؛ لا توجد نتائج مراجعة مرتبطة بهذه الشاشة.', 'Revision and fortress tracking are not available in this profile yet; no revision results are connected to this view.')}
                </div>
              )}

              {/* TAB 4: CONSISTENCY & CALENDAR */}
              {activeTab === 'consistency' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>سلسلة الأيام المتتالية</span>
                      <strong style={{ fontSize: '20px', color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={18} /> {numberLabel(student.streak)} يوماً
                      </strong>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الأيام الفائتة هذا الشهر</span>
                      <strong style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{numberLabel(student.missedDays)} يوم</strong>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الالتزام الأسبوعي</span>
                      <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>{numberLabel(student.consistencyRate, '%')}</strong>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {text('تقويم النشاط اليومي غير متاح في هذا الملف بعد.', 'The daily activity calendar is not available in this profile yet.')}
                    </span>
                  </div>
                </div>
              )}

              {/* Direct Teacher Interaction: Send Encouragement Note */}
              <div style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} color="var(--primary)" />
                  <span>إرسال توجيه أو تشجيع للطالبة</span>
                </h4>

                <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {text('إرسال الملاحظات غير متاح بعد؛ لا تُحفظ أو تُرسل ملاحظة من هذه الشاشة.', 'Teacher notes are not available yet; this view does not save or send a note.')}
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={text('إرسال الملاحظات غير متاح', 'Sending notes is unavailable')}
                    disabled
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    disabled
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      opacity: 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={14} />
                    <span>إرسال</span>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-surface)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
};
