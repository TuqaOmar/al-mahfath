import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award, 
  ChevronLeft, 
  Sparkles, 
  Mic, 
  BookOpen, 
  ShieldAlert, 
  ArrowRight,
  Filter,
  User,
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const getActivityIcon = (icon) => {
  if (!icon) return CheckCircle2;
  if (typeof icon !== 'string') return icon;
  switch (icon.toLowerCase()) {
    case 'check': return CheckCircle2;
    case 'mic': return Mic;
    case 'trophy': return Award;
    case 'shield': return ShieldAlert;
    case 'book': return BookOpen;
    default: return Sparkles;
  }
};

export const TeacherDashboard = ({ onOpenStudentProfile, onViewAllStudents, onViewGroups }) => {
  const { user } = useAuth();
  const { lang, isRTL } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherDashboard();
  }, [user]);

  const fetchTeacherDashboard = async () => {
    setLoading(true);
    try {
      const teacherId = user?.uid || 'teacher_aisha';
      const res = await fetch(`/api/teacher/${teacherId}/dashboard`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardData(data);
      }
    } catch (e) {
      console.error('Failed to load teacher dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const stats = dashboardData?.stats || {
    studentsCount: 24,
    activeThisWeek: 21,
    weeklyCommitment: 87,
    needsAttentionCount: 4
  };

  const studentsNeedAttention = dashboardData?.studentsWhoNeedAttention || [
    { uid: 'student_mona', name: 'منى عبد العزيز', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MonaA', memorizedJuz: 8, attentionReason: 'لم تسجل أي تسميع منذ 4 أيام', lastRecitationDate: 'منذ 4 أيام', consistencyRate: 74 },
    { uid: 'student_reem', name: 'ريم الدوسري', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ReemD', memorizedJuz: 10, attentionReason: 'الورد الأسبوعي غير مكتمل', lastRecitationDate: 'منذ 6 أيام', consistencyRate: 65 },
    { uid: 'student_arwa', name: 'أروى القحطاني', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArwaQ', memorizedJuz: 6, attentionReason: 'انخفاض في دقة التلاوة وتكرار أخطاء الوقف', lastRecitationDate: 'منذ يومين', consistencyRate: 71 },
    { uid: 'student_hind', name: 'هند العتيبي', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HindO', memorizedJuz: 9, attentionReason: 'تباطأ معدل الإنجاز هذا الأسبوع', lastRecitationDate: 'منذ 3 أيام', consistencyRate: 68 }
  ];

  const smartInsights = dashboardData?.smartInsights || [
    { id: 'target_completed', type: 'success', text: '18 من أصل 24 طالبة أكملن وردهن الأسبوعي بنجاح 🎯', filterTag: 'excellent' },
    { id: 'no_recitation_3_days', type: 'warning', text: '4 طالبات لم يقدمن أي تسميع خلال الـ 3 أيام الماضية ⚠️', filterTag: 'needs_attention' },
    { id: 'decreased_consistency', type: 'alert', text: 'طالبتان شهدتا تراجعاً في نسبة الالتزام اليومي 📉', filterTag: 'needs_attention' },
    { id: 'improved_rate', type: 'highlight', text: '5 طالبات رفعن معدل الحفظ والإتقان هذا الأسبوع بنسبة تفوق 10% 🌟', filterTag: 'excellent' }
  ];

  const recentActivities = dashboardData?.recentActivities || [
    { id: 1, studentName: 'سارة الخالدي', type: 'memorization', action: 'أتمت حفظ الوجه 15 من سورة آل عمران', time: 'منذ 25 دقيقة', icon: BookOpen },
    { id: 2, studentName: 'خديجة العمري', type: 'recitation', action: 'أكملت تسميع الجزء العشرين بنسبة دقة 98%', time: 'منذ ساعة', icon: Mic },
    { id: 3, studentName: 'لينة الأنصاري', type: 'goal', action: 'حققت هدفها الأسبوعي بتسميع 4 أوجه متتالية', time: 'منذ ساعتين', icon: Award },
    { id: 4, studentName: 'نورة الشمري', type: 'revision', action: 'أنجزت الحصن البعيد بمراجعة سورة البقرة في قيام الليل', time: 'اليوم فجراً', icon: CheckCircle2 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Header Banner */}
      <div style={{
        padding: '24px 28px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #064E3B 0%, #0F766E 50%, #047857 100%)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(6, 78, 59, 0.25)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: isRTL ? '-30px' : 'auto',
          right: isRTL ? 'auto' : '-30px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
          <Sparkles size={14} /> {lang === 'ar' ? 'لوحة المعلمة الذكية' : 'Teacher Smart Dashboard'}
        </div>

        <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800 }}>
          {lang === 'ar' 
            ? `مرحباً ${user?.name || 'أ. عائشة العتيبي'} 🌸`
            : `Welcome, ${user?.name || 'Teacher Aisha'} 🌸`}
        </h1>
        <p style={{ margin: 0, fontSize: '14.5px', color: '#D1FAE5', lineHeight: 1.5 }}>
          {lang === 'ar'
            ? 'متابعة مسار طالباتك، ونقاط القوة والتعثر، ومن هن بحاجة لاهتمامك المباشر.'
            : 'Track your students\' progress, strengths, and who needs your attention.'}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onViewAllStudents && onViewAllStudents('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: '#FFFFFF',
              color: '#064E3B',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} />
            <span>{lang === 'ar' ? 'سجل طالباتي (24)' : 'My Students (24)'}</span>
          </button>

          <button
            onClick={() => onViewGroups && onViewGroups()}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={16} />
            <span>{lang === 'ar' ? 'حلقاتي (حلقة النور)' : 'My Groups'}</span>
          </button>
        </div>
      </div>

      {/* 1. Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        {/* Total Students */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>إجمالي الطالبات</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.studentsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
            مسجلات في حلقة النور والهدى
          </span>
        </div>

        {/* Active This Week */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>نشطات هذا الأسبوع</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.activeThisWeek}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            من أصل {stats.studentsCount} طالبة
          </span>
        </div>

        {/* Weekly Commitment */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>الالتزام الأسبوعي</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>
            {stats.weeklyCommitment}%
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            متوسط التزام الحلقة
          </span>
        </div>

        {/* Needs Attention */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700 }}>بحاجة لمتابعة</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#EF4444' }}>
            {stats.needsAttentionCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 600 }}>
            تتطلب تواصلاً ودعماً فورياً
          </span>
        </div>
      </div>

      {/* 2. SECTION: STUDENTS WHO NEED ATTENTION */}
      <div style={{
        padding: '24px',
        borderRadius: '22px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '12px', fontWeight: 700 }}>
              <ShieldAlert size={16} /> تنبيهات المتابعة الذكية
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              طالبات بحاجة لاهتمامك المباشر ({studentsNeedAttention.length})
            </h3>
          </div>
          <button
            onClick={() => onViewAllStudents && onViewAllStudents('needs_attention')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>عرض الكل</span>
            <ChevronLeft size={16} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {studentsNeedAttention.map((student) => (
            <div
              key={student.uid}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={student.photoURL}
                  alt={student.name}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(239, 68, 68, 0.4)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {student.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    الحفظ: {student.memorizedJuz} أجزاء • آخر تسميع: {student.lastRecitationDate}
                  </div>
                </div>
              </div>

              {/* Intelligent Alert Reason Box */}
              <div style={{
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{student.attentionReason}</span>
              </div>

              <button
                onClick={() => onOpenStudentProfile && onOpenStudentProfile(student.uid)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: 'auto'
                }}
              >
                <span>عرض الملف وتفاصيل الإنجاز</span>
                <ChevronLeft size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECTION: SMART TEACHER INSIGHTS ("This Week / هذا الأسبوع") */}
      <div style={{
        padding: '24px',
        borderRadius: '22px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={20} color="var(--primary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              رؤى المعلمة الذكية (هذا الأسبوع)
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              تحليلات حية مبنية على أداء الطالبات الفعلي وتسميعهن بالذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {smartInsights.map((insight) => (
            <div
              key={insight.id}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {insight.text}
              </div>

              <button
                onClick={() => onViewAllStudents && onViewAllStudents(insight.filterTag)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <span>عرض الطالبات</span>
                <ChevronLeft size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SECTION: RECENT ACTIVITY FEED */}
      <div style={{
        padding: '24px',
        borderRadius: '22px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            أحدث نشاطات وتسميعات الحلقة
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تحديث حي ومباشر</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentActivities.map((act) => {
            const Icon = getActivityIcon(act.icon);
            return (
              <div
                key={act.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {act.studentName}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.action}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {act.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
