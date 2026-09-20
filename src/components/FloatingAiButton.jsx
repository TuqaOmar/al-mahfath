import React, { useState, useEffect } from 'react';
import { Sparkles, X, Bot, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AiAssistant } from './AiAssistant';

/**
 * Floating Action Button (FAB) and Floating Drawer/Widget for "المعلم القرآني الذكي" (AI Assistant)
 * Accessible from any tab across the application with one tap.
 */
export const FloatingAiButton = ({
  activeTab = 'home',
  id = 'floating-ai-teacher-btn'
}) => {
  const { lang, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for global custom events to open the AI Assistant
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-teacher', handleOpen);
    return () => window.removeEventListener('open-ai-teacher', handleOpen);
  }, []);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  // Only show floating button on mobile/tablet devices, and not when already on the full 'ai-assistant' tab
  if (!isMobile || activeTab === 'ai-assistant') {
    return null;
  }

  // Handle haptic feedback
  const triggerHaptic = (ms = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  };

  const toggleOpen = () => {
    triggerHaptic(18);
    setIsOpen(!isOpen);
  };

  // Compute bottom positioning to avoid colliding with Mobile BottomNavBar or Quran Action Dock
  const getBottomOffset = () => {
    if (!isMobile) return '28px';
    // On the recitation page with floating dock, elevate FAB slightly
    if (activeTab === 'daily-session') {
      return 'calc(136px + env(safe-area-inset-bottom, 0px))';
    }
    return 'calc(74px + env(safe-area-inset-bottom, 0px))';
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div
        style={{
          position: 'fixed',
          bottom: getBottomOffset(),
          [isRTL ? 'left' : 'right']: isMobile ? '16px' : '28px',
          zIndex: 95,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'auto',
          transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <button
          id={id}
          onClick={toggleOpen}
          style={{
            height: isMobile ? '52px' : '52px',
            minWidth: isMobile ? '52px' : 'auto',
            padding: isMobile ? '0 15px' : '0 18px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            boxShadow: isOpen
              ? '0 12px 30px rgba(99, 102, 241, 0.5), 0 2px 10px rgba(16, 185, 129, 0.4)'
              : '0 8px 25px rgba(16, 185, 129, 0.42), 0 2px 8px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '13px',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
            transform: isOpen ? 'scale(0.96)' : 'scale(1)',
            position: 'relative'
          }}
          title={isRTL ? 'اسأل المعلم القرآني الذكي' : 'Ask Quran AI Teacher'}
          aria-label={isRTL ? 'المعلم القرآني الذكي' : 'Quran AI Guide'}
        >
          {/* Animated active pulse indicator */}
          {!isOpen && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                [isRTL ? 'right' : 'left']: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#34D399',
                border: '2px solid #FFFFFF',
                boxShadow: '0 0 8px #34D399'
              }}
            />
          )}

          {isOpen ? (
            <X size={22} strokeWidth={2.5} />
          ) : (
            <Sparkles size={20} strokeWidth={2.2} />
          )}

          <span>
            {isOpen
              ? (isRTL ? 'إغلاق' : 'Close')
              : (isRTL ? 'المعلم الذكي' : 'AI Guide')}
          </span>
        </button>
      </div>

      {/* Floating Assistant Sheet / Window */}
      {isOpen && (
        <>
          {/* Backdrop for Mobile */}
          {isMobile && (
            <div
              id="floating-ai-backdrop"
              onClick={() => {
                triggerHaptic(12);
                setIsOpen(false);
              }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                zIndex: 96,
                animation: 'fadeIn 0.2s ease'
              }}
            />
          )}

          {/* Assistant Modal / Bottom Sheet */}
          <div
            id="floating-ai-modal-container"
            style={{
              position: 'fixed',
              zIndex: 97,
              ...(isMobile
                ? {
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '86vh',
                    maxHeight: '760px',
                    borderRadius: '26px 26px 0 0',
                    borderTop: '1.5px solid var(--primary-border)',
                    boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.35)'
                  }
                : {
                    bottom: '90px',
                    [isRTL ? 'left' : 'right']: '28px',
                    width: '490px',
                    height: '640px',
                    maxHeight: 'calc(100vh - 120px)',
                    borderRadius: '24px',
                    border: '1.5px solid var(--primary-border)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.28), 0 0 25px rgba(16, 185, 129, 0.15)'
                  }),
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Sheet Handle for Mobile */}
            {isMobile && (
              <div
                style={{
                  width: '100%',
                  padding: '8px 0 4px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'grab'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '4px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--glass-border)'
                  }}
                />
              </div>
            )}

            {/* Floating Sheet Header */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.04))'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '14.5px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isRTL ? 'المعلم القرآني الذكي' : 'Quran AI Guide'}
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--primary)',
                        fontWeight: 700
                      }}
                    >
                      {isRTL ? 'جاهز للمساعدة' : 'Active'}
                    </span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {isRTL ? 'استفسر عن أي آية، متشابهات، أو خطة الحفظ' : 'Ask about any ayah, tafsir, or memorization plan'}
                  </p>
                </div>
              </div>

              <button
                id="floating-ai-close-btn"
                onClick={() => {
                  triggerHaptic(12);
                  setIsOpen(false);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={isRTL ? 'إغلاق النافذة' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Assistant Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <AiAssistant isFloating={true} onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
};
