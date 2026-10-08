import { declaredPages, nextDeclaredPage } from '../lib/memorization';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Flame, 
  Trophy, 
  Calendar, 
  Sun, 
  Moon,
  BookOpen,
  CheckCircle,
  Target,
  Shield,
  ShieldCheck,
  Award,
  BarChart2,
  Sparkles,
  Play,
  Mic,
  Presentation,
  Check,
  Brain,
  Layers,
  TrendingUp,
  UserCheck,
  Zap,
  HelpCircle,
  ArrowRight,
  Clock,
  Heart,
  BookMarked,
  Star,
  Users,
  Plus
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Sidebar } from '../components/Sidebar';
import { ThemeProvider } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { PullToRefresh } from '../components/PullToRefresh';
import { useLanguage } from '../context/LanguageContext';
import AiAssistant from '../components/AiAssistant';
import { Community } from '../components/Community';
import { QuranMapPage } from '../components/QuranMapPage';
import { PostSessionDhikr } from '../components/PostSessionDhikr';
import { AnalyticsView } from '../components/AnalyticsView';
import { VisualProgressTracker } from '../components/VisualProgressTracker';
import { QuranInteractiveView } from '../components/QuranInteractiveView';
import { SafeBoundary } from '../components/SafeBoundary';
import { LearningStyleProfiler } from '../components/LearningStyleProfiler';
import { MyPlanManager } from '../components/MyPlanManager';
import { FiveFortressesPlan } from '../components/FiveFortressesPlan';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';
import { NotificationCenter } from '../components/NotificationCenter';
import { useNotifications } from '../context/NotificationContext';
import { ReviewReminderAlert } from '../components/ReviewReminderAlert';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { AdminPanel } from '../components/AdminPanel';
import { BottomNavBar } from '../components/BottomNavBar';
import { MoreToolsModal } from '../components/MoreToolsModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { PresentationModal } from '../components/PresentationModal';
import { DocumentationModal } from '../components/DocumentationModal';
import { QuickSettingsMenu } from '../components/QuickSettingsMenu';
import { RoleSwitcherMenu } from '../components/RoleSwitcherMenu';
import { SimilaritiesView } from '../components/SimilaritiesView';
import { MindMapsView } from '../components/MindMapsView';

import { JoinGroupModal } from '../components/onboarding/JoinGroupModal';
import { TeacherDashboard } from '../components/teacher/TeacherDashboard';
import { TeacherStudentsView } from '../components/teacher/TeacherStudentsView';
import { TeacherStudentProfileModal } from '../components/teacher/TeacherStudentProfileModal';
import { TeacherGroupsView } from '../components/teacher/TeacherGroupsView';
import { TeacherReportsView } from '../components/teacher/TeacherReportsView';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { TajweedLab } from '../components/tajweed/TajweedLab';
import { useUiConfiguration } from '../lib/uiConfiguration';
import { getNavigation } from '../lib/navigation';
import { useBackHandler } from '../hooks/useBackHandler';
import { useSoftKeyboard } from '../hooks/useSoftKeyboard';
import { getFortressPlanFromFirestore, saveFortressPlanToFirestore, currentFortressCompletion, numericFortressCompletion, fortressKeys } from '../lib/fortressService';


// Hadiths on the virtues of the Quran
const quranHadiths = [
  { text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source: "رواه البخاري" },
  { text: "اقْرَؤُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ", source: "رواه مسلم" },
  { text: "يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا", source: "رواه الترمذي" },
  { text: "الَّذِي يَقْرَأُ القُرْآنَ وَهُوَ مَاهِرٌ بِهِ مَعَ السَّفَرَةِ الكِرَامِ البَرَرَةِ", source: "متفق عليه" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, activeRole, logout, deleteAccount, updateUserData, applyConfirmedUser, refreshUserData } = useAuth();
  const { lang, setLang, t, isRTL } = useLanguage();
  const getUserDefaultTab = (role) => {
    if (role === 'admin') return 'admin-dashboard';
    if (role === 'teacher') return 'teacher-dashboard';
    return 'home';
  };
  const tabStorageKey = (uid, role) => `ma7fath_active_tab:${uid}:${role || 'user'}`;
  const [activeTab, setActiveTab] = useState(() => {
    const fallback = getUserDefaultTab(activeRole);
    try {
      const saved = sessionStorage.getItem(tabStorageKey(user?.uid, activeRole));
      const known = getNavigation(activeRole || 'user', 'ar').sections.some(section => section.items.some(entry => entry.id === saved));
      return known ? saved : fallback;
    } catch (e) {
      return fallback;
    }
  });
  // Open the mushaf on the first page the student has not declared yet.
  const [selectedQuranPage, setSelectedQuranPage] = useState(() => nextDeclaredPage(user));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentGroupId, setStudentGroupId] = useState(null);
  const [studentFilter, setStudentFilter] = useState('all');
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState('');
  const [syncFailed, setSyncFailed] = useState(false);
  const refreshLockRef = useRef(false);
  const syncTimerRef = useRef(null);
  const [homeFortressPlan, setHomeFortressPlan] = useState(null);
  const [homeFortressLoading, setHomeFortressLoading] = useState(false);
  const [savingHomeFortress, setSavingHomeFortress] = useState(null);
  const [homeFortressFeedback, setHomeFortressFeedback] = useState(null);
  const homeFortressLockRef = useRef(false);
  const { soundEnabled, toggleSound } = useNotifications();
  const { configuration: uiConfiguration } = useUiConfiguration();

  const handleRefreshDashboard = async () => {
    if (refreshLockRef.current) throw new Error('A profile refresh is already in progress');
    refreshLockRef.current = true;
    clearTimeout(syncTimerRef.current);
    setSyncToast('');
    setSyncFailed(false);
    setIsSyncing(true);
    try {
      if (typeof refreshUserData !== 'function') throw new Error('Profile refresh is unavailable');
      const result = await refreshUserData();
      if (result?.success !== true) throw new Error(result?.message || 'Profile refresh was not confirmed');
      setSyncToast(isRTL ? 'تم تحديث بيانات حسابك.' : 'Your account data was refreshed.');
      syncTimerRef.current = setTimeout(() => setSyncToast(''), 3500);
      return result;
    } catch (err) {
      console.error('Refresh error:', err);
      setSyncFailed(true);
      setSyncToast(isRTL ? 'تعذر تحديث ملف الحساب. بقيت آخر بيانات مؤكدة؛ أعد المحاولة.' : 'Account profile refresh failed. The last confirmed data was kept; please retry.');
      throw err;
    } finally {
      refreshLockRef.current = false;
      setIsSyncing(false);
    }
  };

  useEffect(() => () => clearTimeout(syncTimerRef.current), []);

  useEffect(() => {
    if (activeTab === 'presentation') {
      setShowPresentationModal(true);
      setActiveTab('home');
    } else if (activeTab === 'docs') {
      setShowDocsModal(true);
      setActiveTab('home');
    }
  }, [activeTab]);

  const fortressesToday = numericFortressCompletion(currentFortressCompletion(homeFortressPlan));
  const projectedFortressState = JSON.stringify(user?.preferences?.fortressesToday || {});

  useEffect(() => {
    setHomeFortressPlan(null);
    setHomeFortressFeedback(null);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || activeTab !== 'home') return;
    let current = true;
    setHomeFortressLoading(true);
    getFortressPlanFromFirestore(user.uid, getJuzForPage(nextDeclaredPage(user)), nextDeclaredPage(user))
      .then(plan => { if (current) setHomeFortressPlan(plan); })
      .catch(error => {
        if (current) setHomeFortressFeedback({ status: 'error', text: isRTL
          ? 'تعذر قراءة علامات الحصون المحفوظة؛ بقيت آخر بيانات مؤكدة.'
          : 'Saved fortress marks could not be read; the last confirmed data was kept.' });
      })
      .finally(() => { if (current) setHomeFortressLoading(false); });
    return () => { current = false; };
  }, [user?.uid, activeTab, projectedFortressState]);

  const handleToggleFortress = async (fortId) => {
    if (homeFortressLockRef.current || homeFortressLoading || !user?.uid) return;
    homeFortressLockRef.current = true;
    setSavingHomeFortress(fortId);
    setHomeFortressFeedback(null);
    try {
      // Read the saved plan before changing its completion flags; retain its contents.
      const plan = await getFortressPlanFromFirestore(user.uid, getJuzForPage(nextDeclaredPage(user)), nextDeclaredPage(user));
      const completion = currentFortressCompletion(plan);
      const key = fortressKeys[fortId - 1];
      const result = await saveFortressPlanToFirestore(user.uid, {
        ...plan, completionStatus: { ...completion, [key]: !completion[key] }
      });
      const profileResult = applyConfirmedUser(result);
      if (profileResult?.success !== true) throw new Error(profileResult?.message || 'Authentication changed while saving');
      setHomeFortressPlan(result.plan);
      setHomeFortressFeedback(profileResult?.success === true
        ? { status: 'success', text: isRTL ? 'تم حفظ علامة الإنجاز الذاتي؛ لا تمنح XP أو اعتماد حفظ.' : 'Self-reported completion saved; it grants no XP or memorization approval.' }
        : { status: 'warning', text: isRTL ? 'تم حفظ علامة الإنجاز، لكن تعذر تحديث ملف الحساب.' : 'Completion was saved, but the account profile could not be refreshed.' });
    } catch (error) {
      setHomeFortressFeedback({ status: 'error', text: isRTL
        ? 'تعذر حفظ علامة الإنجاز. بقيت آخر علامات مؤكدة؛ أعد المحاولة.'
        : 'Completion could not be saved. The last confirmed marks were kept; please retry.' });
    } finally {
      homeFortressLockRef.current = false;
      setSavingHomeFortress(null);
    }
  };
  const [isRecording, setIsRecording] = useState(false);
  const [hadithIdx, setHadithIdx] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1280 : false;
  });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isLaptop, setIsLaptop] = useState(typeof window !== 'undefined' && window.innerWidth < 1340);
  const [showMoreToolsModal, setShowMoreToolsModal] = useState(false);

  // Set default tab only when user logs in or user role changes
  const lastUserRoleRef = useRef(activeRole);
  const lastUserIdRef = useRef(user?.uid);

  useEffect(() => {
    const isNewUser = user?.uid && user?.uid !== lastUserIdRef.current;
    const isRoleChanged = activeRole !== lastUserRoleRef.current;

    if (isNewUser || isRoleChanged) {
      setSelectedStudentId(null);
      setStudentGroupId(null);
      lastUserIdRef.current = user?.uid;
      lastUserRoleRef.current = activeRole;
      setActiveTab(getUserDefaultTab(activeRole));
    }
  }, [user?.uid, activeRole]);

  // Leave a student section the admin has hidden.
  useEffect(() => {
    if ((activeRole || 'user') === 'user' && ['community', 'achievements'].includes(activeTab)
      && uiConfiguration.sections[activeTab]?.visible === false) {
      setActiveTab('home');
    }
  }, [activeTab, uiConfiguration, activeRole]);

  useEffect(() => {
    try { sessionStorage.setItem(tabStorageKey(user?.uid, activeRole), activeTab); } catch (e) { /* storage unavailable */ }
  }, [activeTab, user?.uid, activeRole]);

  // Each tab keeps its own scroll position; a tab opened for the first time starts at the top.
  const tabScrollRef = useRef({});
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    const remember = () => { tabScrollRef.current[activeTabRef.current] = window.scrollY; };
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, []);
  useLayoutEffect(() => {
    if (activeTabRef.current === activeTab) return;
    activeTabRef.current = activeTab;
    window.scrollTo({ top: tabScrollRef.current[activeTab] || 0, behavior: 'instant' });
  }, [activeTab]);

  // Back button (browser, PWA, Android hardware): close the top sheet/dialog first,
  // then return to this role's home tab, then leave.
  const homeTab = getUserDefaultTab(activeRole);
  useBackHandler(activeTab !== homeTab, () => setActiveTab(homeTab));
  useBackHandler(showMoreToolsModal, () => setShowMoreToolsModal(false));
  useBackHandler(showProfileModal, () => setShowProfileModal(false));
  useBackHandler(showJoinGroupModal, () => setShowJoinGroupModal(false));
  useBackHandler(Boolean(selectedStudentId), () => setSelectedStudentId(null));
  useBackHandler(showDeleteConfirm, () => setShowDeleteConfirm(false));
  useBackHandler(showDocsModal, () => setShowDocsModal(false));
  useBackHandler(showPresentationModal, () => setShowPresentationModal(false));

  const keyboardOpen = useSoftKeyboard(isMobile);

  // Track screen size changes for responsiveness (Laptop & Mobile)
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const mobile = w <= 768;
      const laptop = w < 1340;
      setIsMobile(mobile);
      setIsLaptop(laptop);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Rotate Hadith every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHadithIdx((prev) => (prev + 1) % quranHadiths.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teacher-dashboard':
        return (
          <TeacherDashboard
            onOpenStudentProfile={(sId) => setSelectedStudentId(sId)}
            onViewAllStudents={(filter) => {
              setStudentGroupId(null);
              setStudentFilter(filter || 'all');
              setActiveTab('teacher-students');
            }}
            onViewGroups={() => setActiveTab('teacher-groups')}
          />
        );

      case 'teacher-students':
        return (
          <TeacherStudentsView
            initialFilter={studentFilter}
            groupId={studentGroupId}
            onShowAll={() => setStudentGroupId(null)}
            onOpenStudentProfile={(sId) => setSelectedStudentId(sId)}
          />
        );

      case 'teacher-groups':
        return (
          <TeacherGroupsView
            onViewStudentsInGroup={(groupId) => {
              setStudentGroupId(groupId);
              setStudentFilter('all');
              setActiveTab('teacher-students');
            }}
          />
        );

      case 'teacher-reports':
        return <TeacherReportsView />;

      case 'admin-dashboard':
      case 'admin-panel':
        return <AdminDashboard activeAdminTab="dashboard" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-users':
        return <AdminDashboard activeAdminTab="users" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-teachers':
        return <AdminDashboard activeAdminTab="teachers" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-groups':
        return <AdminDashboard activeAdminTab="groups" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-distribution':
        return <AdminDashboard activeAdminTab="distribution" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-performance':
        return <AdminDashboard activeAdminTab="performance" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-analytics':
        return <AdminDashboard activeAdminTab="analytics" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-experience':
        return <AdminDashboard activeAdminTab="experience" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-community':
        return <AdminDashboard activeAdminTab="community" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-badges':
        return <AdminDashboard activeAdminTab="badges" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'admin-tajweed':
        return activeRole === 'admin' ? <TajweedLab /> : null;

      case 'home':
        return (
          <div data-testid="student-home-view" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '1040px', margin: '0 auto', paddingBottom: '20px' }}>
            
            {/* Optional Banner: Safar Membership status or gentle invitation */}
            {user?.isSafarMember ? (
              <div style={{
                padding: '12px 18px',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                      عضوة مسجلة في {user?.groupName || 'اسم الحلقة غير متاح'} 🌸
                    </strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      المعلمة المشرفة: {user?.teacherName || 'اسم المعلم غير متاح'} • متابعة دورية للأوراد والتسميع
                    </span>
                  </div>
                </div>

                <button onClick={() => setShowJoinGroupModal(true)} style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                  {lang === 'ar' ? 'إدارة عضوية الحلقة' : 'Manage Group Membership'}
                </button>
              </div>
            ) : (
              <div style={{
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: '1px dashed var(--primary)',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      هل لديكِ رمز دعوة من معلمة حلقة في سَفَر؟ 👥
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      انضمي لحلقتكِ بسهولة أو تابعي مسيرتكِ كحافظ مستقل دون أي إلزام.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowJoinGroupModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Plus size={14} />
                  <span>انضمام لحلقة</span>
                </button>
              </div>
            )}

            {/* 1. Hero: Today's Recitation & Memorization Focus (ورد اليوم المبارك) */}
            <div style={{
              borderRadius: isMobile ? '20px' : '24px',
              padding: isMobile ? '20px 16px' : '32px 36px',
              background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 55%, #022C22 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '14px' : '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle background Quran ornament */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '-30px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  color: '#34D399', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}>
                  <BookOpen size={14} /> ورد اليوم المبارك
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  يتجدد يومياً مع تقدمك
                </span>
              </div>

              <div>
                <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  جاهز لوردك اليومي؟ 🌿
                </h1>
                <p style={{ margin: 0, fontSize: isMobile ? '13.5px' : '15px', color: '#CBD5E1', lineHeight: 1.5 }}>
                  استمر على عهدك مع كتاب الله، ورتّل آياتك بخشوع وثبات.
                </p>
              </div>

              {/* Targets Summary Chips */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                padding: isMobile ? '12px' : '16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>الحفظ الجديد اليوم:</span>
                    <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>
                      {user?.preferences?.dailyTarget || 'صفحة واحدة (سورة البقرة)'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Layers size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>المراجعة والتثبيت:</span>
                    <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>
                      {user?.preferences?.oldReviewDailyTarget || 'نصف جزء يومياً'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setActiveTab('daily-session')}
                  style={{ 
                    flex: isMobile ? 1 : 'none',
                    padding: isMobile ? '13px 20px' : '14px 28px', 
                    borderRadius: '14px', 
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                    color: 'white', 
                    border: 'none', 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '14px' : '15px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.15s ease',
                    touchAction: 'manipulation'
                  }}
                >
                  <Play size={17} /> ابدأ التسميع والقراءة الآن
                </button>

                <button 
                  onClick={() => setActiveTab('my-plan')}
                  style={{ 
                    padding: isMobile ? '13px 16px' : '14px 20px', 
                    borderRadius: '14px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    color: '#E2E8F0', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '13px' : '14px', 
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    touchAction: 'manipulation'
                  }}
                >
                  تعديل الخطة
                </button>
              </div>
            </div>

            {/* 2. Key Metrics Row (Compact & Touch-Friendly on Mobile) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: isMobile ? '8px' : '16px'
            }}>
              
              {/* Memorized Pages */}
              <Card style={{ padding: isMobile ? '12px 10px' : '20px', textAlign: isMobile ? 'center' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', marginBottom: '8px' }}>
                  {!isMobile && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>الصفحات المصرّح بها ذاتيًا</span>}
                  <div style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={isMobile ? 15 : 18} />
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  <span data-testid="home-declared-pages">{declaredPages(user).length}</span> {!isMobile && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>صفحة</span>}
                </div>
                <span style={{ fontSize: isMobile ? '10.5px' : '12px', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {'تصريح الطالب؛ ليس اعتمادًا'}
                </span>
              </Card>

              {/* Streak */}
              <Card style={{ padding: isMobile ? '12px 10px' : '20px', textAlign: isMobile ? 'center' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', marginBottom: '8px' }}>
                  {!isMobile && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>صحبة القرآن</span>}
                  <div style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame size={isMobile ? 15 : 18} />
                  </div>
                </div>
                <div data-testid="quran-companion-streak" style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {user?.streak ?? 0} {!isMobile && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>يوم</span>}
                </div>
                <span style={{ fontSize: isMobile ? '10.5px' : '12px', color: '#F59E0B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isMobile ? 'أيام صحبة القرآن' : 'أيام صحبة القرآن'}
                </span>
              </Card>

            </div>

            {/* 3. Mobile-First Quick Fortresses Daily Check-in */}
            <div style={{
              borderRadius: isMobile ? '18px' : '22px',
              padding: isMobile ? '16px' : '22px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    حصونك الخمسة اليومية
                  </h3>
                </div>
                <div style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '11.5px',
                  fontWeight: 800
                }}>
                  <span data-testid="home-fortress-count">{homeFortressPlan ? `${Object.values(fortressesToday).filter(Boolean).length} / 5 منجزة` : 'غير متاح'}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isRTL ? 'علامات إنجاز يصرّح بها الطالب، ولا تمنح XP أو اعتماد حفظ.' : 'Student-reported completion marks; they grant no XP or memorization approval.'}
              </p>
              {homeFortressFeedback && (
                <p data-testid="home-fortress-feedback" role={homeFortressFeedback.status === 'success' ? 'status' : 'alert'}
                  data-status={homeFortressFeedback.status} style={{ margin: 0, color: homeFortressFeedback.status === 'success' ? 'var(--primary)' : '#EF4444', fontSize: '12px' }}>
                  {homeFortressFeedback.text}
                </p>
              )}

              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'var(--bg-color)', overflow: 'hidden' }}>
                <div style={{
                  width: `${(Object.values(fortressesToday).filter(Boolean).length / 5) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981, #059669)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* 5 Quick Tap Capsules */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '8px'
              }}>
                {[
                  { id: 1, name: '١. قراءة الورد', sub: 'نظراً من المصحف' },
                  { id: 2, name: '٢. التحضير', sub: 'سماع وفهم الآيات' },
                  { id: 3, name: '٣. الحفظ الجديد', sub: 'تكرار متقن' },
                  { id: 4, name: '٤. مراجعة قريبة', sub: 'آخر ٢٠ صفحة' },
                  { id: 5, name: '٥. مراجعة بعيدة', sub: 'المحفوظ القديم' }
                ].map(fort => {
                  const isDone = !!fortressesToday[fort.id];
                  return (
                    <button
                      key={fort.id}
                      data-testid={`home-fortress-${fort.id}`}
                      aria-pressed={isDone}
                      disabled={homeFortressLoading || savingHomeFortress !== null}
                      onClick={() => {
                        if (navigator?.vibrate) {
                          try { navigator.vibrate(10); } catch (e) {}
                        }
                        handleToggleFortress(fort.id);
                      }}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 10px',
                        borderRadius: '12px',
                        border: isDone ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: isDone ? 'var(--primary-light)' : 'var(--bg-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: homeFortressLoading || savingHomeFortress !== null ? 'wait' : 'pointer',
                        textAlign: 'right',
                        transition: 'all 0.15s ease',
                        touchAction: 'manipulation'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{
                          fontSize: '12.5px',
                          fontWeight: isDone ? 800 : 600,
                          color: isDone ? 'var(--primary)' : 'var(--text-primary)'
                        }}>
                          {fort.name}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {savingHomeFortress === fort.id ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : fort.sub}
                        </span>
                      </div>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isDone ? 'none' : '1.5px solid var(--text-secondary)',
                        background: isDone ? 'var(--primary)' : 'transparent',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isDone && <Check size={14} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Spiritual Calm: Hadith of the Day */}
            <div style={{
              padding: '18px 24px',
              borderRadius: '18px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📖</span>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-quran)' }}>
                  « {quranHadiths[hadithIdx].text} »
                </p>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 12px', borderRadius: '12px' }}>
                {quranHadiths[hadithIdx].source}
              </span>
            </div>

          </div>
        );

      case 'quran-map':
        return (
          <QuranMapPage
            onSelectPageForRecitation={(pNum) => {
              setSelectedQuranPage(pNum);
              setActiveTab('daily-session');
            }}
          />
        );

      case 'mushaf':
      case 'daily-session':
        return (
          <Card style={{ padding: isMobile ? '16px 12px' : '36px', maxWidth: '1050px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
            
            {/* Supplication Before Recitation */}
            <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', marginBottom: '32px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                🤲 دعاء الافتتاح وتيسير الفهم والحفظ
              </span>
              <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-quran)', lineHeight: 1.6 }}>
                «اللَّهُمَّ افْتَحْ عَلَيَّ فُتُوحَ الْعَارِفِينَ بِحِكْمَتِكَ، وَانْشُرْ عَلَيَّ رَحْمَتَكَ، وَذَكِّرْنِي مَا نَسِيتُ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ»
              </p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: isMobile ? '22px' : '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>📖 تصفح المصحف الشريف والتسميع التفاعلي</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>قراءة وتدبر صفحات المصحف الشريف الـ 604 مع الاستماع لكبار القراء وتسميع الآيات بالذكاء الاصطناعي</p>
            </div>

            {/* Interactive Verse-Synced Quran View Component */}
            <div style={{ marginBottom: '40px' }}>
              <SafeBoundary>
                <QuranInteractiveView 
                  initialPageNumber={selectedQuranPage} 
                  onPageChange={(pNum) => setSelectedQuranPage(pNum)}
                />
              </SafeBoundary>
            </div>

            {/* Post-Session Dhikr & Tasbeeh Component */}
            <PostSessionDhikr />
          </Card>
        );

      case 'my-plan':
        return (
          <Card style={{ padding: isMobile ? '16px' : '28px' }}>
            <MyPlanManager />
          </Card>
        );

      case 'five-fortresses':
        return (
          <Card style={{ padding: isMobile ? '16px' : '28px' }}>
            <FiveFortressesPlan
              setActiveTab={setActiveTab}
              onSelectPageForRecitation={(pNum) => {
                setSelectedQuranPage(pNum);
                setActiveTab('daily-session');
              }}
            />
          </Card>
        );

      case 'ai-assistant':
        return (
          <Card style={{ padding: isMobile ? '16px' : '24px' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>🤖 المعلم والموجه الإيماني الذكي</h2>
            <AiAssistant />
          </Card>
        );

      case 'community':
        if (!uiConfiguration.sections.community.visible) return null;
        return <Community setActiveTab={setActiveTab} />;

      case 'achievements': {
        if (!uiConfiguration.sections.achievements.visible) return null;
        const badgeState = {
          streak_7: { unlocked: user?.streak >= 7, icon: Flame },
          baqarah: { unlocked: user?.earnedBadges?.includes('baqarah') === true, icon: Award },
          xp_500: { unlocked: user?.xp >= 500, icon: Sparkles },
          fortresses_3: { unlocked: Object.values(fortressesToday).filter(Boolean).length >= 3, icon: Shield },
          stability_95: { unlocked: user?.earnedBadges?.includes('stability_95') === true, icon: Brain },
          level_5: { unlocked: user?.level >= 5, icon: Trophy }
        };
        return (
          <Card style={{ padding: isMobile ? '20px 16px' : '32px' }}>
            <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>🏆 أوسمة وثمار صحبة القرآن</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>محطات إيمانية وتشجيعية في رحلتك مع كتاب الله.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[...uiConfiguration.badges].filter(badge => badge.visible).sort((a, b) => a.order - b.order).map((badge) => {
                const state = badgeState[badge.id] || {
                  unlocked: user?.earnedBadges?.includes(badge.id) === true || (badge.criterion && Number({
                    streak: user?.streak, xp: user?.xp, level: user?.level, pages: declaredPages(user).length
                  }[badge.criterion.type] || 0) >= badge.criterion.value),
                  icon: Award
                };
                const Icon = state.icon;
                return <div key={badge.id} data-testid={`achievement-${badge.id}`} style={{ padding: '28px 20px', borderRadius: '20px', background: state.unlocked ? 'var(--primary-light)' : 'var(--bg-color)', border: `1px solid ${state.unlocked ? 'var(--primary)' : 'var(--glass-border)'}`, textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: state.unlocked ? 'var(--primary)' : 'var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{badge.title}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{badge.description}</p>
                </div>
              })}
            </div>
          </Card>
        );
      }

      case 'analytics':
        return <AnalyticsView />;

      case 'admin-panel':
        return <AdminPanel />;

      case 'mind-maps':
        return (
          <MindMapsView 
            onSelectPageForRecitation={(pNum) => {
              setSelectedQuranPage(pNum);
              setActiveTab('daily-session');
            }}
          />
        );

      case 'similarities':
        return (
          <SimilaritiesView 
            onSelectPageForRecitation={(pNum) => {
              setSelectedQuranPage(pNum);
              setActiveTab('daily-session');
            }}
          />
        );

      default:
        return (
          <Card style={{ padding: '32px', textAlign: 'center' }}>
            <Sparkles size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)' }}>قسم {activeTab} قيد التفعيل</h2>
            <p style={{ color: 'var(--text-secondary)' }}>نعمل على إضافة أفضل التحديثات الإيمانية لهذا القسم قريباً.</p>
          </Card>
        );
    }
  };

  const mainPaneMargin = isMobile ? '0px' : (sidebarCollapsed ? '76px' : '248px');
  const mainPaneStyles = isRTL 
    ? { marginRight: mainPaneMargin, marginLeft: 0, transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
    : { marginLeft: mainPaneMargin, marginRight: 0, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Desktop sidebar; mobile navigates with the bottom bar + "More" sheet */}
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onOpenProfile={() => setShowProfileModal(true)}
        />
      )}

      {/* Main Content Pane */}
      <div style={{ 
        flex: 1, 
        minWidth: 0,
        maxWidth: isMobile ? '100%' : `calc(100% - ${mainPaneMargin})`,
        width: isMobile ? '100%' : `calc(100% - ${mainPaneMargin})`,
        overflowX: 'hidden',
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        boxSizing: 'border-box',
        ...mainPaneStyles
      }}>
        
        {/* Top bar — same layout on web and mobile: who you are on one side, two controls on the other */}
        <header style={{
          minHeight: '60px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: isMobile
            ? 'max(8px, env(safe-area-inset-top)) 12px 8px'
            : (isLaptop ? '10px 20px' : '10px 32px'),
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: isMobile ? 100 : 30
        }}>
          <button
            type="button"
            id="header-user-profile-card"
            onClick={() => setShowProfileModal(true)}
            title={isRTL ? 'الملف الشخصي' : 'Profile'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
              flex: '1 1 auto',
              padding: '2px',
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              textAlign: 'start'
            }}
          >
            {isMobile && (
              <img
                data-testid="header-profile-photo"
                src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'}
                alt=""
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', flexShrink: 0 }}
              />
            )}
            <span className="mobile-profile-details" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{
                fontSize: isMobile ? '15px' : '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {isMobile ? (user?.name || (isRTL ? 'يا حافظ القرآن' : 'Learner')) : `${isRTL ? 'مرحباً،' : 'Welcome,'} ${user?.name || (isRTL ? 'يا حافظ القرآن' : 'Learner')}`}
              </span>
              <span className="mobile-profile-streak" style={{ fontSize: '12px', color: '#D97706', fontWeight: 600, whiteSpace: 'nowrap' }}>
                🔥 {user?.streak ?? 0} {isRTL ? 'أيام صحبة القرآن' : 'day streak'}
              </span>
            </span>
          </button>

          <div id="mobile-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <RoleSwitcherMenu isMobile={isMobile} />
            <NotificationCenter />
            <QuickSettingsMenu
              soundEnabled={soundEnabled}
              toggleSound={toggleSound}
              isSyncing={isSyncing}
              handleRefresh={handleRefreshDashboard}
              onOpenProfile={() => setShowProfileModal(true)}
              onOpenDocs={() => setShowDocsModal(true)}
              onOpenPresentation={() => setShowPresentationModal(true)}
              onDeleteAccount={() => setShowDeleteConfirm(true)}
              isMobile={isMobile}
            />
          </div>
        </header>

        {/* Custom Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-soft)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'var(--text-primary)' }}>
                تأكيد حذف الحساب نهائياً
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم مسح كافة البيانات المسجلة والتقدم في الحفظ نهائياً، ولا يمكن التراجع عن هذا الإجراء.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteConfirm(false);
                    const result = await deleteAccount();
                    if (result?.success) {
                      navigate('/');
                      return;
                    }
                    // Without this the landing page saw the still-signed-in user and bounced back here.
                    const code = result?.code ? ` (${result.code})` : '';
                    window.alert(result?.code === 'auth/requires-recent-login'
                      ? 'لحماية حسابك، سجّلي الخروج ثم ادخلي مرة أخرى، واحذفي الحساب مباشرة بعد الدخول.'
                      : 'تعذر حذف الحساب، ولم يُحذف شيء. حاولي مرة أخرى.' + code);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#EF4444',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  نعم، احذف الحساب
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Content View with Native Pull-To-Refresh */}
        <main style={{ 
          padding: isMobile ? '12px 12px calc(90px + env(safe-area-inset-bottom, 0px)) 12px' : (isLaptop ? '20px 20px 40px 20px' : '28px 32px'), 
          flex: 1, 
          minWidth: 0, 
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          {/* Floating Sync Success / Refresh Toast */}
          {syncToast && (
            <div
              id="dashboard-sync-toast"
              data-testid="dashboard-refresh-feedback"
              data-status={syncFailed ? 'error' : 'success'}
              role={syncFailed ? 'alert' : 'status'}
              style={{
                position: 'fixed',
                top: 'calc(68px + env(safe-area-inset-top, 0px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.94)',
                color: syncFailed ? '#FCA5A5' : '#34D399',
                padding: '10px 20px',
                borderRadius: '24px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                pointerEvents: 'none'
              }}
            >
              {syncFailed ? <HelpCircle size={16} /> : <Check size={16} strokeWidth={3} />}
              <span>{syncToast}</span>
            </div>
          )}

          {/* Short fade between tabs (opacity only: a transform would re-anchor fixed docks inside a tab). */}
          <MotionConfig reducedMotion="user">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16, ease: 'easeOut' }}>
              {isMobile ? (
                <PullToRefresh onRefresh={handleRefreshDashboard}>
                  {renderTabContent()}
                </PullToRefresh>
              ) : (
                renderTabContent()
              )}
            </motion.div>
          </MotionConfig>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <BottomNavBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenMore={() => setShowMoreToolsModal(true)}
            isMoreOpen={showMoreToolsModal}
            hidden={keyboardOpen}
          />
        )}

        {/* More Tools Modal Sheet */}
        <MoreToolsModal 
          isOpen={showMoreToolsModal} 
          onClose={() => setShowMoreToolsModal(false)} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* User Profile & Display Name Modal */}
        <UserProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
        />

        {/* Project Presentation Deck Modal */}
        <PresentationModal 
          isOpen={showPresentationModal} 
          onClose={() => setShowPresentationModal(false)} 
        />

        {/* Platform Documentation Modal */}
        <DocumentationModal 
          isOpen={showDocsModal} 
          onClose={() => setShowDocsModal(false)} 
        />

        {/* Safar Group Join Modal */}
        <JoinGroupModal
          isOpen={showJoinGroupModal}
          onClose={() => setShowJoinGroupModal(false)}
          onJoined={() => {
            setShowJoinGroupModal(false);
            if (refreshUserData) refreshUserData();
          }}
        />

        {/* Teacher Student Detailed Profile Modal */}
        <TeacherStudentProfileModal
          studentId={selectedStudentId}
          isOpen={Boolean(selectedStudentId)}
          onClose={() => setSelectedStudentId(null)}
        />

        {/* Daily Review Reminder Alert Modal */}
        <ReviewReminderAlert 
          onNavigateToReview={(targetTab) => {
            setActiveTab(targetTab || 'five-fortresses');
          }} 
        />

        {/* Milestone & Celebration Confetti Overlay */}
        <CelebrationOverlay />
      </div>
    </div>
  );
};

export default Dashboard;
