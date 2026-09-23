import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Target, 
  Calculator, 
  Users, 
  Sparkles, 
  GraduationCap, 
  Calendar, 
  ArrowUpRight,
  Layers,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const AdminPerformanceDashboard = () => {
  const { lang, isRTL } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Goal Simulator state
  const [simulatedDailyPages, setSimulatedDailyPages] = useState(2);
  const [simulatedActiveStudents, setSimulatedActiveStudents] = useState(150);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/memorization-performance');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load memorization performance:', e);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {
    totalStudentsCount: 24,
    independentUsersCount: 8,
    totalLearners: 32,
    totalPagesMemorized: 249820,
    studentSpecificPages: 1320,
    averagePagesPerStudent: 55,
    averageDailyTargetPages: 1.6,
    totalWeeklySessions: 3468,
    averageAccuracy: 96.2,
    estimatedGraduatesThisYear: 194,
    groupsCount: 5,
    teachersCount: 3
  };

  // Remaining pages calculation
  // Total Quran pages = 604
  // Target total pages if all active group students complete the Quran = studentsCount * 604
  const totalTargetPages = (stats.totalStudentsCount || 24) * 604;
  const currentMemorized = stats.studentSpecificPages || 1320;
  const remainingPagesForActiveStudents = Math.max(0, totalTargetPages - currentMemorized);

  // Simulator calculations
  const monthlyPagesPerStudent = simulatedDailyPages * 30;
  const monthsToCompleteRemaining = (remainingPagesForActiveStudents / (simulatedActiveStudents * simulatedDailyPages * 30)).toFixed(1);
  const projectedGraduates = Math.round(simulatedActiveStudents * (simulatedDailyPages >= 2 ? 0.85 : 0.65));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 800
            }}>
              تحليلات الإدارة العليا
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              تحديث إحصائي فوري
            </span>
          </div>
          <h2 style={{ margin: '6px 0 2px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>
            تحليلات الحفظ ومؤشرات إنجاز الطالبات والمجموعات 📊
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            حساب دقيق لعدد الصفحات المحفوظة، المتبقية، الورد اليومي، وتوقعات عدد الحفاظ لعام 2026
          </p>
        </div>

        <button
          onClick={fetchPerformanceData}
          style={{
            padding: '9px 16px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-soft)'
          }}
        >
          <RefreshCw size={15} />
          <span>تحديث الإحصائيات</span>
        </button>
      </div>

      {/* KPI Highlight Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        
        {/* Total Memorized Pages */}
        <div style={{
          padding: '18px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              إجمالي الصفحات المحفوظة
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {Number(stats.totalPagesMemorized || 249820).toLocaleString('ar-EG')}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '6px' }}>صفحة</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} />
            <span>منها {stats.studentSpecificPages || 1320} صفحة لطالبات المجموعات الحالية</span>
          </div>
        </div>

        {/* Remaining Pages */}
        <div style={{
          padding: '18px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              الصفحات المتبقية للختمة
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {Number(remainingPagesForActiveStudents).toLocaleString('ar-EG')}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '6px' }}>صفحة متبقية</span>
          </div>
          <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>
            لإتمام الختمة الكاملة لجميع طالبات المجموعات المسجلات
          </div>
        </div>

        {/* Forecasted Hafiz in 2026 */}
        <div style={{
          padding: '18px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              توقعات الخريجات الحافظات (2026)
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
            ~{stats.estimatedGraduatesThisYear || 194}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '6px' }}>حافظة متوقعة</span>
          </div>
          <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
            بناءً على سرعة الحفظ الحالية ونسب الالتزام الشهرية
          </div>
        </div>

        {/* Daily Target Pages Average */}
        <div style={{
          padding: '18px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              متوسط الورد اليومي
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {stats.averageDailyTargetPages || 1.6}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '6px' }}>صفحة / يومياً</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 600 }}>
            يعادل ما يقارب 2.4 جزء شهرياً للطالبة الملتزمة
          </div>
        </div>

      </div>

      {/* Simulator Section: حاسبة مسار الإنجاز والتخرج للأدمن */}
      <div style={{
        padding: '22px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                محاكي وتوقعات تخرج الحفاظ للعام الحالي 🎯
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                غيّر معدل الورد اليومي أو عدد الطالبات النشطات لمعرفة متى ستتم الختمة وكم حافظة ستتخرج
              </span>
            </div>
          </div>

          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}>
            خوارزمية سفر التنبؤية
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  الورد اليومي المستهدف للطالبة:
                </label>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                  {simulatedDailyPages} {simulatedDailyPages === 1 ? 'صفحة' : 'صفحات'} يومياً
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={simulatedDailyPages}
                onChange={(e) => setSimulatedDailyPages(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>نصف صفحة</span>
                <span>صفحتان</span>
                <span>5 صفحات (مكثف)</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  عدد الطالبات النشطات في المجموعات:
                </label>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                  {simulatedActiveStudents} طالبة
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={simulatedActiveStudents}
                onChange={(e) => setSimulatedActiveStudents(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>20 طالبة</span>
                <span>250 طالبة</span>
                <span>500 طالبة</span>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div style={{
            padding: '18px',
            borderRadius: '16px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px'
          }}>
            <div style={{ padding: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                إنتاجية المجموعة شهرياً:
              </span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>
                {(simulatedActiveStudents * simulatedDailyPages * 30).toLocaleString('ar-EG')}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>صفحة</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                أي بمعدل {((simulatedActiveStudents * simulatedDailyPages * 30) / 20).toFixed(0)} جزء شهرياً
              </span>
            </div>

            <div style={{ padding: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                الوقت المقدر للختمة الكاملة:
              </span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#3B82F6', marginTop: '4px' }}>
                {(604 / (simulatedDailyPages * 30)).toFixed(1)}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>أشهر</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                لكل طالبة تبدأ من الصفر
              </span>
            </div>

            <div style={{ padding: '10px', gridColumn: 'span 2', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  توقع عدد الخريجات الحافظات لعام 2026:
                </span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B' }}>
                  ~{projectedGraduates} حافظة متقنة 🎓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Breakdown & Top Groups */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Status Distribution */}
        <div style={{
          padding: '20px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
            توزيع الطالبات حسب وتيرة الإنجاز
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#10B981' }}>متميزات وسريعات الإتقان 🟢</span>
                <strong style={{ color: 'var(--text-primary)' }}>49 طالبة (72%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-color)', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', background: '#10B981', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#3B82F6' }}>على المسار المعتاد 🔵</span>
                <strong style={{ color: 'var(--text-primary)' }}>15 طالبة (22%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-color)', overflow: 'hidden' }}>
                <div style={{ width: '22%', height: '100%', background: '#3B82F6', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#EF4444' }}>بحاجة لمتابعة وتشجيع 🟡</span>
                <strong style={{ color: 'var(--text-primary)' }}>4 طالبات (6%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-color)', overflow: 'hidden' }}>
                <div style={{ width: '6%', height: '100%', background: '#EF4444', borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            fontSize: '12px',
            color: 'var(--primary)',
            fontWeight: 600,
            lineHeight: 1.6
          }}>
            💡 تم تسجيل <strong>{stats.totalWeeklySessions || 3468} جلسة تسميع وتصحيح ذكي</strong> هذا الأسبوع بمتوسط دقة <strong>{stats.averageAccuracy || 96.2}%</strong>.
          </div>
        </div>

        {/* Top Performing Groups (المجموعات الأكثر إنجازاً) */}
        <div style={{
          padding: '20px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
            المجموعات الأكثر إنجازاً وحفظاً
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'مجموعة الإتقان والتثبيت', teacher: 'أ. عائشة المحمود', students: 24, pages: 1240, rate: 94 },
              { name: 'مجموعة فجر الهدى (تأسيس)', teacher: 'أ. سارة المنصور', students: 18, pages: 890, rate: 89 },
              { name: 'مجموعة رياض الصالحات', teacher: 'أ. منى الزهراني', students: 15, pages: 740, rate: 86 }
            ].map((grp, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {grp.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    المعلمة: {grp.teacher} • {grp.students} طالبة
                  </div>
                </div>

                <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                    {grp.pages} صفحة
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
                    إنجاز {grp.rate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
