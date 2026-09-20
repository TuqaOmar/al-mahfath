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
  Check, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/**
 * QuickSettingsMenu: Consolidates secondary tools and controls (Sound, Language, Cloud Sync, Docs, Pitch Deck)
 * into a single, elegant popover/menu, eliminating header icon clutter.
 */
export const QuickSettingsMenu = ({
  soundEnabled = true,
  toggleSound,
  isSyncing = false,
  handleRefresh,
  onOpenProfile,
  onOpenDocs,
  onOpenPresentation,
  isMobile = false
}) => {
  const { lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const triggerHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  };

  const toggleOpen = () => {
    triggerHaptic(14);
    setIsOpen(!isOpen);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        id="quick-settings-trigger-btn"
        onClick={toggleOpen}
        style={{
          width: isMobile ? '36px' : '38px',
          height: isMobile ? '36px' : '38px',
          borderRadius: '12px',
          background: isOpen ? 'var(--primary-light)' : 'var(--bg-surface)',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--glass-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 12px var(--primary-glow)' : 'none'
        }}
        title={isRTL ? 'الإعدادات والخيارات السريعة' : 'Quick Settings & Preferences'}
        aria-label={isRTL ? 'الإعدادات والخيارات السريعة' : 'Quick Settings'}
        aria-expanded={isOpen}
      >
        <Sliders size={17} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          id="quick-settings-dropdown"
          style={{
            position: 'absolute',
            top: isMobile ? '46px' : '48px',
            [isRTL ? 'left' : 'right']: 0,
            width: isMobile ? '280px' : '310px',
            backgroundColor: 'var(--bg-surface)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.1)',
            padding: '12px',
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {/* Header Title */}
          <div style={{
            padding: '4px 8px 8px 8px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'الإعدادات والخيارات السريعة' : 'Quick Settings'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isRTL ? 'تخصيص التجربة' : 'Preferences'}
            </span>
          </div>

          {/* 1. Cloud Sync Option */}
          <button
            id="menu-sync-btn"
            onClick={() => {
              triggerHaptic(15);
              if (handleRefresh) handleRefresh();
              setIsOpen(false);
            }}
            disabled={isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '12px',
              background: isSyncing ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-elevated)',
              border: '1px solid var(--glass-border)',
              cursor: isSyncing ? 'wait' : 'pointer',
              color: 'var(--text-primary)',
              transition: 'background 0.15s ease',
              width: '100%',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RefreshCw size={15} style={{ animation: isSyncing ? 'spin 0.75s linear infinite' : 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  {isRTL ? 'مزامنة الحفظ السحابي' : 'Cloud Sync Progress'}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {isSyncing ? (isRTL ? 'جاري المزامنة...' : 'Syncing...') : (isRTL ? 'تحديث فوري لبيانات التلاوة' : 'Instant progress sync')}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
              {isSyncing ? '...' : (isRTL ? 'مزامنة' : 'Sync')}
            </span>
          </button>

          {/* 2. Sound Effects Toggle Option */}
          <button
            id="menu-sound-toggle-btn"
            onClick={() => {
              triggerHaptic(12);
              if (toggleSound) toggleSound();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'background 0.15s ease',
              width: '100%',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                color: soundEnabled ? 'var(--primary)' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  {isRTL ? 'المؤثرات والنغمات التفاعلية' : 'Audio Feedback & Chimes'}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {soundEnabled ? (isRTL ? 'النغمات مفعلة' : 'Sound active') : (isRTL ? 'الأصوات مكتومة' : 'Muted')}
                </span>
              </div>
            </div>

            {/* Switch Pill */}
            <div style={{
              width: '38px',
              height: '22px',
              borderRadius: '11px',
              backgroundColor: soundEnabled ? 'var(--primary)' : 'var(--glass-border)',
              position: 'relative',
              transition: 'background-color 0.2s ease',
              padding: '2px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                transform: soundEnabled 
                  ? (isRTL ? 'translateX(-16px)' : 'translateX(16px)') 
                  : 'translateX(0)',
                transition: 'transform 0.2s ease'
              }} />
            </div>
          </button>

          {/* 3. Language Switch Option */}
          <button
            id="menu-language-btn"
            onClick={() => {
              triggerHaptic(12);
              setLang(lang === 'ar' ? 'en' : 'ar');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'background 0.15s ease',
              width: '100%',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Globe size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  {isRTL ? 'لغة الواجهة' : 'App Language'}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {lang === 'ar' ? 'العربية (Arabic)' : 'English (الإنجليزية)'}
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6'
            }}>
              {lang === 'ar' ? 'English' : 'عربي'}
            </span>
          </button>

          {/* 4. Presentation & Docs (Platform Resources) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginTop: '2px'
          }}>
            <button
              id="menu-deck-btn"
              onClick={() => {
                triggerHaptic(12);
                setIsOpen(false);
                if (onOpenPresentation) onOpenPresentation();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: 'var(--primary)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left'
              }}
            >
              <Presentation size={14} />
              <span>{isRTL ? 'عرض المنصة 📽️' : 'Deck 📽️'}</span>
            </button>

            <button
              id="menu-docs-btn"
              onClick={() => {
                triggerHaptic(12);
                setIsOpen(false);
                if (onOpenDocs) onOpenDocs();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: '#3B82F6',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left'
              }}
            >
              <BookOpen size={14} />
              <span>{isRTL ? 'دليل التوثيق 📚' : 'Docs 📚'}</span>
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

          {/* 5. Account & Profile Action */}
          <button
            id="menu-profile-btn"
            onClick={() => {
              triggerHaptic(12);
              setIsOpen(false);
              if (onOpenProfile) onOpenProfile();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              width: '100%',
              textAlign: isRTL ? 'right' : 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={16} color="var(--primary)" />
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                {isRTL ? 'الملف الشخصي وتعديل الحساب' : 'My Profile & Account'}
              </span>
            </div>
            {isRTL ? <ChevronLeft size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
          </button>

          {/* 6. Logout */}
          <button
            id="menu-logout-btn"
            onClick={() => {
              triggerHaptic(14);
              setIsOpen(false);
              if (logout) logout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: 'none',
              cursor: 'pointer',
              color: '#EF4444',
              width: '100%',
              textAlign: isRTL ? 'right' : 'left',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <LogOut size={15} />
            <span>{isRTL ? 'تسجيل الخروج' : 'Log Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
