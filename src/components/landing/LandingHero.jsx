import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Mic, 
  BrainCircuit, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  Play, 
  Flame, 
  Volume2, 
  Award,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingHero = ({ onOpenAuth, onDemoLogin }) => {
  const { isRTL, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeChip, setActiveChip] = useState('recitation');

  return (
    <section style={{
      position: 'relative',
      padding: '70px 0 90px',
      overflow: 'hidden',
      background: 'radial-gradient(100% 50% at 50% 0%, var(--primary-light) 0%, var(--bg-color) 80%)'
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(60px)',
        opacity: 0.6
      }} />

      <div style={{
        position: 'absolute',
        bottom: '50px',
        left: '5%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(217, 119, 6, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(50px)',
        opacity: 0.5
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          
          {/* Left Column: Hero Copy & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Top Badge */}
            <div className="badge-modern" style={{ marginBottom: '20px' }}>
              <Sparkles size={15} />
              <span>{isRTL ? 'المنظومة الذكية المتكاملة لحفظ وإتقان القرآن الكريم' : 'AI-Powered Smart Quran Memorization Platform'}</span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(28px, 4.5vw, 48px)',
              lineHeight: 1.25,
              fontWeight: 900,
              color: 'var(--text-primary)',
              marginBottom: '18px',
              letterSpacing: '-0.03em'
            }}>
              {isRTL ? 'احفظ القرآن الكريم بثباتٍ وإتقان' : 'Memorize the Holy Quran with Precision'}{' '}
              <span className="text-gradient" style={{ display: 'block' }}>
                {isRTL ? 'بالذكاء الاصطناعي والخطة الخماسية' : 'Powered by Voice AI & Five Fortresses'}
              </span>
            </h1>

            {/* Spiritual Dedication Card */}
            <div style={{
              padding: '14px 20px',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--primary-border)',
              borderRight: isRTL ? '4px solid var(--primary)' : '1px solid var(--primary-border)',
              borderLeft: !isRTL ? '4px solid var(--primary)' : '1px solid var(--primary-border)',
              boxShadow: 'var(--shadow-soft)',
              marginBottom: '22px',
              maxWidth: '540px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 800,
                color: 'var(--primary)',
                fontFamily: isRTL ? 'serif' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{isRTL ? '« مَا كَانَ لِلَّهِ يَبْقَى وَمَا كَانَ لِغَيْرِهِ يَنْدَثِرُ ، اللَّهُمَّ تَقَبَّلْ »' : '« Dedicated solely for the sake of Allah »'}</span>
                <span>🌿</span>
              </p>
            </div>

            {/* Subtitle */}
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '30px',
              maxWidth: '540px'
            }}>
              {isRTL 
                ? 'تجربة إيمانية فريدة تجمع بين التسميع الصوتي اللحظي الفوري، خرائط السور الذهنية، ومنهجية الحصون الخمسة لتثبيت المحفوظ وضمان عدم النسيان بإذن الله.'
                : 'A blessed experience blending real-time voice recitation analysis, thematic mind maps, and the 5-Fortresses method to ensure permanent Quran retention.'}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px var(--primary-glow)',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span>{isRTL ? 'متابعة لوحة الحفظ اليومية' : 'Open Memorization Dashboard'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('signup')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px 26px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                      color: 'white',
                      border: 'none',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px var(--primary-glow)',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <span>{isRTL ? 'ابدأ رحلتك مجاناً 🚀' : 'Get Started Free 🚀'}</span>
                    {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                  </button>

                  <button
                    onClick={onDemoLogin}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 22px',
                      borderRadius: '14px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-soft)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Zap size={16} color="var(--primary)" />
                    <span>{isRTL ? 'تجربة سريعة بدون تسجيل ⚡' : 'Quick Demo (No Signup) ⚡'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Quick Feature Pillars Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)'
            }}>
              {[
                { icon: Mic, text: isRTL ? 'تسميع صوتي ذكي' : 'Smart Voice AI' },
                { icon: ShieldCheck, text: isRTL ? 'خطة الحصون الـ 5' : '5-Fortresses Plan' },
                { icon: BrainCircuit, text: isRTL ? 'خرائط ذهنية للآيات' : 'Mind Maps' },
                { icon: CheckCircle2, text: isRTL ? 'مصحف مرمز ملون' : 'Color Coded Mushaf' }
              ].map((pill, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <pill.icon size={15} color="var(--primary)" />
                  <span>{pill.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Interactive App Preview Showcase Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ position: 'relative' }}
          >
            {/* Outer Frame with Glass Effect */}
            <div style={{
              padding: '16px',
              borderRadius: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Inner Mockup Container */}
              <div style={{
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                background: 'var(--bg-color)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <img
                  src="/quran_holy_book.jpg"
                  alt="المصحف الشريف ومنظومة محفظ الذكية"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '460px',
                    objectFit: 'cover'
                  }}
                />

                {/* Gradient Overlay for Clean Integration */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 17, 26, 0.85) 0%, rgba(11, 17, 26, 0.1) 60%, transparent 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Floating Interactive Badge 1 (Voice AI Recitation Active) */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: isRTL ? '20px' : 'auto',
                    left: !isRTL ? '20px' : 'auto',
                    background: 'rgba(11, 17, 26, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    color: 'white'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34D399'
                  }}>
                    <Mic size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>التسميع الصوتي اللحظي</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>دقة الإتقان 99.4%</span>
                      <CheckCircle2 size={13} />
                    </div>
                  </div>
                </motion.div>

                {/* Floating Interactive Badge 2 (Five Fortresses Daily Wird) */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: isRTL ? '20px' : 'auto',
                    right: !isRTL ? '20px' : 'auto',
                    background: 'rgba(11, 17, 26, 0.88)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(217, 119, 6, 0.4)',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    color: 'white'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(217, 119, 6, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FBBF24'
                  }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>خطة الحصون الخمسة</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FBBF24' }}>
                      تم إنجاز ورد اليوم (+150 XP) 🔥
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
