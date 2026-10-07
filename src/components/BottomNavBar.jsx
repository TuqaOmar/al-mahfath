import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useUiConfiguration } from '../lib/uiConfiguration';
import { getNavigation, isNavItemActive } from '../lib/navigation';

const haptic = () => {
  if (navigator?.vibrate) {
    try { navigator.vibrate(12); } catch (e) { /* ignore */ }
  }
};

const NavButton = ({ id, label, icon: Icon, isActive, onClick }) => (
  <button
    id={id}
    className="mobile-bottom-navigation__item"
    onClick={() => { haptic(); onClick(); }}
    style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      height: '100%',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
      transition: 'color 0.15s ease',
      padding: '4px 0',
      touchAction: 'manipulation'
    }}
    aria-current={isActive ? 'page' : undefined}
    aria-label={label}
  >
    <span style={{
      width: '48px',
      height: '28px',
      borderRadius: '14px',
      background: isActive ? 'var(--primary-light)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s ease'
    }}>
      <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
    </span>
    <span className="mobile-bottom-navigation__label" style={{
      fontSize: '11px',
      fontWeight: isActive ? 700 : 500,
      lineHeight: 1.1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%'
    }}>
      {label}
    </span>
  </button>
);

// `hidden`: slide away while the on-screen keyboard is open so it never sits on top of a text field.
export const BottomNavBar = ({ activeTab, setActiveTab, onOpenMore, isMoreOpen = false, hidden = false }) => {
  const { lang } = useLanguage();
  const { activeRole } = useAuth();
  const { configuration } = useUiConfiguration();

  const { primary, sections } = getNavigation(activeRole || 'user', lang, configuration);
  const allItems = sections.flatMap(section => section.items);
  const navTabs = primary.map(id => allItems.find(entry => entry.id === id)).filter(Boolean);
  const isMoreActive = isMoreOpen || !navTabs.some(tab => isNavItemActive(tab.id, activeTab));

  return (
    <nav
      id="mobile-bottom-navigation"
      className="mobile-bottom-navigation"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 90,
        transform: hidden ? 'translateY(100%)' : 'none',
        visibility: hidden ? 'hidden' : 'visible',
        transition: hidden ? 'transform 0.18s ease, visibility 0s 0.18s' : 'transform 0.18s ease',
        padding: '0 4px env(safe-area-inset-bottom, 0px) 4px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        boxSizing: 'border-box'
      }}
      aria-label={lang === 'ar' ? 'التنقل بين أقسام المنصة' : 'Section navigation'}
    >
      {navTabs.map(tab => (
        <NavButton
          key={tab.id}
          id={`mobile-nav-${tab.id}`}
          label={tab.shortLabel}
          icon={tab.icon}
          isActive={!isMoreOpen && isNavItemActive(tab.id, activeTab)}
          onClick={() => setActiveTab(tab.id)}
        />
      ))}
      <NavButton
        id="mobile-nav-more-tools"
        label={lang === 'ar' ? 'المزيد' : 'More'}
        icon={LayoutGrid}
        isActive={isMoreActive}
        onClick={() => onOpenMore?.()}
      />
    </nav>
  );
};
