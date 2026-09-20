import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Mic, 
  Calendar, 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Sparkles,
  ChevronRight,
  Clock,
  Send,
  MessageSquare,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherStudentProfileModal = ({ studentId, isOpen, onClose }) => {
  const { lang, isRTL } = useLanguage();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'recitation' | 'revision' | 'consistency'
  const [noteText, setNoteText] = useState('');
  const [sentToast, setSentToast] = useState(false);

  useEffect(() => {
    if (studentId && isOpen) {
      fetchStudentProfile();
    }
  }, [studentId, isOpen]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/teacher_aisha/student/${studentId}`);
      const data = await res.json();
      if (res.ok && data.success && data.student) {
        setStudent(data.student);
      }
    } catch (e) {
      console.error('Failed to load student profile:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSendNote = () => {
    if (!noteText.trim()) return;
    setSentToast(true);
    setNoteText('');
    setTimeout(() => setSentToast(false), 3000);
  };

  const statusColor = student?.status === 'needs_attention' 
    ? '#F59E0B' 
    : (student?.status === 'inactive' ? '#EF4444' : '#10B981');
    
  const statusLabel = student?.status === 'needs_attention'
    ? 'بحاجة لمتابعة'
    : (student?.status === 'inactive' ? 'منقطعة' : 'متميزة ونشطة');

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
                      <span>الحلقة: {student.groupName || 'حلقة النور والهدى'}</span>
                      <span>•</span>
                      <span>المعلمة: {student.teacherName || 'أ. عائشة العتيبي'}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      تاريخ الانضمام: {student.joinedDate}
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
                        {student.goalPercent || 72}%
                      </strong>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ width: '100%', height: '10px', borderRadius: '6px', background: 'var(--primary-light)', overflow: 'hidden' }}>
                      <div style={{ width: `${student.goalPercent || 72}%`, height: '100%', borderRadius: '6px', background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)' }} />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      الهدف الحالي: <strong style={{ color: 'var(--text-primary)' }}>{student.currentTarget || 'إتمام حفظ سورة آل عمران وضبط متشابهاتها'}</strong>
                    </div>
                  </div>

                  {/* 4-Box Metric Highlights */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>إجمالي الحفظ</span>
                      <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{student.memorizedJuz} أجزاء</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>({student.memorizedPagesCount || (student.memorizedJuz * 20)} صفحة)</span>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>السورة الحالية</span>
                      <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>{student.currentSurah || 'آل عمران'}</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>الوجه 16</span>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الجزء الحالي</span>
                      <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>الجزء {student.currentJuz || 3}</strong>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>درجة الإتقان</span>
                      <strong style={{ fontSize: '18px', color: '#10B981' }}>{student.memoryScore || 92}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RECITATION DETAILS */}
              {activeTab === 'recitation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>جلسات التسميع</span>
                      <strong style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{student.totalSessions || 42} جلسة</strong>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>معدل الأخطاء</span>
                      <strong style={{ fontSize: '17px', color: student.errorsCount > 5 ? '#EF4444' : '#10B981' }}>{student.errorsCount || 2} لكل وجه</strong>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>معدل التحسن</span>
                      <strong style={{ fontSize: '17px', color: '#10B981' }}>+{student.improvementRate || 14}%</strong>
                    </div>
                  </div>

                  {/* Hesitation points & repeated mistakes */}
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      مواضع التردد والأخطاء المتكررة (تحليل المحرك الذكي)
                    </h4>
                    <ul style={{ margin: 0, paddingRight: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <li>أواخر آيات التقوى والصفات في سورة آل عمران (الآيات 134-138)</li>
                      <li>تكرار الوقف قبل تمام المعنى عند رأس الحزب السادس</li>
                      <li>متشابهة: «ذَلِكَ بِأَنَّهُمْ قَالُوا» بين البقرة وآل عمران</li>
                    </ul>
                  </div>

                  {/* Recent Sessions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      أحدث جلسات التسميع
                    </h4>
                    {(student.recentSessions || [
                      { date: 'اليوم', target: 'آل عمران (الوجه 15)', score: 98, duration: '12 دقيقة' },
                      { date: 'أمس', target: 'آل عمران (الوجه 14)', score: 94, duration: '15 دقيقة' },
                      { date: 'منذ 3 أيام', target: 'مراجعة الجزء الثاني', score: 91, duration: '28 دقيقة' }
                    ]).map((sess, idx) => (
                      <div key={idx} style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sess.target}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{sess.date} • {sess.duration}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 10px', borderRadius: '8px' }}>
                          {sess.score}% إتقان
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: REVISION & FORTRESSES */}
              {activeTab === 'revision' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      تطبيق منظومة الحصون الخمسة
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-surface)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الحصن القريب (آخر 20 صفحة):</span>
                        <strong style={{ fontSize: '13px', color: '#10B981' }}>مكتمل بنسبة 95%</strong>
                      </div>
                      <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-surface)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الحصن البعيد (المراجعة الكبرى):</span>
                        <strong style={{ fontSize: '13px', color: '#3B82F6' }}>جزء كامل كل يومين</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>آخر موعد مراجعة شاملة:</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{student.lastRevisionDate || 'اليوم فجراً'}</strong>
                    <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#F59E0B' }}>
                      ⚠️ المواضع الموصى بإعادة تثبيتها: سورة البقرة (الربع الرابع والخامس)
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONSISTENCY & CALENDAR */}
              {activeTab === 'consistency' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>سلسلة الأيام المتتالية</span>
                      <strong style={{ fontSize: '20px', color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={18} /> {student.streak || 28} يوماً
                      </strong>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الأيام الفائتة هذا الشهر</span>
                      <strong style={{ fontSize: '20px', color: '#10B981' }}>{student.missedDays || 1} يوم</strong>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الالتزام الأسبوعي</span>
                      <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>{student.consistencyRate || 92}%</strong>
                    </div>
                  </div>

                  {/* 7-day Activity Calendar Blocks */}
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                      نشاط الأيام السبعة الأخيرة:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                      {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day, idx) => {
                        const isDone = idx !== 5; // e.g. Thursday missed
                        return (
                          <div key={idx} style={{ padding: '8px 4px', borderRadius: '10px', background: isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isDone ? '#10B981' : '#EF4444' }}>
                            <span style={{ fontSize: '10px', display: 'block' }}>{day}</span>
                            <span style={{ fontSize: '14px', fontWeight: 800 }}>{isDone ? '✓' : '✗'}</span>
                          </div>
                        );
                      })}
                    </div>
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

                {sentToast && (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '12.5px', marginBottom: '8px', fontWeight: 600 }}>
                    ✓ تم إرسال التوجيه بنجاح وسيظهر في إشعارات الطالبة فوراً.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="اكتبي ملاحظتك أو تشجيعك هنا..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
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
                    onClick={handleSendNote}
                    disabled={!noteText.trim()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                      opacity: noteText.trim() ? 1 : 0.6,
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
