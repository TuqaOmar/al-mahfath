import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingFooter = ({ onOpenAuth, onOpenDocs }) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <footer>
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="lp-cta">
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, color: '#fff' }}>
              {isRTL ? 'ابدأ وردك اليوم' : 'Start your daily portion today'}
            </h2>
            <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
              {isRTL ? 'دقيقة واحدة لإنشاء حسابك وخطتك الأولى.' : 'It takes a minute to create your account and first plan.'}
            </p>
            <button
              className="lp-btn lp-btn--light"
              onClick={() => (user ? navigate('/dashboard') : onOpenAuth('signup'))}
            >
              <span>{user ? (isRTL ? 'متابعة لوحة الحفظ' : 'Open my dashboard') : (isRTL ? 'أنشئ حسابك' : 'Create your account')}</span>
              <Arrow size={18} />
            </button>
          </div>
        </div>
      </section>

      <div style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="container lp-footer-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size={26} showText={false} />
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'المُحَفِّظ الإلكتروني' : 'Al-Mahfath Electronic'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isRTL ? 'صُنع لخدمة القرآن الكريم، اللهم تقبّل' : 'Made to serve the Holy Quran'} · © {new Date().getFullYear()}
          </p>
          <button className="lp-nav-link" onClick={onOpenDocs} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}>
            {isRTL ? 'دليل المنصة' : 'Platform guide'}
          </button>
        </div>
      </div>
    </footer>
  );
};
