import React from 'react';
import { 
  Home, 
  Compass, 
  PlayCircle, 
  ShieldCheck, 
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BottomNavBar = ({ activeTab, setActiveTab, onOpenMore }) => {
  const { lang, isRTL } = useLanguage();

  const primaryTabs = [
    { id: 'home', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
    { id: 'daily-session', label: lang === 'ar' ? 'التسميع' : 'Recite', icon: PlayCircle },
    { id: 'quran-map', label: lang === 'ar' ? 'الخريطة' : 'Map', icon: Compass },
    { id: 'five-fortresses', label: lang === 'ar' ? 'الحصون' : 'Fortresses', icon: ShieldCheck },
    { id: 'ai-assistant', label: lang === 'ar' ? 'المعلم' : 'AI Guide', icon: Sparkles }
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--glass-border)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
        padding: '0 8px env(safe-area-inset-bottom, 0px) 8px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      aria-label="Mobile Navigation Bar"
    >
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`mobile-nav-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              height: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '6px 0',
              position: 'relative'
            }}
          >
            {isActive && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '32px',
                  height: '3px',
                  borderRadius: '0 0 4px 4px',
                  backgroundColor: 'var(--primary)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }} 
              />
            )}
            <div style={{
              width: '36px',
              height: '28px',
              borderRadius: '12px',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              lineHeight: 1.2,
              whiteSpace: 'nowrap'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* More / Additional tools trigger */}
      <button
        id="mobile-nav-more"
        onClick={onOpenMore}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          height: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: ['mind-maps', 'similarities', 'community', 'achievements', 'analytics', 'my-plan'].includes(activeTab) 
            ? 'var(--primary)' 
            : 'var(--text-secondary)',
          transition: 'all 0.2s ease',
          padding: '6px 0',
          position: 'relative'
        }}
      >
        {['mind-maps', 'similarities', 'community', 'achievements', 'analytics', 'my-plan'].includes(activeTab) && (
          <span 
            style={{
              position: 'absolute',
              top: 0,
              width: '32px',
              height: '3px',
              borderRadius: '0 0 4px 4px',
              backgroundColor: 'var(--primary)'
            }} 
          />
        )}
        <div style={{
          width: '36px',
          height: '28px',
          borderRadius: '12px',
          background: ['mind-maps', 'similarities', 'community', 'achievements', 'analytics', 'my-plan'].includes(activeTab) 
            ? 'var(--primary-light)' 
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LayoutGrid size={20} strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          {lang === 'ar' ? 'المزيد' : 'More'}
        </span>
      </button>
    </nav>
  );
};
