import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Brain, 
  BarChart3, 
  Filter,
  Sparkles
} from 'lucide-react';
import { Card } from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const VisualProgressTracker = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly' | 'fortresses'
  const [metricType, setMetricType] = useState('pages'); // 'pages' | 'score'

  // Custom User Plan Target defaults
  const dailyTargetPages = user?.preferences?.dailyTarget === 'صفحتين يومياً' ? 2 : 1;
  const reviewTargetPages = dailyTargetPages * 5;

  // Daily Achievements Data (Current Week)
  const dailyData = [
    { day: 'السبت', Sat: 'Sat', pagesMemorized: 1, pagesReviewed: 5, target: dailyTargetPages, score: 92, xp: 120 },
    { day: 'الأحد', Sun: 'Sun', pagesMemorized: 1, pagesReviewed: 6, target: dailyTargetPages, score: 95, xp: 140 },
    { day: 'الإثنين', Mon: 'Mon', pagesMemorized: 2, pagesReviewed: 8, target: dailyTargetPages, score: 98, xp: 200 },
    { day: 'الثلاثاء', Tue: 'Tue', pagesMemorized: 1, pagesReviewed: 4, target: dailyTargetPages, score: 88, xp: 110 },
    { day: 'الأربعاء', Wed: 'Wed', pagesMemorized: 1, pagesReviewed: 7, target: dailyTargetPages, score: 94, xp: 150 },
    { day: 'الخميس', Thu: 'Thu', pagesMemorized: 2, pagesReviewed: 10, target: dailyTargetPages, score: 99, xp: 220 },
    { day: 'الجمعة', Fri: 'Fri', pagesMemorized: 1, pagesReviewed: 5, target: dailyTargetPages, score: 96, xp: 130 }
  ];

  // Weekly Achievements Data (Current Month)
  const weeklyData = [
    { week: 'الأسبوع 1', pagesMemorized: 7, pagesReviewed: 35, score: 91, completionRate: 100 },
    { week: 'الأسبوع 2', pagesMemorized: 8, pagesReviewed: 40, score: 94, completionRate: 105 },
    { week: 'الأسبوع 3', pagesMemorized: 6, pagesReviewed: 38, score: 92, completionRate: 90 },
    { week: 'الأسبوع 4 (الحالي)', pagesMemorized: 9, pagesReviewed: 45, score: 97, completionRate: 115 }
  ];

  // Five Fortresses Achievement Distribution for Pie Chart
  const fortressData = [
    { name: 'الورد اليومي', value: 30, color: '#10B981', label: '30%' },
    { name: 'التحضير الأسبوعي', value: 20, color: '#3B82F6', label: '20%' },
    { name: 'التحضير القريب', value: 15, color: '#8B5CF6', label: '15%' },
    { name: 'الحفظ الجديد', value: 15, color: '#F59E0B', label: '15%' },
    { name: 'المراجعة البعيدة', value: 20, color: '#EC4899', label: '20%' }
  ];

  // Colors
  const primaryColor = '#10B981';
  const secondaryColor = '#3B82F6';
  const accentColor = '#F59E0B';
  const scoreColor = '#8B5CF6';

  // Dynamic User Metrics Calculation from stored user data
  const memorizedPagesCount = user?.memorizedPagesCount || 100;
  const TOTAL_QURAN_PAGES = 604;
  const overallProgressPercentage = ((memorizedPagesCount / TOTAL_QURAN_PAGES) * 100).toFixed(1);
  const userStreak = user?.streak || 7;

  // Calculate Summary Metrics
  const totalMemorizedThisWeek = dailyData.reduce((acc, curr) => acc + curr.pagesMemorized, 0);
  const totalReviewedThisWeek = dailyData.reduce((acc, curr) => acc + curr.pagesReviewed, 0);
  const averageScoreThisWeek = Math.round(dailyData.reduce((acc, curr) => acc + curr.score, 0) / dailyData.length);
  const weeklyTargetTotal = dailyTargetPages * 7;
  const targetAchievedPercentage = Math.min(100, Math.round((totalMemorizedThisWeek / weeklyTargetTotal) * 100));

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--glass-border, #e5e7eb)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ margin: '4px 0', fontSize: '13px', color: entry.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }}></span>
              <span>{entry.name}:</span>
              <strong style={{ margin: 0, fontStyle: 'normal' }}>{entry.value} {entry.unit || ''}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
      {/* Header & Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
            <Sparkles size={16} />
            <span>مخطط الإنجاز القرآني التفاعلي</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={22} color="var(--primary)" />
            تتبع إنجاز الخطة الشخصية والحفظ اليومي
          </h3>
        </div>

        {/* Controls: Timeframe & Metric Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Selector */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-color)', 
            padding: '4px', 
            borderRadius: '12px', 
            border: '1px solid var(--glass-border)' 
          }}>
            <button
              onClick={() => setViewMode('daily')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'daily' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'daily' ? 'white' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              يومي (أسبوعي)
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'weekly' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'weekly' ? 'white' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              أسبوعي (شهري)
            </button>
            <button
              onClick={() => setViewMode('fortresses')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'fortresses' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'fortresses' ? 'white' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              توزيع الحصون
            </button>
          </div>

          {/* Metric Selector (for daily/weekly) */}
          {viewMode !== 'fortresses' && (
            <button
              onClick={() => setMetricType(metricType === 'pages' ? 'score' : 'pages')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Filter size={14} color="var(--primary)" />
              {metricType === 'pages' ? 'عرض درجات الإتقان (%)' : 'عرض عدد الصفحات'}
            </button>
          )}
        </div>
      </div>

      {/* Progress Cards Overview Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
        gap: '14px', 
        marginBottom: '24px' 
      }}>
        {/* Summary Card: Weekly Streak & Overall Progress Percentage */}
        <div style={{ 
          padding: '14px', 
          borderRadius: '14px', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', 
          border: '1.5px solid var(--primary)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
            <Award size={16} color="var(--primary)" />
            <span>ملخص الإنجاز التراكمي</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {overallProgressPercentage}%
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>من المصحف ({memorizedPagesCount}/604)</span>
          </div>
          <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={13} color="#F59E0B" />
            <span>سلسلة الحفظ: {userStreak} أيام متتالية 🔥</span>
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
            <BookOpen size={16} color="var(--primary)" />
            <span>الحفظ الجديد هذا الأسبوع</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {totalMemorizedThisWeek} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>صفحة</span>
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', fontWeight: 'bold' }}>
            🎯 مستهدف الخطة: {weeklyTargetTotal} صفحة ({targetAchievedPercentage}%)
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
            <Target size={16} color="#3B82F6" />
            <span>المراجعة والتثبيت المسجل</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {totalReviewedThisWeek} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>صفحة</span>
          </div>
          <div style={{ fontSize: '11px', color: '#3B82F6', marginTop: '4px' }}>
            🔄 معدل المراجعة: 5 صفحات/يوم
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
            <Brain size={16} color="#8B5CF6" />
            <span>متوسط جودة التسميع</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {averageScoreThisWeek}%
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', fontWeight: 'bold' }}>
            ✨ ثبات ممتاز في الذاكرة
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
            <Flame size={16} color="#F59E0B" />
            <span>نسبة الالتزام بالهدف</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {targetAchievedPercentage}%
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${targetAchievedPercentage}%`, height: '100%', background: '#10B981', borderRadius: '3px' }}></div>
          </div>
        </div>
      </div>

      {/* Main Chart Visualization Area */}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'daily' && metricType === 'pages' && (
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMemorized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorReviewed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area 
                type="monotone" 
                dataKey="pagesMemorized" 
                name="صفحات الحفظ الجديد" 
                stroke={primaryColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMemorized)" 
                unit=" صفحة"
              />
              <Area 
                type="monotone" 
                dataKey="pagesReviewed" 
                name="صفحات المراجعة والربط" 
                stroke={secondaryColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReviewed)" 
                unit=" صفحة"
              />
            </AreaChart>
          )}

          {viewMode === 'daily' && metricType === 'score' && (
            <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="score" 
                name="درجة ثبات الذاكرة والإتقان" 
                stroke={scoreColor} 
                strokeWidth={3} 
                dot={{ r: 5, fill: scoreColor }}
                activeDot={{ r: 8 }}
                unit="%"
              />
            </LineChart>
          )}

          {viewMode === 'weekly' && (
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="pagesMemorized" name="الحفظ الجديد (صفحات)" fill={primaryColor} radius={[6, 6, 0, 0]} unit=" صفحة" />
              <Bar dataKey="pagesReviewed" name="المراجعة والتثبيت (صفحات)" fill={secondaryColor} radius={[6, 6, 0, 0]} unit=" صفحة" />
            </BarChart>
          )}

          {viewMode === 'fortresses' && (
            <PieChart>
              <Pie
                data={fortressData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {fortressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Motivational Footer Note */}
      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'var(--primary-light)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
          <Award size={18} />
          <span>تنبيه الخطة الشخصية: أنت على بعد 3 صفحات فقط لإتمام تحدي هذا الأسبوع بنجاح! 🌟</span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          هدفك اليومي الحالي: <strong>{user?.preferences?.dailyTarget || 'صفحة واحدة يومياً'}</strong>
        </span>
      </div>
    </Card>
  );
};
