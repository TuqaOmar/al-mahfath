import React from 'react';
import { Globe, UserCheck, LayoutDashboard } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ThemeToggle';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingNavbar = ({ onOpenAuth }) => {
  const { lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { href: '#features', label: isRTL ? 'المميزات' : 'Features' },
    { href: '#method', label: isRTL ? 'الحصون الخمسة' : 'Five Fortresses' },
    { href: '#faq', label: isRTL ? 'الأسئلة الشائعة' : 'FAQ' }
  ];

  const smallButton = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      width: '100%',
      zIndex: 100,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div className="container landing-navbar__inner" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        gap: '12px'
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <Logo size={32} showText={false} />
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isRTL ? 'المُحَفِّظ' : 'Al-Mahfath'}{' '}
            <span style={{ color: 'var(--primary)' }}>{isRTL ? 'الإلكتروني' : 'Electronic'}</span>
          </span>
        </a>

        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {links.map(link => (
            <a key={link.href} href={link.href} className="lp-nav-link">{link.label}</a>
          ))}
        </div>

        <div className="landing-navbar__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            id="landing-language-toggle"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{ ...smallButton, padding: '8px 10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            aria-label={isRTL ? 'التبديل إلى اللغة الإنجليزية' : 'Switch to Arabic'}
          >
            <Globe size={14} color="var(--primary)" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <ThemeToggle variant="icon" size="small" />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => navigate('/dashboard')} style={{ ...smallButton, background: 'var(--primary)', color: '#fff', border: 'none' }}>
                <LayoutDashboard size={14} />
                <span>{isRTL ? 'لوحة الحفظ' : 'Dashboard'}</span>
              </button>
              <button onClick={logout} style={{ ...smallButton, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)' }}>
                {isRTL ? 'خروج' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => onOpenAuth('signup')} style={{ ...smallButton, background: 'var(--primary)', color: '#fff', border: 'none' }}>
                <UserCheck size={14} />
                <span>{isRTL ? 'ابدأ الآن' : 'Get Started'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="nav-links-mobile" aria-label={isRTL ? 'أقسام الصفحة' : 'Page sections'}>
          {links.map(link => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </div>
      </div>
    </nav>
  );
};
