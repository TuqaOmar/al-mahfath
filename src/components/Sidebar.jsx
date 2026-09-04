import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Compass, 
  PlayCircle, 
  ShieldCheck, 
  Sparkles,
  Map,
  BookOpen,
  Users,
  Trophy,
  BarChart3,
  Sliders,
  X,
  ChevronsRight,
  ChevronsLeft,
  Shield,
  Bot,
  Presentation,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Sidebar = ({ activeTab, setActiveTab, collapsed: controlledCollapsed, setCollapsed: controlledSetCollapsed, onOpenProfile }) => {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  const setCollapsed = controlledSetCollapsed !== undefined ? controlledSetCollapsed : setLocalCollapsed;
  const { user } = useAuth();
  const { lang, isRTL } = useLanguage();

  // Primary core workflows (top level)
  const coreSections = [
    { id: 'home', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
    { id: 'daily-session', label: lang === 'ar' ? 'جلسة التسميع' : 'Recitation', icon: PlayCircle },
    { id: 'quran-map', label: lang === 'ar' ? 'خريطة المصحف' : 'Quran Map', icon: Compass },
    { id: 'five-fortresses', label: lang === 'ar' ? 'الحصون الخمسة' : 'Five Fortresses', icon: ShieldCheck },
    { id: 'ai-assistant', label: lang === 'ar' ? 'المعلم الذكي' : 'AI Guide', icon: Sparkles }
  ];

  // Secondary tools (grouped logically)
  const toolSections = [
    { id: 'my-plan', label: lang === 'ar' ? 'خطة الحفظ' : 'My Plan', icon: Sliders },
    { id: 'similarities', label: lang === 'ar' ? 'المتشابهات' : 'Similar Verses', icon: BookOpen },
    { id: 'mind-maps', label: lang === 'ar' ? 'الخرائط الذهنية' : 'Mind Maps', icon: Map },
    { id: 'analytics', label: lang === 'ar' ? 'التحليلات' : 'Analytics', icon: BarChart3 },
    { id: 'achievements', label: lang === 'ar' ? 'الأوسمة' : 'Achievements', icon: Trophy },
    { id: 'community', label: lang === 'ar' ? 'المجتمع' : 'Community', icon: Users },
    { id: 'presentation', label: lang === 'ar' ? 'عرض المنصة 📽️' : 'Pitch Deck 📽️', icon: Presentation },
    { id: 'docs', label: lang === 'ar' ? 'توثيق المنصة 📚' : 'Documentation 📚', icon: FileText }
  ];

  // Detect mobile view dynamically
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = collapsed ? (isMobile ? '0px' : '76px') : '260px';
  const sidebarOffset = isMobile && collapsed ? '-270px' : '0';

  const userName = user?.name || (lang === 'ar' ? 'أحمد محمد' : 'Ahmad Mohammad');
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
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 45,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      <aside 
        id="app-main-sidebar"
        style={{
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
          boxShadow: isRTL ? '-4px 0 24px rgba(0,0,0,0.3)' : '4px 0 24px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          ...positionStyles
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1E293B'
        }}>
          <div 
            onClick={() => {
              setActiveTab('home');
              if (isMobile) setCollapsed(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
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
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}>
              م
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  letterSpacing: '-0.3px',
                  color: '#FFFFFF'
                }}>
                  {lang === 'ar' ? 'مُحَفِّظ' : 'Ma7fath'} <span style={{ color: '#34D399' }}>AI</span>
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {lang === 'ar' ? 'إتقان القرآن الكريم' : 'Quran Mastery'}
                </span>
              </div>
            )}
          </div>

          <button 
            id="sidebar-collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            title={collapsed ? (isRTL ? "توسيع القائمة" : "Expand Menu") : (isRTL ? "طوي القائمة" : "Collapse Menu")}
          >
            {isMobile ? (
              <X size={20} />
            ) : collapsed ? (
              isRTL ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />
            ) : (
              isRTL ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />
            )}
          </button>
        </div>

        {/* Navigation Items (Grouped) */}
        <nav style={{
          flex: 1,
          padding: '14px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {user?.role === 'admin' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'admin-panel', label: lang === 'ar' ? 'لوحة تحكم المشرف' : 'Admin Panel', icon: Shield },
                { id: 'community', label: lang === 'ar' ? 'المجتمع' : 'Community', icon: Users },
                { id: 'ai-assistant', label: lang === 'ar' ? 'مساعد AI' : 'AI Mentor', icon: Bot }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab && setActiveTab(item.id);
                      if (isMobile) setCollapsed(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: collapsed ? '12px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' 
                        : 'transparent',
                      color: isActive ? '#34D399' : '#CBD5E1',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      borderRight: isActive && !collapsed && isRTL ? '3px solid #10B981' : '3px solid transparent',
                      borderLeft: isActive && !collapsed && !isRTL ? '3px solid #10B981' : '3px solid transparent'
                    }}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {/* Core Workflows Section */}
              {!collapsed && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  padding: '8px 12px 4px 12px',
                  letterSpacing: '0.05em'
                }}>
                  {lang === 'ar' ? 'المهام الأساسية' : 'Core Journey'}
                </div>
              )}

              {coreSections.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab && setActiveTab(item.id);
                      if (isMobile) setCollapsed(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' 
                        : 'transparent',
                      color: isActive ? '#34D399' : '#CBD5E1',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      borderRight: isActive && !collapsed && isRTL ? '3px solid #10B981' : '3px solid transparent',
                      borderLeft: isActive && !collapsed && !isRTL ? '3px solid #10B981' : '3px solid transparent'
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={19} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}

              {/* Tools & Community Divider */}
              {!collapsed && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  padding: '16px 12px 4px 12px',
                  letterSpacing: '0.05em'
                }}>
                  {lang === 'ar' ? 'الأدوات والتحفيز' : 'Tools & Progress'}
                </div>
              )}
              {collapsed && (
                <div style={{ height: '1px', background: '#1E293B', margin: '8px 10px' }} />
              )}

              {toolSections.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab && setActiveTab(item.id);
                      if (isMobile) setCollapsed(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: collapsed ? '11px 0' : '9px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' 
                        : 'transparent',
                      color: isActive ? '#34D399' : '#94A3B8',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      borderRight: isActive && !collapsed && isRTL ? '3px solid #10B981' : '3px solid transparent',
                      borderLeft: isActive && !collapsed && !isRTL ? '3px solid #10B981' : '3px solid transparent'
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={17} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom Profile Section */}
        <div 
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
          }}
          title={lang === 'ar' ? 'تعديل الملف الشخصي والاسم' : 'Edit Profile & Name'}
          style={{
            padding: '14px 16px',
            borderTop: '1px solid #1E293B',
            backgroundColor: '#0B1120',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: onOpenProfile ? 'pointer' : 'default',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (onOpenProfile) e.currentTarget.style.backgroundColor = '#1E293B';
          }}
          onMouseLeave={(e) => {
            if (onOpenProfile) e.currentTarget.style.backgroundColor = '#0B1120';
          }}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={userName}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid #10B981'
              }}
            />
          ) : (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '16px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
            }}>
              {firstLetter}
            </div>
          )}

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#F8FAFC',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {userName}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>✏️</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '10.5px', color: '#34D399', fontWeight: 600 }}>
                  ⭐ {lang === 'ar' ? `المستوى ${user?.level || 1}` : `Lvl ${user?.level || 1}`}
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>•</span>
                <span style={{ fontSize: '10.5px', color: '#F59E0B', fontWeight: 600 }}>
                  🔥 {user?.streak || 1} {lang === 'ar' ? 'يوم' : 'd'}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
