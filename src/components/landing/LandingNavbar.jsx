import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft, ArrowRight, Sparkles, UserCheck, ShieldCheck, LogIn, LayoutDashboard, BookOpen } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ThemeToggle';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingNavbar = ({ onOpenAuth, onDemoLogin, onOpenDocs }) => {
  const { lang, setLang, t, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      width: '100%',
      zIndex: 100,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      transition: 'all 0.3s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        gap: '12px'
      }}>
        {/* Brand Logo & Name */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          <Logo size={34} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {isRTL ? 'مُحَفِّظ' : 'Ma7fath'} <span style={{ color: 'var(--primary)' }}>AI</span>
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '6px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)'
              }}>
                {isRTL ? 'الإصدار الذكي' : 'Smart AI'}
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginTop: '-1px' }}>
              {isRTL ? 'منظومة إتقان القرآن الكريم' : 'Quran Mastery Platform'}
            </span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }} className="nav-links-desktop">
          <a 
            href="#features" 
            style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {isRTL ? 'المميزات الذكية' : 'Features'}
          </a>
          <a 
            href="#showcase" 
            style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {isRTL ? 'استعراض المنصة' : 'Showcase'}
          </a>
          <a 
            href="#methodology" 
            style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {isRTL ? 'خطة الحصون الخمسة' : '5 Fortresses'}
          </a>
          <a 
            href="#faq" 
            style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
          </a>

          {/* Documentation Link */}
          <button
            onClick={onOpenDocs}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'color 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0
            }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <span>{isRTL ? 'توثيق المنصة 📚' : 'Documentation 📚'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Docs Quick Button */}
          <button
            onClick={onOpenDocs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '9px',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isRTL ? 'توثيق ودليل المنصة الشامل' : 'Platform Documentation'}
          >
            <BookOpen size={14} />
            <span>{isRTL ? 'التوثيق' : 'Docs'}</span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '9px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe size={14} color="var(--primary)" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle variant="pill" size="small" />

          {/* User Auth Buttons */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px var(--primary-glow)'
                }}
              >
                <LayoutDashboard size={14} />
                <span>{isRTL ? 'لوحة الحفظ' : 'Dashboard'}</span>
              </button>

              <button
                onClick={logout}
                style={{
                  padding: '7px 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isRTL ? 'خروج' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={onDemoLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                <Sparkles size={13} color="var(--primary)" />
                <span>{isRTL ? 'تجربة سريعة ⚡' : 'Quick Demo ⚡'}</span>
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px var(--primary-glow)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <UserCheck size={14} />
                <span>{isRTL ? 'ابدأ الآن' : 'Get Started'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
