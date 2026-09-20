import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ChevronLeft, 
  BookOpen, 
  Flame,
  Award
} from 'lucide-react';
import { getSurahMemorizationStats } from '../../lib/portfolioService';

export const QuranMapSurahCard = ({ surah, portfolio, onSelectSurah }) => {
  const stats = getSurahMemorizationStats(surah.number, surah.numberOfAyahs, portfolio);

  // Status configuration
  let statusColor = '#94A3B8'; // default gray
  let statusBg = 'rgba(148, 163, 184, 0.12)';
  let statusText = 'لم تبدأ';
  let badgeIcon = '⚪';

  if (stats.percent === 100) {
    statusColor = '#10B981';
    statusBg = 'rgba(16, 185, 129, 0.12)';
    statusText = 'متقنة بالكامل';
    badgeIcon = '🟢';
  } else if (stats.reviewCount > 0) {
    statusColor = '#EF4444';
    statusBg = 'rgba(239, 68, 68, 0.12)';
    statusText = 'بحاجة لمراجعة';
    badgeIcon = '🔴';
  } else if (stats.memorizedCount > 0 || stats.learningCount > 0) {
    statusColor = '#F59E0B';
    statusBg = 'rgba(245, 158, 11, 0.12)';
    statusText = `قيد الحفظ (${stats.percent}%)`;
    badgeIcon = '🟡';
  }

  return (
    <div
      onClick={() => onSelectSurah(surah)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${stats.percent === 100 ? 'rgba(16, 185, 129, 0.35)' : 'var(--glass-border)'}`,
        borderRadius: '18px',
        padding: '18px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: stats.percent === 100 ? '0 4px 15px rgba(16, 185, 129, 0.08)' : 'var(--shadow-soft)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = stats.percent === 100 ? 'rgba(16, 185, 129, 0.35)' : 'var(--glass-border)';
      }}
    >
      {/* Top Bar: Number + Name + Type */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Surah Number Medallion */}
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: stats.percent === 100 ? 'var(--primary)' : 'var(--bg-color)',
            color: stats.percent === 100 ? 'white' : 'var(--primary)',
            border: `1px solid ${stats.percent === 100 ? 'var(--primary)' : 'var(--glass-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {surah.number}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                سورة {surah.cleanName}
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {surah.revelationType} • الجزء {surah.juz} • ص {surah.startPage}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span style={{
          padding: '4px 10px',
          borderRadius: '20px',
          background: statusBg,
          color: statusColor,
          fontSize: '11px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {badgeIcon} {statusText}
        </span>
      </div>

      {/* Progress & Metric Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            المحفوظ: <strong style={{ color: 'var(--text-primary)' }}>{stats.memorizedCount}</strong> من {surah.numberOfAyahs} آية
          </span>
          <span style={{ fontWeight: 'bold', color: statusColor }}>
            {stats.percent}%
          </span>
        </div>

        {/* Visual Progress Line */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'var(--bg-color)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{
            width: `${stats.percent}%`,
            height: '100%',
            background: stats.percent === 100 
              ? '#10B981' 
              : (stats.percent > 0 ? 'linear-gradient(90deg, #F59E0B, #10B981)' : 'transparent'),
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Footer Info & Quick Link */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: '1px dashed var(--glass-border)',
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {stats.totalRepetitions > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F59E0B' }}>
              <Flame size={12} /> {stats.totalRepetitions}x تكرار
            </span>
          )}
          {stats.avgScore > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10B981' }}>
              <Award size={12} /> {stats.avgScore}% إتقان
            </span>
          )}
        </div>

        <span style={{
          color: 'var(--primary)',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          عرض الآيات <ChevronLeft size={13} />
        </span>
      </div>

    </div>
  );
};
