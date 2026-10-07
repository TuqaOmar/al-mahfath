import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Globe,
  Volume2,
  VolumeX,
  RefreshCw,
  BookOpen,
  Presentation,
  User,
  LogOut,
  Moon,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Switch = ({ on, isRTL }) => (
  <span aria-hidden="true" style={{
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: on ? 'var(--primary)' : 'var(--glass-border)',
    padding: '2px',
    boxSizing: 'border-box',
    flexShrink: 0,
    transition: 'background-color 0.2s ease'
  }}>
    <span style={{
      display: 'block',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: '#FFFFFF',
      transform: on ? `translateX(${isRTL ? -16 : 16}px)` : 'none',
      transition: 'transform 0.2s ease'
    }} />
  </span>
);

/**
 * The single settings / account menu for web and mobile.
 * Holds every secondary control so the top bar stays clean.
 */
export const QuickSettingsMenu = ({
  soundEnabled = true,
  toggleSound,
  isSyncing = false,
  handleRefresh,
  onOpenProfile,
  onOpenDocs,
  onOpenPresentation,
  onDeleteAccount,
  isMobile = false
}) => {
  const { lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const run = (action, { close = true } = {}) => () => {
    if (navigator?.vibrate) {
      try { navigator.vibrate(10); } catch (e) {}
    }
    if (close) setIsOpen(false);
    action?.();
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: '44px',
    padding: '8px 10px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: '13.5px',
    fontWeight: 600,
    textAlign: 'start'
  };
  const divider = <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 6px' }} />;
  const ar = lang === 'ar';

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        id="quick-settings-trigger-btn"
        onClick={run(() => setIsOpen(open => !open), { close: false })}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: isOpen ? 'var(--primary-light)' : 'transparent',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        title={ar ? 'الإعدادات' : 'Settings'}
        aria-label={ar ? 'الإعدادات' : 'Settings'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div
          id="quick-settings-dropdown"
          role="menu"
          style={{
            position: 'absolute',
            top: '48px',
            insetInlineEnd: 0,
            width: isMobile ? 'min(280px, calc(100vw - 24px))' : '280px',
            maxHeight: 'calc(100dvh - 72px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
            padding: '6px',
            zIndex: 110,
            boxSizing: 'border-box',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ padding: '8px 10px 10px', minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || (ar ? 'حسابي' : 'My account')}
            </div>
            {user?.email && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            )}
          </div>

          <button id="menu-profile-btn" role="menuitem" style={rowStyle} onClick={run(onOpenProfile)}>
            <User size={18} color="var(--text-secondary)" />
            <span>{ar ? 'الملف الشخصي' : 'Profile'}</span>
          </button>

          {divider}

          <button
            id="menu-theme-btn"
            className="mobile-theme-toggle"
            role="menuitemcheckbox"
            aria-checked={isDark}
            aria-pressed={isDark}
            style={rowStyle}
            onClick={run(toggleTheme, { close: false })}
          >
            <Moon size={18} color="var(--text-secondary)" />
            <span style={{ flex: 1 }}>{ar ? 'الوضع الليلي' : 'Dark mode'}</span>
            <Switch on={isDark} isRTL={isRTL} />
          </button>

          <button
            id="menu-sound-toggle-btn"
            role="menuitemcheckbox"
            aria-checked={soundEnabled}
            style={rowStyle}
            onClick={run(toggleSound, { close: false })}
          >
            {soundEnabled ? <Volume2 size={18} color="var(--text-secondary)" /> : <VolumeX size={18} color="var(--text-secondary)" />}
            <span style={{ flex: 1 }}>{ar ? 'الأصوات' : 'Sounds'}</span>
            <Switch on={soundEnabled} isRTL={isRTL} />
          </button>

          <button
            id="menu-language-btn"
            role="menuitem"
            style={rowStyle}
            onClick={run(() => setLang(ar ? 'en' : 'ar'), { close: false })}
          >
            <Globe size={18} color="var(--text-secondary)" />
            <span style={{ flex: 1 }}>{ar ? 'اللغة' : 'Language'}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
              {ar ? 'English' : 'عربي'}
            </span>
          </button>

          <button
            id="menu-sync-btn"
            data-testid="dashboard-refresh"
            role="menuitem"
            disabled={isSyncing}
            style={{ ...rowStyle, cursor: isSyncing ? 'wait' : 'pointer' }}
            onClick={run(async () => {
              // Dashboard displays the failure and rethrows for pull-to-refresh.
              try { await handleRefresh?.(); } catch (error) {}
            })}
          >
            <RefreshCw size={18} color="var(--text-secondary)" style={{ animation: isSyncing ? 'spin 0.75s linear infinite' : 'none' }} />
            <span>{isSyncing ? (ar ? 'جاري التحديث...' : 'Refreshing...') : (ar ? 'تحديث بيانات الحساب' : 'Refresh account')}</span>
          </button>

          {(onOpenDocs || onOpenPresentation) && divider}

          {onOpenDocs && (
            <button id="menu-docs-btn" role="menuitem" style={rowStyle} onClick={run(onOpenDocs)}>
              <BookOpen size={18} color="var(--text-secondary)" />
              <span>{ar ? 'دليل المنصة' : 'Help & docs'}</span>
            </button>
          )}
          {onOpenPresentation && (
            <button id="menu-presentation-btn" role="menuitem" style={rowStyle} onClick={run(onOpenPresentation)}>
              <Presentation size={18} color="var(--text-secondary)" />
              <span>{ar ? 'عن المنصة' : 'About Safar'}</span>
            </button>
          )}

          {divider}

          <button id="menu-logout-btn" role="menuitem" style={rowStyle} onClick={run(logout)}>
            <LogOut size={18} color="var(--text-secondary)" />
            <span>{ar ? 'تسجيل الخروج' : 'Log out'}</span>
          </button>

          {onDeleteAccount && (
            <button id="menu-delete-account-btn" role="menuitem" style={{ ...rowStyle, color: '#EF4444' }} onClick={run(onDeleteAccount)}>
              <Trash2 size={18} />
              <span>{ar ? 'حذف الحساب' : 'Delete account'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
