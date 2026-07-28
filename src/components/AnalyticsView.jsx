import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Brain, 
  BookOpen, 
  Flame, 
  Clock, 
  Target, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  BarChart3, 
  Activity, 
  PieChart, 
  Calendar,
  Layers,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';

export const AnalyticsView = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate dynamic stats from user data
  const memoryScore = user?.memoryScore || 94;
  const memorizedPages = user?.memorizedPagesCount || 49;
  const streak = user?.streak || 12;
  const xp = user?.xp || 850;
  const level = user?.level || 2;

  // Juz distribution mock data based on user progress
  const juzData = [
    { juz: 1, name: 'الجزء الأول (البقرة 1-141)', status: 'excellent', score: 98, pages: 21 },
    { juz: 2, name: 'الجزء الثاني (البقرة 142-252)', status: 'excellent', score: 95, pages: 20 },
    { juz: 3, name: 'الجزء الثالث (البقرة 253 - آل عمران 92)', status: 'review', score: 86, pages: 20 },
    { juz: 29, name: 'الجزء التاسع والعشرون (تبارك)', status: 'review', score: 82, pages: 20 },
    { juz: 30, name: 'الجزء الثلاثون (عمّ)', status: 'excellent', score: 96, pages: 23 },
  ];

  // Weekly compliance data for 5 Fortresses
  const fortressesCompliance = [
    { name: '1. قراءة الورد اليومي', rate: 96, color: '#3B82F6', count: '27/28 يوم' },
    { name: '2. التحضير الأسبوعي', rate: 85, color: '#8B5CF6', count: '6/7 أسابيع' },
    { name: '3. التحضير القريب (15 دقيقة)', rate: 90, color: '#EC4899', count: '25/28 يوم' },
    { name: '4. كتابة وتثبيت الوجه الجديد', rate: 92, color: '#10B981', count: '46 صفحة' },
    { name: '5. المراجعة البعيدة (في الصلاة)', rate: 88, color: '#F59E0B', count: '24/28 يوم' },
  ];

  // Ebbinghaus forgetting curve memory stability stages
  const memoryStages = [
    { period: 'بعد 24 ساعة', retention: '98%', status: 'ثبات ممتاز', color: '#10B981' },
    { period: 'بعد 3 أيام', retention: '92%', status: 'مراجعة قريبة', color: '#10B981' },
    { period: 'بعد 7 أيام', retention: '85%', status: 'تثبيت بالصلاة', color: '#3B82F6' },
    { period: 'بعد 14 يوم', retention: '78%', status: 'مراجعة بعيدة مطلوب', color: '#F59E0B' },
    { period: 'بعد 30 يوم', retention: '70%', status: 'اختبار الحصن الخامس', color: '#EF4444' },
  ];

  // Common errors classification
  const errorTypes = [
    { type: 'المتشابهات اللفظية (الرباط اللفظي)', percent: 42, count: '14 موضع', color: '#EF4444', advice: 'اربط المعنى بمحور السورة العام' },
    { type: 'أواخر الآيات ورؤوس الفواصل', percent: 28, count: '9 مواضع', color: '#F59E0B', advice: 'كرر تسميع رأس الآية مع أول التي تليها' },
    { type: 'أحكام التجويد ودقائق الترتيل', percent: 18, count: '6 مواضع', color: '#3B82F6', advice: 'راجع الإخفاء والإدغام مع مشغل الصوت' },
    { type: 'ترتيب الآيات داخل القصة', percent: 12, count: '4 مواضع', color: '#10B981', advice: 'استحضر الخارطة الذهنية للقصة القرأنية' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '28px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Analytics Page Title & Subtitle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <div style={{ padding: '8px 14px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} /> مركز التحليلات المتقدمة للاستقرار الذهني
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تحديث فوري بناءً على جلسات التسميع والرباط</span>
        </div>
        <h2 style={{ fontSize: isMobile ? '22px' : '28px', color: 'var(--text-primary)', margin: '4px 0 6px 0' }}>
          📊 تحليلات جودة الحفظ والذاكرة القرأنية
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          مؤشرات علمية تفصيلية لقياس منحنى النسيان، ثبات السور في الصدر، ونسبة الالتزام بمنهجية الحصون الخمسة.
        </p>
      </div>

      {/* 1. Top Key Performance Indicators Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '18px' }}>
        
        {/* KPI 1: Memory Score */}
        <Card style={{ padding: isMobile ? '14px' : '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>درجة ثبات الذاكرة</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{memoryScore}%</span>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold' }}>+3.2% 📈</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>استقرار ممتاز وفق منحنى Ebbinghaus</span>
        </Card>

        {/* KPI 2: Mastered Pages */}
        <Card style={{ padding: isMobile ? '14px' : '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>المحفوظ الثابت</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{memorizedPages}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>صفحة (2.5 جزء)</span>
          </div>
          <span style={{ fontSize: '11px', color: '#10B981', display: 'block', marginTop: '4px' }}>🟢 42 صفحة بدرجة إتقان &gt; 90%</span>
        </Card>

        {/* KPI 3: Streak Discipline */}
        <Card style={{ padding: isMobile ? '14px' : '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>رباط القرآن المتتالي</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{streak}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>يوم متصل</span>
          </div>
          <span style={{ fontSize: '11px', color: '#F59E0B', display: 'block', marginTop: '4px' }}>🔥 نسبة التزام الشهر: 96%</span>
        </Card>

        {/* KPI 4: Recall Latency */}
        <Card style={{ padding: isMobile ? '14px' : '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>سرعة الاسترجاع الذهني</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>1.4</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ثانية / آية</span>
          </div>
          <span style={{ fontSize: '11px', color: '#10B981', display: 'block', marginTop: '4px' }}>⚡ استجابة ممتازة بدون تردد</span>
        </Card>

      </div>

      {/* 2. Main Analytics Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? '16px' : '24px' }}>
        
        {/* Left Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          
          {/* Chart 1: Five Fortresses Weekly Compliance Breakdown */}
          <Card style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: 'var(--text-primary)' }}>
                  🏰 تحليل الالتزام بالحصون الخمسة (آخر 30 يوم)
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                معدل الالتزام الكلي: 91.8%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {fortressesCompliance.map((f, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{f.name}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{f.count}</span>
                      <span style={{ fontWeight: 'bold', color: f.color }}>{f.rate}%</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: `${f.rate}%`, height: '100%', background: f.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart 2: Juz-by-Juz Mastery Distribution Table */}
          <Card style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={22} color="#3B82F6" />
                <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: 'var(--text-primary)' }}>
                  📖 مستوى الإتقان حسب أجزاء المصحف
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>مؤشر ثبات الصدر</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {juzData.map((item) => (
                <div key={item.juz} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>{item.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.pages} صفحة مسجلة</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: isMobile ? '80px' : '120px', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.score}%`, height: '100%', background: item.score >= 90 ? '#10B981' : '#F59E0B' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: item.score >= 90 ? '#10B981' : '#F59E0B', minWidth: '40px', textAlign: 'left' }}>
                      {item.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart 3: Recitation Errors Classification Analysis */}
          <Card style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertCircle size={22} color="#EF4444" />
              <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: 'var(--text-primary)' }}>
                🔍 تصنيف مواضع ضعف التسميع والتوصيات العلاجية
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              {errorTypes.map((err, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: `1px solid ${err.color}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{err.type}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: err.color }}>{err.percent}%</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    عدد التنبيهات المسجلة: {err.count}
                  </span>
                  <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '11px', color: 'var(--primary)' }}>
                    💡 <b>العلاج المقترح:</b> {err.advice}
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          
          {/* AI Memory Stability Curve Card */}
          <Card style={{ padding: isMobile ? '16px' : '24px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Sparkles size={22} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary)' }}>
                منحنى استقرار الذاكرة (SRS)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              درجة احتفاظ العقل بالآيات بمرور الوقت بناءً على خوارزمية التكرار المتباعد:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {memoryStages.map((stage, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' }}>{stage.period}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{stage.status}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: stage.color }}>
                    {stage.retention}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Target Milestone Progress */}
          <Card style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Target size={22} color="#F59E0B" />
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                🎯 الهدف القادم: ختم الجزء الثالث
              </h3>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>التقدم في سورة آل عمران:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>75% (9 صفحة)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: '75%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
              </div>
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.5 }}>
              تبقي 3 صفحات فقط لإتمام الحصن الرابع لهذا الأسبوع وبلوغ وسام "حافظ الأجزاء الثلاثة الأولى".
            </span>
          </Card>

          {/* Spiritual Recommendation Summary */}
          <Card style={{ padding: isMobile ? '16px' : '24px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckCircle2 size={22} color="#10B981" />
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                نصيحة المعلم الذكي اليومية
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              «أداءك في المتشابهات اللفظية تحسّن بنسبة 14% مقارنة بالأسبوع الماضي. نوصيك بالتركيز اليوم على قراءة الصفحة 48 في صلاة العشاء لتثبيت أواخر سورة البقرة في الصدر نهائياً.»
            </p>
          </Card>

        </div>

      </div>

    </div>
  );
};
