import React from 'react';
import { BookOpen, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { useUiConfiguration } from '../lib/uiConfiguration';
import { getNavigation, isNavItemActive } from '../lib/navigation';

/** Desktop / tablet sidebar. Mobile uses BottomNavBar + MoreToolsModal instead. */
export const Sidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed, onOpenProfile }) => {
  const { user, activeRole } = useAuth();
  const { lang, isRTL } = useLanguage();
  const { configuration } = useUiConfiguration();

  const userRole = activeRole || 'user';
  const roleLabels = lang === 'ar'
    ? { user: 'طالب', teacher: 'معلم', admin: 'إداري' }
    : { user: 'Student', teacher: 'Teacher', admin: 'Admin' };
  const { sections } = getNavigation(userRole, lang, configuration);

  const positionStyles = isRTL
    ? { right: 0, borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }
    : { left: 0, borderRight: '1px solid rgba(255, 255, 255, 0.08)' };
  const ExpandIcon = (collapsed !== isRTL) ? ChevronsRight : ChevronsLeft;

  return (
    <aside
      id="app-main-sidebar"
      className="app-main-sidebar"
      style={{
        width: collapsed ? '76px' : '248px',
        height: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        zIndex: 50,
        transition: 'width 0.25s ease',
        userSelect: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...positionStyles
      }}
    >
      {/* Brand + collapse */}
      <div style={{
        height: '64px',
        padding: collapsed ? 0 : '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={18} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800 }}>
              سَفَر <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>Safar</span>
            </span>
          </div>
        )}
        <button
          id="sidebar-collapse-toggle"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            borderRadius: '8px'
          }}
          aria-label={collapsed
            ? (lang === 'ar' ? 'توسيع القائمة الجانبية' : 'Expand sidebar')
            : (lang === 'ar' ? 'طي القائمة الجانبية' : 'Collapse sidebar')}
        >
          <ExpandIcon size={18} />
        </button>
      </div>

      {/* Sections */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {sections.map(section => (
          <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {!collapsed && sections.length > 1 && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', padding: '4px 12px' }}>
                {section.title}
              </div>
            )}
            {section.items.map(entry => {
              const Icon = entry.icon;
              const isActive = isNavItemActive(entry.id, activeTab);
              return (
                <button
                  key={entry.id}
                  id={`sidebar-nav-${entry.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? entry.label : undefined}
                  onClick={() => setActiveTab?.(entry.id)}
                  style={{
                    width: '100%',
                    minHeight: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '10px 0' : '10px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                    color: isActive ? '#34D399' : '#CBD5E1',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    textAlign: 'start'
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{entry.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: collapsed ? '8px' : '10px 14px', display: 'flex', justifyContent: 'center' }}>
        <PWAInstallButton collapsed={collapsed} />
      </div>

      {/* Account */}
      <button
        id="sidebar-user-profile-card"
        onClick={() => onOpenProfile?.()}
        title={lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '10px',
          padding: collapsed ? '12px 8px' : '14px 16px',
          border: 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0B1120',
          color: 'inherit',
          cursor: 'pointer',
          textAlign: 'start',
          minWidth: 0
        }}
      >
        <img
          data-testid="sidebar-profile-photo"
          src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'}
          alt=""
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10B981', flexShrink: 0 }}
        />
        {!collapsed && (
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'مستخدم سَفَر'}
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{roleLabels[userRole]}</span>
          </span>
        )}
      </button>
    </aside>
  );
};
