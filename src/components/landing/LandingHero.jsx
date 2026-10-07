import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PWAInstallButton } from '../PWAInstallButton';

export const LandingHero = ({ onOpenAuth }) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const points = isRTL
    ? ['مجاني لوجه الله', 'يعمل على الجوال والكمبيوتر', 'بالعربية والإنجليزية']
    : ['Free, for the sake of Allah', 'Works on phone and desktop', 'Arabic and English'];

  return (
    <section id="top" className="lp-section" style={{ paddingTop: '56px' }}>
      <div className="container lp-hero-grid">
        <div>
          <p className="lp-dedication">
            {isRTL ? '«مَا كَانَ لِلَّهِ يَبْقَى»' : 'Made for the sake of Allah'}
          </p>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            lineHeight: 1.25,
            fontWeight: 800,
            margin: '0 0 18px',
            color: 'var(--text-primary)'
          }}>
            {isRTL ? 'احفظ القرآن الكريم ' : 'Memorize the Quran '}
            <span style={{ color: 'var(--primary)' }}>{isRTL ? 'بثباتٍ وإتقان' : 'with confidence'}</span>
          </h1>

          <p style={{ fontSize: '17px', lineHeight: 1.8, color: 'var(--text-secondary)', margin: '0 0 32px', maxWidth: '520px' }}>
            {isRTL
              ? 'ورد يومي بمنهج الحصون الخمسة، وتسميع صوتي يقارن تلاوتك بالمصحف كلمة بكلمة، ومتابعة مع معلمتك في الحلقة.'
              : 'A daily plan built on the Five Fortresses method, voice recitation checked word by word against the Mushaf, and follow-up with your teacher.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {user ? (
              <button className="lp-btn lp-btn--primary" onClick={() => navigate('/dashboard')}>
                <span>{isRTL ? 'متابعة لوحة الحفظ' : 'Open my dashboard'}</span>
                <Arrow size={18} />
              </button>
            ) : (
              <>
                <button className="lp-btn lp-btn--primary" onClick={() => onOpenAuth('signup')}>
                  <span>{isRTL ? 'ابدأ مجانًا' : 'Start free'}</span>
                  <Arrow size={18} />
                </button>
                <button className="lp-btn lp-btn--ghost" onClick={() => onOpenAuth('login')}>
                  {isRTL ? 'لدي حساب' : 'I have an account'}
                </button>
              </>
            )}
          </div>

          <div style={{ maxWidth: '320px', marginBottom: '24px' }}>
            <PWAInstallButton style={{ justifyContent: 'center' }} />
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
            {points.map(point => (
              <li key={point} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <Check size={16} color="var(--primary)" strokeWidth={3} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-hero-image">
          <img
            src="/quran_holy_book.jpg"
            alt={isRTL ? 'المصحف الشريف على حامل خشبي' : 'The Holy Quran on a wooden stand'}
          />
        </div>
      </div>
    </section>
  );
};
