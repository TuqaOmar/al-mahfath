import React from 'react';
import { Logo } from '../ui/Logo';
import { Heart, Sparkles, Shield, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingFooter = ({ onOpenDocs }) => {
  const { isRTL } = useLanguage();

  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--glass-border)',
      padding: '60px 0 30px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        
        {/* Top Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          paddingBottom: '48px',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          
          {/* Brand & Manifesto */}
          <div style={{ maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Logo size={36} />
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                {isRTL ? 'مُحَفِّظ' : 'Ma7fath'} <span style={{ color: 'var(--primary)' }}>AI</span>
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
              {isRTL 
                ? 'المنظومة الذكية الأولى المتكاملة لحفظ وإتقان القرآن الكريم، تجمع بين التسميع الصوتي اللحظي بالذكاء الاصطناعي وخطة الحصون الخمسة الراسخة.'
                : 'The premier smart platform for Quran memorization and mastery, combining real-time Voice AI recitation with the proven 5-Fortresses system.'}
            </p>

            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--primary)',
              fontFamily: 'serif'
            }}>
              {isRTL ? '« مَا كَانَ لِلَّهِ يَبْقَى ، اللَّهُمَّ تَقَبَّلْ » 🌿' : '« Dedicated solely for the sake of Allah » 🌿'}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {isRTL ? 'أقسام المنصة' : 'Platform Sections'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <a href="#showcase" style={{ transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {isRTL ? 'التسميع الصوتي الذكي' : 'Smart Voice Recitation'}
              </a>
              <a href="#showcase" style={{ transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {isRTL ? 'خريطة المصحف التفاعلية' : 'Quran Interactive Map'}
              </a>
              <a href="#showcase" style={{ transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {isRTL ? 'الخرائط الذهنية الموضوعية' : 'Thematic Mind Maps'}
              </a>
              <a href="#methodology" style={{ transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {isRTL ? 'خطة الحصون الخمسة' : 'Five Fortresses System'}
              </a>
              <button 
                onClick={onOpenDocs} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  textAlign: isRTL ? 'right' : 'left', 
                  cursor: 'pointer', 
                  color: '#3B82F6', 
                  fontWeight: 700, 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{isRTL ? 'توثيق ودليل المنصة الشامل 📚' : 'Platform Documentation 📚'}</span>
              </button>
            </div>
          </div>

          {/* Features Column */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {isRTL ? 'المميزات المتقدمة' : 'Key Capabilities'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span>🎙️ {isRTL ? 'تصحيح التلاوة الصوتي اللحظي' : 'Real-Time Voice Phoneme AI'}</span>
              <span>🔄 {isRTL ? 'كاشف المتشابهات اللفظية' : 'Similar Verses Identifier'}</span>
              <span>⏰ {isRTL ? 'التنبيهات اليومية المجدولة' : 'Daily Scheduled Reminders'}</span>
              <span>🏆 {isRTL ? 'مجتمع الحفاظ وأوسمة الإتقان' : 'Community Leaderboards & Badges'}</span>
            </div>
          </div>

          {/* Sincerity / Dedication Box */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {isRTL ? 'الوقف والإخلاص' : 'Dedication & Purpose'}
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isRTL 
                ? 'هذا العمل خالص لوجه الله الكريم، نسأل الله أن يتقبله صدقة جارية وينفع به كل قارئ وحافظ لكتاب الله في مشارق الأرض ومغاربها.'
                : 'Dedicated sincerely to serving the Holy Quran. May Allah accept it as an ongoing charity and benefit memorizers worldwide.'}
            </p>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '24px',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          <div>
            {isRTL ? 'جميع الحقوق محفوظة للأمة الإسلامية' : 'Open for the Ummah worldwide'} © {new Date().getFullYear()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{isRTL ? 'صُنع بإتقان وإخلاص لخدمة القرآن الكريم' : 'Crafted with devotion for the Holy Quran'}</span>
            <Heart size={14} color="#EF4444" fill="#EF4444" />
          </div>
        </div>

      </div>
    </footer>
  );
};
