import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Volume2,
  VolumeX,
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
  Compass,
  Star,
  Menu,
  Globe,
  RefreshCw,
  Users,
  Plus
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Sidebar } from '../components/Sidebar';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
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
import { FloatingAiButton } from '../components/FloatingAiButton';
import { QuickSettingsMenu } from '../components/QuickSettingsMenu';
import { SimilaritiesView } from '../components/SimilaritiesView';
import { MindMapsView } from '../components/MindMapsView';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { JoinGroupModal } from '../components/onboarding/JoinGroupModal';
import { TeacherDashboard } from '../components/teacher/TeacherDashboard';
import { TeacherStudentsView } from '../components/teacher/TeacherStudentsView';
import { TeacherStudentProfileModal } from '../components/teacher/TeacherStudentProfileModal';
import { TeacherGroupsView } from '../components/teacher/TeacherGroupsView';
import { TeacherReportsView } from '../components/teacher/TeacherReportsView';
import { AdminDashboard } from '../components/admin/AdminDashboard';


// Hadiths on the virtues of the Quran
const quranHadiths = [
  { text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source: "رواه البخاري" },
  { text: "اقْرَؤُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ", source: "رواه مسلم" },
  { text: "يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا", source: "رواه الترمذي" },
  { text: "الَّذِي يَقْرَأُ القُرْآنَ وَهُوَ مَاهِرٌ بِهِ مَعَ السَّفَرَةِ الكِرَامِ البَرَرَةِ", source: "متفق عليه" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, deleteAccount, updateUserData, refreshUserData } = useAuth();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState(
    user?.role === 'admin' ? 'admin-dashboard' : (user?.role === 'teacher' ? 'teacher-dashboard' : 'home')
  );
  const [selectedQuranPage, setSelectedQuranPage] = useState(2);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentFilter, setStudentFilter] = useState('all');
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState('');
  const { soundEnabled, toggleSound } = useNotifications();

  const handleRefreshDashboard = async () => {
    setIsSyncing(true);
    try {
      if (typeof refreshUserData === 'function') {
        await refreshUserData();
      }
      setSyncToast(isRTL ? 'تمت مزامنة وتحديث بيانات الحفظ بنجاح 🌿' : 'Progress & recitation synced successfully 🌿');
      setTimeout(() => setSyncToast(''), 2500);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'presentation') {
      setShowPresentationModal(true);
      setActiveTab('home');
    } else if (activeTab === 'docs') {
      setShowDocsModal(true);
      setActiveTab('home');
    }
  }, [activeTab]);

  const fortressesToday = user?.preferences?.fortressesToday || { 1: false, 2: false, 3: false, 4: false, 5: false };

  const handleToggleFortress = async (fortId) => {
    const currentStatus = !!fortressesToday[fortId];
    const newStatus = !currentStatus;
    
    const newFortressesToday = { ...fortressesToday, [fortId]: newStatus };
    
    // Calculate XP change
    let xpChange = newStatus ? 50 : -50;
    let newXp = Math.max(0, (user?.xp || 100) + xpChange);
    let newLevel = Math.floor(newXp / 500) + 1;
    
    // Update preferences object
    const newPreferences = {
      ...(user?.preferences || {}),
      fortressesToday: newFortressesToday
    };
    
    // Call the AuthContext updateUserData
    updateUserData({
      xp: newXp,
      level: newLevel,
      preferences: newPreferences
    });
  };
  const { isDark, toggleTheme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [hadithIdx, setHadithIdx] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1280 : false;
  });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isLaptop, setIsLaptop] = useState(typeof window !== 'undefined' && window.innerWidth < 1340);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMoreToolsModal, setShowMoreToolsModal] = useState(false);

  // Set default tab only when user logs in or user role changes
  const lastUserRoleRef = useRef(user?.role);
  const lastUserIdRef = useRef(user?.uid);

  useEffect(() => {
    const isNewUser = user?.uid && user?.uid !== lastUserIdRef.current;
    const isRoleChanged = user?.role !== lastUserRoleRef.current;

    if (isNewUser || isRoleChanged) {
      lastUserIdRef.current = user?.uid;
      lastUserRoleRef.current = user?.role;
      if (user?.role === 'admin') {
        setActiveTab('admin-dashboard');
      } else if (user?.role === 'teacher') {
        setActiveTab('teacher-dashboard');
      } else {
        setActiveTab('home');
      }
    }
  }, [user?.uid, user?.role]);

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
    // If Teacher lands on home, render their dedicated Teacher Dashboard
    if (activeTab === 'home' && user?.role === 'teacher') {
      return (
        <TeacherDashboard
          onOpenStudentProfile={(sId) => setSelectedStudentId(sId)}
          onViewAllStudents={(filter) => {
            setStudentFilter(filter || 'all');
            setActiveTab('teacher-students');
          }}
          onViewGroups={() => setActiveTab('teacher-groups')}
        />
      );
    }

    // If Admin lands on home, render their dedicated Admin Dashboard
    if (activeTab === 'home' && user?.role === 'admin') {
      return <AdminDashboard activeAdminTab="dashboard" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;
    }

    switch (activeTab) {
      case 'teacher-dashboard':
        return (
          <TeacherDashboard
            onOpenStudentProfile={(sId) => setSelectedStudentId(sId)}
            onViewAllStudents={(filter) => {
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
            onOpenStudentProfile={(sId) => setSelectedStudentId(sId)}
          />
        );

      case 'teacher-groups':
        return (
          <TeacherGroupsView
            onViewStudentsInGroup={() => {
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

      case 'admin-analytics':
        return <AdminDashboard activeAdminTab="analytics" onNavigateTab={(t) => setActiveTab('admin-' + t)} />;

      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '1040px', margin: '0 auto', paddingBottom: isMobile ? '80px' : '20px' }}>
            
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
                      عضوة مسجلة في {user?.groupName || 'حلقة النور والهدى'} 🌸
                    </strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      المعلمة المشرفة: {user?.teacherName || 'أ. عائشة العتيبي'} • متابعة دورية للأوراد والتسميع
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                  سَفَر نشط 🟢
                </span>
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
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: isMobile ? '8px' : '16px'
            }}>
              
              {/* Memorized Pages */}
              <Card style={{ padding: isMobile ? '12px 10px' : '20px', textAlign: isMobile ? 'center' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', marginBottom: '8px' }}>
                  {!isMobile && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>المحفوظ</span>}
                  <div style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={isMobile ? 15 : 18} />
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {user?.memorizedPagesCount || 0} {!isMobile && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>صفحة</span>}
                </div>
                <span style={{ fontSize: isMobile ? '10.5px' : '12px', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isMobile ? 'صفحة محفوظة' : 'من أصل 604 صفحة'}
                </span>
              </Card>

              {/* Memory Stability Score */}
              <Card style={{ padding: isMobile ? '12px 10px' : '20px', textAlign: isMobile ? 'center' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', marginBottom: '8px' }}>
                  {!isMobile && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>ثبات الحفظ</span>}
                  <div style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={isMobile ? 15 : 18} />
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {user?.memorizedPagesCount > 0 ? `${user?.memoryScore || 100}%` : '--%'}
                </div>
                <span style={{ fontSize: isMobile ? '10.5px' : '12px', color: user?.memorizedPagesCount > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {user?.memorizedPagesCount > 0 
                    ? (isMobile ? 'ثبات ممتاز' : 'معدل استقرار ممتاز') 
                    : (isMobile ? 'في انتظار جلستك' : 'في انتظار الجلسة الأولى')}
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
                <div style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {user?.streak || 1} {!isMobile && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>يوم</span>}
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
                  {Object.values(fortressesToday).filter(Boolean).length} / 5 منجزة
                </div>
              </div>

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
                        cursor: 'pointer',
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
                          {fort.sub}
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

            {/* 4. Quick Access Hub (3 Core Navigation Cards) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              <div 
                onClick={() => setActiveTab('quran-map')}
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-soft)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Compass size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    خريطة القرآن (604)
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    تصفح صفحات المصحف ومتابعة الإنجاز
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('five-fortresses')}
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-soft)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    الحصون الخمسة
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    منهجية التحضير والحفظ والمراجعة
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('ai-assistant')}
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-soft)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    المعلم الإيماني الذكي
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    إجابات فورية وتفسير ومتشابهات
                  </p>
                </div>
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
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'serif' }}>
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
              <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'serif', lineHeight: 1.6 }}>
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
            <FiveFortressesPlan setActiveTab={setActiveTab} />
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
        return <Community setActiveTab={setActiveTab} />;

      case 'achievements':
        return (
          <Card style={{ padding: isMobile ? '20px 16px' : '32px' }}>
            <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>🏆 أوسمة وثمار صحبة القرآن</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>محطات إيمانية وتشجيعية في رحلتك مع كتاب الله.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[
                { title: 'رباط الاستمرار', desc: 'صحبة متتالية لكتاب الله لـ 7 أيام أو أكثر', unlocked: (user?.streak >= 7), icon: Flame },
                { title: 'حافظ البقرة', desc: 'حفظ سورة البقرة بالكامل (أكثر من 48 صفحة)', unlocked: (user?.memorizedPagesCount >= 49), icon: Award },
                { title: 'المستمع الحاضر', desc: 'الحصول على خبرة تراكمية تزيد عن 500 XP', unlocked: (user?.xp >= 500), icon: Sparkles },
                { title: 'فارس الحصون', desc: 'التزام بإنجاز 3 حصون يومية أو أكثر اليوم', unlocked: (Object.values(fortressesToday).filter(Boolean).length >= 3), icon: Shield },
                { title: 'المتدبر الخاشع', desc: 'حفظ أكثر من 10 صفحات بدرجة استقرار تزيد عن 95%', unlocked: (user?.memorizedPagesCount >= 10 && user?.memoryScore >= 95), icon: Brain },
                { title: 'أهل القرآن', desc: 'بلوغ المستوى الخامس في رحلة تدبر القرآن', unlocked: (user?.level >= 5), icon: Trophy },
              ].map((badge, i) => (
                <div key={i} style={{ padding: '28px 20px', borderRadius: '20px', background: badge.unlocked ? 'var(--primary-light)' : 'var(--bg-color)', border: `1px solid ${badge.unlocked ? 'var(--primary)' : 'var(--glass-border)'}`, textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: badge.unlocked ? 'var(--primary)' : 'var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <badge.icon size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{badge.title}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{badge.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        );

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

  const mainPaneMargin = isMobile ? '0px' : (sidebarCollapsed ? '76px' : '260px');
  const mainPaneStyles = isRTL 
    ? { marginRight: mainPaneMargin, marginLeft: 0, transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
    : { marginLeft: mainPaneMargin, marginRight: 0, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Primary Navigation Sidebar / Mobile Slide-out Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        onOpenProfile={() => setShowProfileModal(true)}
      />

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
        
        {/* Header / Top App Bar */}
        <header style={{ 
          minHeight: isMobile ? '56px' : '64px',
          height: 'auto',
          borderBottom: '1px solid var(--glass-border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: isMobile 
            ? 'max(8px, env(safe-area-inset-top)) 16px 8px 16px' 
            : (isLaptop ? '10px 20px' : '0 32px'), 
          background: 'var(--bg-surface)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 30,
          flexWrap: 'nowrap',
          gap: '8px'
        }}>
          {isMobile ? (
            /* Mobile View: Drawer toggle + Compact profile card + Quick Settings */
            <>
              {/* Left / Start: Drawer Toggle & Compact Profile Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <button
                  id="mobile-drawer-toggle-btn"
                  onClick={() => {
                    if (navigator?.vibrate) {
                      try { navigator.vibrate(10); } catch (e) {}
                    }
                    setSidebarCollapsed(!sidebarCollapsed);
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title={isRTL ? 'فتح القائمة الجانبية (الدروار)' : 'Open Drawer Menu'}
                  aria-label="Navigation Drawer"
                >
                  <Menu size={19} />
                </button>

                <div 
                  id="header-user-profile-card"
                onClick={() => {
                  if (navigator?.vibrate) {
                    try { navigator.vibrate(12); } catch (e) {}
                  }
                  setShowProfileModal(true);
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '16px',
                  userSelect: 'none',
                  minWidth: 0
                }}
                title={isRTL ? 'عرض وتعديل الملف الشخصي' : 'View & edit profile'}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img 
                    src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'} 
                    alt="Profile" 
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'var(--primary)', 
                      border: '2px solid var(--primary)',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                      objectFit: 'cover'
                    }} 
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    [isRTL ? 'left' : 'right']: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid var(--bg-surface)'
                  }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 800, 
                      color: 'var(--text-primary)', 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px'
                    }}>
                      {user?.name || (isRTL ? 'يا حافظ القرآن' : 'Learner')}
                    </span>
                    <span 
                      style={{ 
                        padding: '2px 7px', 
                        borderRadius: '12px', 
                        background: 'rgba(245, 158, 11, 0.15)', 
                        color: '#F59E0B', 
                        fontWeight: 800, 
                        fontSize: '11px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '3px',
                        whiteSpace: 'nowrap'
                      }}
                      title={isRTL ? 'أيام صحبة القرآن' : 'Quran Companion Days'}
                    >
                      🔥 {user?.streak || 1} {isRTL ? 'صحبة القرآن' : 'd'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

              {/* Right / End: RoleSwitcher, Notification, Theme & Quick Settings */}
              <div className="flex-center" style={{ gap: '6px', flexWrap: 'nowrap' }}>
                <RoleSwitcher />
                <NotificationCenter />
                <ThemeToggle variant="pill" size="small" />
                <QuickSettingsMenu
                  soundEnabled={soundEnabled}
                  toggleSound={toggleSound}
                  isSyncing={isSyncing}
                  handleRefresh={handleRefreshDashboard}
                  onOpenProfile={() => setShowProfileModal(true)}
                  onOpenDocs={() => setShowDocsModal(true)}
                  onOpenPresentation={() => setShowPresentationModal(true)}
                  isMobile={true}
                />
              </div>
            </>
          ) : (
            /* Laptop / Desktop View: Original full desktop bar */
            <>
              {/* Left / Start: Greeting, Edit Name & Quran Companion Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isLaptop ? '6px' : '10px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <h2 style={{ 
                    fontSize: isLaptop ? '16px' : '20px', 
                    fontWeight: 700, 
                    color: 'var(--text-primary)', 
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: isLaptop ? '160px' : '260px'
                  }}>
                    مرحباً، {user?.name || (isRTL ? 'يا حافظ القرآن' : 'Learner')} 👋
                  </h2>
                  {!isLaptop && (
                    <button
                      type="button"
                      id="header-edit-name-btn"
                      onClick={() => setShowProfileModal(true)}
                      style={{
                        background: 'var(--primary-light)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={isRTL ? 'تعديل اسمك وملفك الشخصي' : 'Edit name & profile'}
                    >
                      ✏️ <span>{isRTL ? 'تعديل الاسم' : 'Edit Name'}</span>
                    </button>
                  )}
                </div>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  color: '#F59E0B', 
                  fontWeight: 'bold', 
                  fontSize: '12px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}>
                  🔥 {user?.streak || 1} {isRTL ? 'أيام صحبة القرآن' : 'd'}
                </span>
              </div>

              {/* Right / End: RoleSwitcher + Desktop Tools & Actions */}
              <div className="flex-center" style={{ gap: isLaptop ? '6px' : '10px', flexWrap: 'nowrap' }}>
                <RoleSwitcher />

                {/* On wider screens without drawer constraints, display direct quick buttons */}
                {!isLaptop && (
                  <>
                    {/* Sync & Refresh Button */}
                    <button
                      id="header-sync-refresh-btn"
                      onClick={handleRefreshDashboard}
                      disabled={isSyncing}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '12px',
                        background: isSyncing ? 'rgba(16, 185, 129, 0.2)' : 'var(--primary-light)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary-border)',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: isSyncing ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      title={isRTL ? 'مزامنة وتحديث تقدم الحفظ والبيانات' : 'Sync & Refresh Progress'}
                    >
                      <RefreshCw
                        size={14}
                        style={{
                          animation: isSyncing ? 'spin 0.75s linear infinite' : 'none'
                        }}
                      />
                      <span>{isSyncing ? (isRTL ? 'جاري المزامنة...' : 'Syncing...') : (isRTL ? 'مزامنة' : 'Sync')}</span>
                    </button>

                    {/* Language Switcher */}
                    <button
                      id="header-lang-btn"
                      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s ease',
                        height: '36px'
                      }}
                      title={t('lang_select')}
                    >
                      <Globe size={13} />
                      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
                    </button>

                    {/* Presentation Deck */}
                    <button
                      id="header-presentation-btn"
                      onClick={() => setShowPresentationModal(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--primary)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        height: '36px'
                      }}
                      title={isRTL ? 'عرض تقديمي تعريفي للمنصة 📽️' : 'Platform Presentation Deck 📽️'}
                    >
                      <Presentation size={15} />
                      <span>{isRTL ? 'عرض المنصة' : 'Deck'}</span>
                    </button>

                    {/* Documentation */}
                    <button
                      id="header-docs-btn"
                      onClick={() => setShowDocsModal(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        height: '36px'
                      }}
                      title={isRTL ? 'دليل وتوثيق المنصة الشامل 📚' : 'Platform Documentation 📚'}
                    >
                      <BookOpen size={15} />
                      <span>{isRTL ? 'التوثيق' : 'Docs'}</span>
                    </button>

                    {/* Sound Toggle */}
                    <button
                      id="header-sound-mute-btn"
                      onClick={toggleSound}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: soundEnabled ? 'var(--primary-light)' : 'rgba(239, 68, 68, 0.12)',
                        color: soundEnabled ? 'var(--primary)' : '#EF4444',
                        border: `1px solid ${soundEnabled ? 'var(--glass-border)' : 'rgba(239, 68, 68, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title={soundEnabled ? (isRTL ? 'كتم النغمات والأصوات' : 'Mute sound') : (isRTL ? 'تشغيل النغمات والأصوات' : 'Unmute sound')}
                    >
                      {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                  </>
                )}

                {/* On laptop / when drawer is open, QuickSettingsMenu neatly bundles Sync, Sound, Lang, Deck, Docs */}
                {isLaptop && (
                  <QuickSettingsMenu
                    soundEnabled={soundEnabled}
                    toggleSound={toggleSound}
                    isSyncing={isSyncing}
                    handleRefresh={handleRefreshDashboard}
                    onOpenProfile={() => setShowProfileModal(true)}
                    onOpenDocs={() => setShowDocsModal(true)}
                    onOpenPresentation={() => setShowPresentationModal(true)}
                    isMobile={false}
                  />
                )}

                {/* Notification Center */}
                <NotificationCenter />

                {/* Theme Toggle */}
                <ThemeToggle variant="pill" size="medium" />

                {/* Profile Avatar with Dropdown Menu */}
                <div style={{ position: 'relative' }}>
                  <img 
                    src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'} 
                    alt="Profile" 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: '50%', 
                      cursor: 'pointer', 
                      background: 'var(--primary)', 
                      border: '2px solid var(--primary)',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                      objectFit: 'cover'
                    }} 
                    title="خيارات الحساب" 
                  />
                  {showProfileMenu && (
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                        onClick={() => setShowProfileMenu(false)} 
                      />
                      <div style={{
                        position: 'absolute',
                        top: '46px',
                        left: isRTL ? 0 : 'auto',
                        right: isRTL ? 'auto' : 0,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                        padding: '8px',
                        minWidth: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        zIndex: 100
                      }}>
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowProfileModal(true);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            textAlign: isRTL ? 'right' : 'left',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 600,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          👤 {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                        </button>
                        <button 
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                            navigate('/');
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            textAlign: isRTL ? 'right' : 'left',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            fontSize: '13px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          🚪 {isRTL ? 'تسجيل الخروج' : 'Logout'}
                        </button>
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '10px 14px',
                            color: '#EF4444',
                            textAlign: isRTL ? 'right' : 'left',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          🗑️ {isRTL ? 'حذف الحساب' : 'Delete Account'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
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
                    await deleteAccount();
                    navigate('/');
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
              style={{
                position: 'fixed',
                top: 'calc(68px + env(safe-area-inset-top, 0px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.94)',
                color: '#34D399',
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
              <Check size={16} strokeWidth={3} />
              <span>{syncToast}</span>
            </div>
          )}

          {isMobile ? (
            <PullToRefresh onRefresh={handleRefreshDashboard}>
              {renderTabContent()}
            </PullToRefresh>
          ) : (
            renderTabContent()
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <BottomNavBar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenMore={() => setShowMoreToolsModal(true)} 
            onOpenProfile={() => setShowProfileModal(true)}
            isProfileOpen={showProfileModal}
          />
        )}

        {/* Global Floating Action Button & Assistant for "المعلم الذكي" (Mobile Only) */}
        {isMobile && <FloatingAiButton activeTab={activeTab} />}

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
          onJoinedSuccess={() => {
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
