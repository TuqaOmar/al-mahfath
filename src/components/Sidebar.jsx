import React, { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  Target, 
  ShieldAlert, 
  Bot, 
  Map, 
  Search, 
  Users, 
  Trophy, 
  BarChart3,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Sidebar = ({ activeTab, setActiveTab, collapsed: controlledCollapsed, setCollapsed: controlledSetCollapsed }) => {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  const setCollapsed = controlledSetCollapsed !== undefined ? controlledSetCollapsed : setLocalCollapsed;
  const { user } = useAuth();
  const { t, lang, isRTL } = useLanguage();

  const menuItems = [
    { id: 'home', label: t('sidebar_home'), icon: '🏠' },
    { id: 'quran-map', label: t('sidebar_quran_map'), icon: '📖' },
    { id: 'daily-session', label: t('sidebar_daily'), icon: '🎯' },
    { id: 'five-fortresses', label: t('sidebar_fortresses'), icon: '🏰' },
    { id: 'ai-assistant', label: t('sidebar_ai'), icon: '🤖' },
    { id: 'mind-maps', label: t('sidebar_mind_maps'), icon: '🗺️' },
    { id: 'similarities', label: t('sidebar_similarities'), icon: '🔍' },
    { id: 'community', label: t('sidebar_community'), icon: '👥' },
    { id: 'achievements', label: t('sidebar_achievements'), icon: '🏆' },
    { id: 'analytics', label: t('sidebar_analytics'), icon: '📊' }
  ];

  // Detect mobile view dynamically to set off-screen positioning
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = collapsed ? (isMobile ? '0px' : '80px') : '260px';
  const sidebarOffset = isMobile && collapsed ? '-260px' : '0';

  const userName = user?.name || 'احمد محمد';
  const firstLetter = userName.charAt(0);

  // Position based on RTL / LTR
  const positionStyles = isRTL 
    ? { right: sidebarOffset, left: 'auto', borderLeft: '1px solid #1E293B', borderRight: 'none' }
    : { left: sidebarOffset, right: 'auto', borderRight: '1px solid #1E293B', borderLeft: 'none' };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {isMobile && !collapsed && (
        <div 
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      <aside style={{
        width: sidebarWidth,
        height: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        zIndex: 50,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), right 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isRTL ? '-4px 0 24px rgba(0,0,0,0.25)' : '4px 0 24px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        ...positionStyles
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1E293B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              م
            </div>
            {!collapsed && (
              <span style={{
                fontSize: '20px',
                fontWeight: 'bold',
                letterSpacing: '-0.5px',
                color: '#FFFFFF'
              }}>
                {t('nav_dashboard')}
              </span>
            )}
          </div>

          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            title={collapsed ? (isRTL ? "توسيع القائمة" : "Expand Menu") : (isRTL ? "طوي القائمة" : "Collapse Menu")}
            onMouseOver={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
          >
            {collapsed 
              ? (isRTL ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />) 
              : (isRTL ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />)
            }
          </button>
        </div>

        {/* Menu Navigation Items */}
        <nav style={{
          flex: 1,
          padding: '16px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {(() => {
            const activeMenuItems = user?.role === 'admin' 
              ? [
                  { id: 'admin-panel', label: t('auth_admin'), icon: '🛡️' },
                  { id: 'community', label: t('sidebar_community'), icon: '👥' },
                  { id: 'ai-assistant', label: t('sidebar_ai'), icon: '🤖' }
                ]
              : menuItems;
            return activeMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab && setActiveTab(item.id);
                    if (isMobile) setCollapsed(true);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '12px 0' : '12px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' 
                      : 'transparent',
                    color: isActive ? '#34D399' : '#CBD5E1',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    position: 'relative',
                    borderRight: isActive && !collapsed && isRTL ? '3px solid #10B981' : '3px solid transparent',
                    borderLeft: isActive && !collapsed && !isRTL ? '3px solid #10B981' : '3px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#F1F5F9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#CBD5E1';
                    }
                  }}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            });
          })()}
        </nav>

        {/* Bottom Profile Section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #1E293B',
          backgroundColor: '#0B1120',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '18px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
          }}>
            {firstLetter}
          </div>

          {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '15px',
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>
                {userName}
              </span>
            </div>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              🔥 {user?.streak || 1} {lang === 'ar' ? 'يوم' : 'Days'}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#94A3B8',
              whiteSpace: 'nowrap',
              marginTop: '2px'
            }}>
              {lang === 'ar' ? `المستوى ${user?.level || 1}` : `Level ${user?.level || 1}`} • {user?.xp || 0} XP
            </span>
          </div>
        )}
      </div>
    </aside>
  </>
  );
};
