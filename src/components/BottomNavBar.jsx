import React from 'react';
import { 
  Home, 
  PlayCircle, 
  ShieldCheck, 
  BookOpen,
  LayoutGrid,
  User,
  Users,
  GraduationCap,
  Layers,
  BarChart3,
  FileText,
  TrendingUp,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const BottomNavBar = ({ activeTab, setActiveTab, onOpenMore, onOpenProfile, isProfileOpen = false }) => {
  const { lang, isRTL } = useLanguage();
  const { user } = useAuth();

  const userRole = user?.role || 'user';

  // Role-specific navigation tabs strictly respecting Section 10 of requirements
  let navTabs = [];

  if (userRole === 'admin') {
    navTabs = [
      { id: 'admin-dashboard', label: lang === 'ar' ? 'القيادة' : 'Dashboard', icon: BarChart3 },
      { id: 'admin-users', label: lang === 'ar' ? 'المستخدمين' : 'Users', icon: Users },
      { id: 'admin-teachers', label: lang === 'ar' ? 'المعلمات' : 'Teachers', icon: GraduationCap },
      { id: 'admin-groups', label: lang === 'ar' ? 'الحلقات' : 'Groups', icon: Layers },
      { id: 'admin-analytics', label: lang === 'ar' ? 'التحليلات' : 'Analytics', icon: TrendingUp }
    ];
  } else if (userRole === 'teacher') {
    navTabs = [
      { id: 'teacher-dashboard', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
      { id: 'teacher-students', label: lang === 'ar' ? 'طالباتي' : 'Students', icon: Users },
      { id: 'teacher-groups', label: lang === 'ar' ? 'الحلقات' : 'Groups', icon: Layers },
      { id: 'teacher-reports', label: lang === 'ar' ? 'التقارير' : 'Reports', icon: FileText }
    ];
  } else {
    // Student / Member Navigation
    navTabs = [
      { id: 'home', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
      { id: 'quran-map', label: lang === 'ar' ? 'مصحفي' : 'My Quran', icon: BookOpen },
      { id: 'daily-session', label: lang === 'ar' ? 'التسميع' : 'Recitation', icon: PlayCircle },
      { id: 'five-fortresses', label: lang === 'ar' ? 'إنجازاتي' : 'Progress', icon: ShieldCheck }
    ];
  }

  const isMoreActive = [
    'mind-maps', 
    'similarities', 
    'community', 
    'achievements', 
    'analytics', 
    'my-plan'
  ].includes(activeTab);

  return (
    <nav
      id="mobile-bottom-navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--glass-border)',
        boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 90,
        padding: '0 4px max(6px, env(safe-area-inset-bottom, 0px)) 4px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      aria-label="Mobile Navigation Bar"
    >
      {/* Primary Role Tabs */}
      {navTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id && !isProfileOpen;

        return (
          <button
            key={tab.id}
            id={`mobile-nav-${tab.id}`}
            onClick={() => {
              if (navigator?.vibrate) {
                try { navigator.vibrate(12); } catch (e) { /* ignore */ }
              }
              setActiveTab(tab.id);
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              height: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '4px 0',
              position: 'relative',
              touchAction: 'manipulation'
            }}
          >
            {isActive && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '28px',
                  height: '3px',
                  borderRadius: '0 0 4px 4px',
                  backgroundColor: 'var(--primary)',
                  boxShadow: '0 2px 8px var(--primary-glow)'
                }} 
              />
            )}
            <div style={{
              width: '38px',
              height: '30px',
              borderRadius: '12px',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: isActive ? 'scale(1.06)' : 'scale(1)'
            }}>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? 800 : 500,
              lineHeight: 1.1,
              whiteSpace: 'nowrap'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* More Tools Button (Opens tools sheet / drawer) */}
      <button
        id="mobile-nav-more-tools"
        onClick={() => {
          if (navigator?.vibrate) {
            try { navigator.vibrate(12); } catch (e) { /* ignore */ }
          }
          if (onOpenMore) onOpenMore();
        }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          height: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isMoreActive ? 'var(--primary)' : 'var(--text-secondary)',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '4px 0',
          position: 'relative',
          touchAction: 'manipulation'
        }}
        title={lang === 'ar' ? 'المزيد من الأدوات' : 'More Tools'}
      >
        {isMoreActive && (
          <span 
            style={{
              position: 'absolute',
              top: 0,
              width: '28px',
              height: '3px',
              borderRadius: '0 0 4px 4px',
              backgroundColor: 'var(--primary)',
              boxShadow: '0 2px 8px var(--primary-glow)'
            }} 
          />
        )}
        <div style={{
          width: '38px',
          height: '30px',
          borderRadius: '12px',
          background: isMoreActive ? 'var(--primary-light)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          transform: isMoreActive ? 'scale(1.06)' : 'scale(1)'
        }}>
          <LayoutGrid size={20} strokeWidth={isMoreActive ? 2.5 : 1.8} />
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: isMoreActive ? 800 : 500,
          lineHeight: 1.1,
          whiteSpace: 'nowrap'
        }}>
          {lang === 'ar' ? 'المزيد' : 'More'}
        </span>
      </button>

      {/* For Student & Teacher: Show Profile/Account button */}
      {userRole !== 'admin' && (
        <button
          id="mobile-nav-profile"
          onClick={() => {
            if (navigator?.vibrate) {
              try { navigator.vibrate(14); } catch (e) { /* ignore */ }
            }
            if (onOpenProfile) onOpenProfile();
          }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            height: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isProfileOpen ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
            padding: '4px 0',
            position: 'relative',
            touchAction: 'manipulation'
          }}
        >
          {isProfileOpen && (
            <span 
              style={{
                position: 'absolute',
                top: 0,
                width: '28px',
                height: '3px',
                borderRadius: '0 0 4px 4px',
                backgroundColor: 'var(--primary)',
                boxShadow: '0 2px 8px var(--primary-glow)'
              }} 
            />
          )}
          <div style={{
            width: '38px',
            height: '30px',
            borderRadius: '12px',
            background: isProfileOpen ? 'var(--primary-light)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            transform: isProfileOpen ? 'scale(1.06)' : 'scale(1)'
          }}>
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${isProfileOpen ? 'var(--primary)' : 'var(--glass-border)'}`,
                  objectFit: 'cover'
                }} 
              />
            ) : (
              <User size={21} strokeWidth={isProfileOpen ? 2.5 : 1.8} />
            )}
          </div>
          <span style={{ fontSize: '11px', fontWeight: isProfileOpen ? 800 : 500, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            {lang === 'ar' ? 'حسابي' : 'Profile'}
          </span>
        </button>
      )}
    </nav>
  );
};
