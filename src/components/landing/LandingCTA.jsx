import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingCTA = ({ onOpenAuth, onDemoLogin }) => {
  const { isRTL } = useLanguage();

  return (
    <section style={{
      padding: '80px 0 100px',
      background: 'var(--bg-color)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        <div style={{
          padding: '60px 40px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 24px 60px -12px rgba(6, 78, 59, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          
          {/* Subtle background decorative shapes */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px', margin: '0 auto' }}>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              <Sparkles size={15} color="#FBBF24" />
              <span>{isRTL ? '« خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ »' : '« The best of you are those who learn the Quran and teach it »'}</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              marginBottom: '18px',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              color: '#ffffff'
            }}>
              {isRTL ? 'ابدأ رحلتك المباركة مع القرآن الكريم اليوم' : 'Begin Your Blessed Quran Memorization Journey Today'}
            </h2>

            <p style={{
              fontSize: '17px',
              lineHeight: 1.7,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '36px'
            }}>
              {isRTL 
                ? 'سجّل مجاناً في ثوانٍ، ودع الذكاء الاصطناعي وخطة الحصون الخمسة يرافقانك خطوة بخطوة حتى تصل إلى الإتقان التام لآيات الذكر الحكيم.'
                : 'Join free in seconds. Let voice AI and the 5-Fortresses system guide you every single day until total Quranic mastery.'}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => onOpenAuth('signup')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  color: '#064E3B',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.25s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
                }}
              >
                <span>{isRTL ? 'ابدأ الحفظ الآن مجاناً 🚀' : 'Start Memorizing Free 🚀'}</span>
                {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>

              <button
                onClick={onDemoLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 26px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  fontSize: '15.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Zap size={16} color="#FBBF24" />
                <span>{isRTL ? 'دخول سريع تجريبي ⚡' : 'Quick Instant Demo ⚡'}</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
