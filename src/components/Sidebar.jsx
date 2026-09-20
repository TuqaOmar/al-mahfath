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
  GraduationCap,
  Layers,
  FileText,
  TrendingUp,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';

export const Sidebar = ({ activeTab, setActiveTab, collapsed: controlledCollapsed, setCollapsed: controlledSetCollapsed, onOpenProfile }) => {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  const setCollapsed = controlledSetCollapsed !== undefined ? controlledSetCollapsed : setLocalCollapsed;
  const { user, logout } = useAuth();
  const { lang, isRTL } = useLanguage();

  const userRole = user?.role || 'user';

  // Responsive mobile detector
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = isMobile ? 'min(300px, 86vw)' : (collapsed ? '76px' : '260px');

  const positionStyles = isRTL 
    ? { right: 0, left: 'auto', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: 'none' }
    : { left: 0, right: 'auto', borderRight: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: 'none' };

  // Role-specific primary and secondary navigation sections
  let roleSections = [];

  if (userRole === 'admin') {
    roleSections = [
      {
        title: lang === 'ar' ? 'إدارة المنصة' : 'Administration',
        items: [
          { id: 'admin-dashboard', label: lang === 'ar' ? 'لوحة القيادة' : 'Dashboard', icon: BarChart3 },
          { id: 'admin-users', label: lang === 'ar' ? 'المستخدمون والأدوار' : 'Users & Roles', icon: Users },
          { id: 'admin-teachers', label: lang === 'ar' ? 'المعلمات المعتمدات' : 'Teachers', icon: GraduationCap },
          { id: 'admin-groups', label: lang === 'ar' ? 'الحلقات والمجموعات' : 'Groups', icon: Layers },
          { id: 'admin-analytics', label: lang === 'ar' ? 'التحليلات ومعدلات النمو' : 'Analytics', icon: TrendingUp }
        ]
      }
    ];
  } else if (userRole === 'teacher') {
    roleSections = [
      {
        title: lang === 'ar' ? 'بوابة المعلمة' : 'Teacher Portal',
        items: [
          { id: 'teacher-dashboard', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
          { id: 'teacher-students', label: lang === 'ar' ? 'طالباتي (24)' : 'My Students', icon: Users },
          { id: 'teacher-groups', label: lang === 'ar' ? 'حلقاتي القرآنية' : 'My Groups', icon: Layers },
          { id: 'teacher-reports', label: lang === 'ar' ? 'التقارير التحليلية' : 'Reports', icon: FileText }
        ]
      },
      {
        title: lang === 'ar' ? 'أدوات الدعم' : 'Support Tools',
        items: [
          { id: 'daily-session', label: lang === 'ar' ? 'المصحف والتسميع' : 'Quran & Recitation', icon: BookOpen },
          { id: 'similarities', label: lang === 'ar' ? 'المتشابهات القرآنية' : 'Similarities', icon: BookOpen },
          { id: 'mind-maps', label: lang === 'ar' ? 'الخرائط الذهنية' : 'Mind Maps', icon: Map }
        ]
      }
    ];
  } else {
    // Student / Member Navigation
    roleSections = [
      {
        title: lang === 'ar' ? 'مساري القرآني' : 'My Journey',
        items: [
          { id: 'home', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
          { id: 'quran-map', label: lang === 'ar' ? 'مصحفي وخريطة الختمة' : 'My Quran', icon: Compass },
          { id: 'daily-session', label: lang === 'ar' ? 'التسميع الصوتي الذكي' : 'Smart Recitation', icon: PlayCircle },
          { id: 'five-fortresses', label: lang === 'ar' ? 'الحصون وإنجازاتي' : 'Five Fortresses', icon: ShieldCheck }
        ]
      },
      {
        title: lang === 'ar' ? 'الأدوات والمعالم' : 'Quranic Tools',
        items: [
          { id: 'similarities', label: lang === 'ar' ? 'المتشابهات' : 'Similarities', icon: BookOpen },
          { id: 'mind-maps', label: lang === 'ar' ? 'الخرائط الذهنية' : 'Mind Maps', icon: Map },
          { id: 'ai-assistant', label: lang === 'ar' ? 'المعلم الإيماني' : 'AI Guide', icon: Sparkles },
          { id: 'community', label: lang === 'ar' ? 'المجتمع والهمة' : 'Community', icon: Users },
          { id: 'achievements', label: lang === 'ar' ? 'الأوسمة والثمار' : 'Achievements', icon: Trophy }
        ]
      }
    ];
  }

  return (
    <>
      {isMobile && !collapsed && (
        <div 
          id="sidebar-mobile-backdrop"
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 998,
            transition: 'opacity 0.25s ease'
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
          bottom: 0,
          zIndex: isMobile ? 999 : 50,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isMobile && !collapsed ? '0 0 40px rgba(0, 0, 0, 0.6)' : '4px 0 25px rgba(0, 0, 0, 0.4)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
          transform: isMobile 
            ? (collapsed ? (isRTL ? 'translateX(105%)' : 'translateX(-105%)') : 'translateX(0)')
            : 'none',
          ...positionStyles
        }}
      >
        {/* Brand Header */}
        <div style={{
          height: '64px',
          padding: collapsed ? '0' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              flexShrink: 0
            }}>
              <BookOpen size={20} />
            </div>

            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.3px' }}>
                  سَفَر <span style={{ color: '#10B981', fontSize: '13px', fontWeight: 600 }}>Safar</span>
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {userRole === 'admin' 
                    ? 'بوابة الإدارة المركزية' 
                    : (userRole === 'teacher' ? 'بوابة المعلمات' : 'إتقان القرآن الكريم')}
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

        {/* Navigation Sections */}
        <nav style={{
          flex: 1,
          padding: '14px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {roleSections.map((sec, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!collapsed && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  letterSpacing: '0.05em'
                }}>
                  {sec.title}
                </div>
              )}

              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || 
                  (item.id === 'admin-dashboard' && activeTab === 'admin-panel') ||
                  (item.id === 'home' && activeTab === 'teacher-dashboard');

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
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' 
                        : 'transparent',
                      color: isActive ? '#34D399' : '#CBD5E1',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.15s ease',
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
          ))}
        </nav>

        {/* PWA Install Button */}
        <div style={{ padding: collapsed ? '8px' : '10px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'center' }}>
          <PWAInstallButton collapsed={collapsed} />
        </div>

        {/* User Card in Bottom of Sidebar */}
        <div style={{
          padding: collapsed ? '12px 8px' : '14px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          background: '#0B1120'
        }}>
          <div 
            onClick={() => {
              if (onOpenProfile) onOpenProfile();
              if (isMobile) setCollapsed(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}
          >
            <img 
              src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'} 
              alt="Avatar" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10B981' }} 
            />
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'مستخدم سَفَر'}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {userRole === 'admin' ? 'مدير المنصة' : (userRole === 'teacher' ? 'معلمة حلقة' : (user?.isSafarMember ? 'عضوة في حلقة' : 'حافظ مستقل'))}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
