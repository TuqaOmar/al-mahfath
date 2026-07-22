import React, { useState, useEffect } from 'react';
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
  Award,
  BarChart2,
  Sparkles,
  Play,
  Mic,
  Volume2,
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
  Menu
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Sidebar } from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AiAssistant from '../components/AiAssistant';
import { Community } from '../components/Community';
import { QuranMapPage } from '../components/QuranMapPage';
import { PostSessionDhikr } from '../components/PostSessionDhikr';
import { QuranInteractiveView } from '../components/QuranInteractiveView';
import { LearningStyleProfiler } from '../components/LearningStyleProfiler';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';
import { AdminPanel } from '../components/AdminPanel';

// Hadiths on the virtues of the Quran
const quranHadiths = [
  { text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source: "رواه البخاري" },
  { text: "اقْرَؤُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ", source: "رواه مسلم" },
  { text: "يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا", source: "رواه الترمذي" },
  { text: "الَّذِي يَقْرَأُ القُرْآنَ وَهُوَ مَاهِرٌ بِهِ مَعَ السَّفَرَةِ الكِرَامِ البَرَرَةِ", source: "متفق عليه" }
];

const Dashboard = () => {
  const { user, logout, deleteAccount, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'admin-panel' : 'home');

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Set default tab for admin users when they log in or user role changes
  useEffect(() => {
    if (user?.role === 'admin') {
      setActiveTab('admin-panel');
    } else {
      setActiveTab('home');
    }
  }, [user]);

  // Track screen size changes for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
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
      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* 1. Spiritual Niyyah & Virtue Banner (زاد الروح وتجديد النية) */}
            <div style={{
              padding: '20px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                    📖 زادك الروحي اليومي وتجديد النية
                  </span>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'serif' }}>
                    « {quranHadiths[hadithIdx].text} »
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                {quranHadiths[hadithIdx].source}
              </span>
            </div>

            {/* 2. Hero Section */}
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              padding: '36px',
              background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
              color: 'white',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{ position: 'relative', zIndex: 2, maxWidth: '650px' }}>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <Sparkles size={16} /> رحلة إيمانية متكاملة للتقرب إلى الله
                </span>

                <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 14px 0', lineHeight: 1.2 }}>
                  احفظ، تدبّر، واعمل بالقرآن الكريم 🌿
                </h1>

                <p style={{ fontSize: '15px', color: '#94A3B8', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                  ليس مجرد نظام حفظ آلي، بل بيئة إيمانية تجمع بين فهم الآيات، تثبيت الحفظ بالحصون الخمسة، والقراءة بها في صلواتك اليومية.
                </p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setActiveTab('daily-session')}
                    style={{ padding: '14px 28px', borderRadius: '12px', background: '#10B981', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={18} /> البدء في ورد اليوم والتدبر
                  </button>
                  <span style={{ color: '#CBD5E1', fontSize: '13px' }}>✨ نية اليوم: الإخلاص في طلب العلم</span>
                </div>
              </div>
            </div>

            {/* 3. Bento Grid Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              
              {/* Memory Score */}
              <Card>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={20} />
                  </div>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '13px' }}>{user?.memoryScore || 100}% ثبات ممتاز</span>
                </div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>درجة استقرار الحفظ (Memory Score)</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{user?.memoryScore || 100}%</p>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#10B981' }}>🟢 ثابت في الصدر: {user?.memorizedPagesCount || 0} صفحة</span>
                </div>
              </Card>

              {/* Streak */}
              <Card>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame size={20} />
                  </div>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '13px' }}>رباط القرآن 🔥</span>
                </div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>أيام صحبة القرآن المتتالية</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{user?.streak || 1} يوم</p>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا»</span>
              </Card>

              {/* Today's Spiritual Application */}
              <Card>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookMarked size={20} />
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px' }}>العمل بالآيات</span>
                </div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>تطبيق اليوم العملي</h3>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  «الإحسان إلى الجار والإنفاق من طيب ما رزقك الله»
                </p>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>مستنبط من آيات الورد اليومي</span>
              </Card>

            </div>

            {/* 4. AI Guidance & Five Fortresses Timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Spiritual & AI Recommendations */}
                <Card style={{ padding: '24px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Sparkles size={24} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)' }}>توجيهات المعلم والموجه الذكي اليومية</h3>
                  </div>
                  <ul style={{ margin: 0, paddingRight: '20px', color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.8 }}>
                    <li>
                      <b>الورد المخصص لك:</b> 
                      {user?.preferences?.juzsMemorized 
                        ? `بناءً على حفظك لـ (${user.preferences.juzsMemorized})، نوصيك بالبدء من الصفحة رقم ${user.preferences.juzsMemorized.includes('لا شيء') ? '1' : '102'} لتثبيت الحفظ الجديد.` 
                        : 'وردك المقترح يبدأ من سورة البقرة صفحة 2 لتهيئة خطة الحفظ الأساسية.'}
                    </li>
                    <li>
                      <b>توصية نمط التعلم المكتشف:</b> 
                      {user?.preferences?.learningStyle?.includes('بصري') && 'بما أن نمطك بصري، يوصى بالتركيز على الروابط البصرية وتظليل الكلمات المتشابهة لتثبيت موضع الآية مكانياً.'}
                      {user?.preferences?.learningStyle?.includes('سمعي') && 'بما أن نمطك سمعي، نوصيك بتكرار الاستماع لتلاوة الشيخ الحصري أو العفاسي 3 مرات متتالية قبل الحفظ صوتاً.'}
                      {!user?.preferences?.learningStyle && 'نوصيك باستعمال مشغل الصوت ومتابعة القراءة بالعينين لربط الحفظ السمعي والبصري معاً.'}
                    </li>
                    <li>
                      <b>العمل بآيات اليوم:</b> استشعر معاني الآيات في تدبر سورة البقرة اليوم، وجسدها في سلوكك اليومي بالصدقة والرفق بالآخرين.
                    </li>
                  </ul>
                </Card>

                {/* Five Fortresses Timeline */}
                <Card style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '20px' }}>🏰 منهجية الحصون الخمسة للثبات</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {[
                      { id: 1, name: '1. قراءة الورد', desc: 'قراءة جزء نظراً' },
                      { id: 2, name: '2. تحضير أسبوعي', desc: 'التهيئة الذهنية لسورة الأسبوع' },
                      { id: 3, name: '3. تحضير قريب', desc: 'تكرار الصفحة قبل الحفظ بـ 15 دقيقة' },
                      { id: 4, name: '4. حفظ جديد', desc: 'كتابة وتثبيت الوجه الجديد' },
                      { id: 5, name: '5. مراجعة بعيدة', desc: 'تكرار المحفوظ السابق في الصلاة' },
                    ].map((fort) => {
                      const isDone = !!fortressesToday[fort.id];
                      return (
                        <div 
                          key={fort.id} 
                          onClick={() => handleToggleFortress(fort.id)}
                          style={{ 
                            padding: '16px 12px', 
                            borderRadius: '16px', 
                            background: isDone ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' : 'var(--bg-color)', 
                            border: `2px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`, 
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            boxShadow: isDone ? '0 4px 12px rgba(16, 185, 129, 0.1)' : 'none'
                          }}
                          title="انقر لتحديث حالة إنجاز الحصن لليوم"
                        >
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: isDone ? 'var(--primary)' : 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>{fort.name}</span>
                          <span style={{ fontSize: '11px', color: isDone ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: isDone ? 'bold' : 'normal' }}>
                            {isDone ? 'تم بنجاح! +50XP ✅' : 'انقر للاكتمال 🔄'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

              </div>

              {/* Right Column: AI Assistant Chat */}
              <Card style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px', padding: '0 8px' }}>المساعد والمعلم الإيماني</h3>
                <AiAssistant />
              </Card>

            </div>

          </div>
        );

      case 'quran-map':
        return <QuranMapPage />;

      case 'daily-session':
        return (
          <Card style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Supplication Before Recitation (دعاء التلاوة والحفظ) */}
            <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', marginBottom: '32px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                🤲 دعاء الافتتاح وتيسير الفهم والحفظ
              </span>
              <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'serif', lineHeight: 1.6 }}>
                «اللَّهُمَّ افْتَحْ عَلَيَّ فُتُوحَ الْعَارِفِينَ بِحِكْمَتِكَ، وَانْشُرْ عَلَيَّ رَحْمَتَكَ، وَذَكِّرْنِي مَا نَسِيتُ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ»
              </p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>🎯 جلسة التسميع والتدبر التفاعلية</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>تلاوة وتدبر الورد اليومي مع التحكم الفوري والتظليل المباشر للآيات</p>
            </div>

            {/* Interactive Verse-Synced Quran View Component */}
            <div style={{ marginBottom: '40px' }}>
              <QuranInteractiveView />
            </div>

            {/* Post-Session Dhikr & Tasbeeh Component */}
            <PostSessionDhikr />
          </Card>
        );

      case 'my-plan':
        return (
          <Card style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>📋 خطتك الشخصية للحفظ والمراجعة (الحصون الخمسة)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
              نظام محكم يضمن ثبات السور وعدم النسيان عبر 5 حصون متكاملة:
            </p>

            {/* Learning Style Scientific Profiler */}
            <div style={{ marginBottom: '36px' }}>
              <LearningStyleProfiler />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {[
                { title: '1. القراءة المستمرة', desc: 'قراءة جزء يومياً للاستماع والاستحواذ', color: '#3B82F6' },
                { title: '2. التحضير الأسبوعي', desc: 'قراءة السورة كاملة بتركيز وتدبر للمعاني', color: '#8B5CF6' },
                { title: '3. التحضير القريب', desc: 'تحضير الصفحة قبل حفظها بـ 15 دقيقة', color: '#EC4899' },
                { title: '4. الحفظ الجديد', desc: 'حفظ الوجه الجديد بإتقان وتأمل', color: '#10B981' },
                { title: '5. المراجعة البعيدة', desc: 'مراجعة ما تم حفظه والقراءة به في الصلاة', color: '#F59E0B' },
              ].map((f, i) => (
                <div key={i} style={{ padding: '24px 16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${f.color}15`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Shield size={24} />
                  </div>
                  <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>{f.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        );

      case 'five-fortresses':
        return <FiveFortressesView setActiveTab={setActiveTab} />;

      case 'ai-assistant':
        return (
          <Card style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>🤖 المعلم والموجه الإيماني الذكي</h2>
            <AiAssistant />
          </Card>
        );

      case 'community':
        return <Community />;

      case 'achievements':
        return (
          <Card style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>🏆 أوسمة وثمار صحبة القرآن</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>محطات إيمانية وتشجيعية في رحلتك مع كتاب الله.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
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
        return (
          <Card style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>📊 تحليلات استقرار الذاكرة والإتقان</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>مؤشرات تفصيلية لقياس جودة تثبيت السور والتقدم الزمني.</p>

            <div style={{ padding: '40px', background: 'var(--bg-color)', borderRadius: '20px', border: '1px solid var(--glass-border)', textAlign: 'center', marginBottom: '24px' }}>
              <TrendingUp size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '8px' }}>معدل الإتقان الثابت: 94%</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>تطور مستمر بفضل المراجعة المتباعدة وتلاوة الورد في الصلاة ✨</p>
            </div>
          </Card>
        );

      case 'admin-panel':
        return <AdminPanel />;

      case 'mind-maps':
        return <MindMapsView />;

      case 'similarities':
        return <SimilaritiesView />;

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

  const mainPaneMarginRight = isMobile ? '0px' : (sidebarCollapsed ? '80px' : '260px');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Sidebar Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
      />

      {/* Main Content Pane */}
      <div style={{ 
        flex: 1, 
        marginRight: mainPaneMarginRight, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* Header */}
        <header style={{ height: '80px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 40px', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label="تفتيح القائمة الجانبية"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Menu size={24} />
              </button>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: isMobile ? '16px' : '24px', color: 'var(--text-primary)', margin: 0 }}>مرحباً بعودتك، {user?.name?.split(' ')[0] || 'أحمد'} 👋</h2>
                <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  🔥 {user?.streak || 1} يوم متتالي
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ⭐ المستوى {user?.level || 1}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>الخبرة: {user?.xp || 100} XP</span>
                <div style={{ width: '120px', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${((user?.xp || 100) % 500) / 5}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>هدفك: {user?.preferences?.dailyTarget || 'صفحة واحدة يومياً'}</span>
              </div>
            </div>
          </div>

          <div className="flex-center" style={{ gap: isMobile ? '8px' : '24px' }}>
            {!isMobile && (
              <div className="flex-center" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', gap: '8px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <Search size={18} color="var(--text-secondary)" />
                <input type="text" placeholder="ابحث في القرآن والتدبر..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }} />
              </div>
            )}
            <div className="flex-center" onClick={toggleTheme} style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              {isDark ? <Sun size={20} color="var(--text-secondary)" /> : <Moon size={20} color="var(--text-secondary)" />}
            </div>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <Bell size={20} color="var(--text-secondary)" />
            </div>
            <div style={{ position: 'relative' }}>
              <img 
                src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'} 
                alt="Profile" 
                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', background: 'var(--primary)', border: '2px solid var(--glass-border)' }} 
                title="خيارات الحساب" 
              />
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  left: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-soft)',
                  padding: '8px',
                  minWidth: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 10
                }}>
                  <button 
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🚪 تسجيل الخروج
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
                        deleteAccount();
                        setShowProfileMenu(false);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 12px',
                      color: '#EF4444',
                      textAlign: 'right',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      width: '100%'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🗑️ حذف الحساب
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Main Content View */}
        <main style={{ padding: isMobile ? '20px 16px' : '40px', flex: 1 }}>
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

const MindMapsView = () => {
  const [selectedSurah, setSelectedSurah] = useState('البقرة');
  
  const surahOptions = ['الفاتحة', 'البقرة', 'آل عمران', 'يوسف', 'الكهف'];

  const getSurahData = (surahName) => {
    switch (surahName) {
      case 'الفاتحة':
        return {
          title: 'سورة الفاتحة (أم الكتاب)',
          axis: 'العبودية والاستعانة والدعاء بالهداية للصراط المستقيم.',
          color: '#10B981',
          nodes: [
            { id: 1, title: 'الحمد والثناء', desc: 'تمجيد الباري وإثبات أسمائه الحسنى وتفرده بالملك يوم القيامة (1-4)' },
            { id: 2, title: 'حقيقة العبادة', desc: 'إفراد الله عز وجل بالخضوع التام والتذلل والاستعانة به وحده (5)' },
            { id: 3, title: 'الدعاء بالثبات', desc: 'طلب الهداية والمسلك الصالح وتجنب مسالك المغضوب عليهم والضالين (6-7)' }
          ]
        };
      case 'البقرة':
        return {
          title: 'سورة البقرة (فسطاط القرآن)',
          axis: 'الاستخلاف في الأرض وإقامة شرائع الله والالتزام بالعهود.',
          color: '#3B82F6',
          nodes: [
            { id: 1, title: 'أصناف الناس', desc: 'المؤمنون، الكافرون، والمنافقون وسلوكياتهم (1-20)' },
            { id: 2, title: 'قصة عمارة الأرض', desc: 'خلق آدم واستخلافه ورفض إبليس السجود (30-39)' },
            { id: 3, title: 'بنو إسرائيل والميثاق', desc: 'قصة ذبح البقرة والتلكؤ ونقض العهود والالتزامات (40-123)' },
            { id: 4, title: 'أحكام التشريع والعبادات', desc: 'أحكام الصيام، النكاح، القصاص، الطلاق، الحج، والقتال (163-284)' },
            { id: 5, title: 'التسليم والجاهزية', desc: 'آية الكرسي، وخاتمة السورة بالدعاء والاستغفار (255, 285-286)' }
          ]
        };
      case 'آل عمران':
        return {
          title: 'سورة آل عمران',
          axis: 'الثبات الفكري والعقائدي والعملي أمام الشبهات والشهوات.',
          color: '#8B5CF6',
          nodes: [
            { id: 1, title: 'التوحيد والقرآن', desc: 'إقرار الألوهية والمحكم والملتزم بالتدبر (1-9)' },
            { id: 2, title: 'عمران وعيسى عليه السلام', desc: 'ولادة مريم وعيسى والمعجزات وتكريم آل عمران (33-64)' },
            { id: 3, title: 'غزوة أحد والدروس', desc: 'التمحيص والصبر وأهمية طاعة القائد والشورى (121-180)' },
            { id: 4, title: 'تأمل الخلق والتفكر', desc: 'آيات أولي الألباب والتفكر في السماوات والأرض (190-200)' }
          ]
        };
      case 'يوسف':
        return {
          title: 'سورة يوسف (أحسن القصص)',
          axis: 'اليقين بالفرج والصبر الجميل وثقة المؤمن بتدبير الخالق سبحانه.',
          color: '#F59E0B',
          nodes: [
            { id: 1, title: 'الرؤيا والمؤامرة', desc: 'رؤيا يوسف عليه السلام، وحسد إخوته وإلقائه في الجب (1-20)' },
            { id: 2, title: 'الابتلاء والفتنة', desc: 'يوسف في بيت العزيز، فتنة امرأة العزيز ودخول السجن (21-53)' },
            { id: 3, title: 'التمكين والملك', desc: 'تأويل رؤيا الملك، وتعيينه على خزائن الأرض وإدارة القحط (54-80)' },
            { id: 4, title: 'لم الشمل والفرج', desc: 'اعتراف الإخوة بالخطأ وسجودهم وتحقق الرؤيا والفرج الجميل (81-100)' }
          ]
        };
      case 'الكهف':
        return {
          title: 'سورة الكهف (عصمة الفتن)',
          axis: 'الفتن الأربع الكبرى وعلاجها: الفتنة في الدين، المال، العلم، والملك.',
          color: '#EC4899',
          nodes: [
            { id: 1, title: 'فتنة الدين (أصحاب الكهف)', desc: 'فرار الفتية بدينهم للاحتماء بالكهف وتثبيتهم بخرق العادة (9-26)' },
            { id: 2, title: 'فتنة المال (صاحب الجنتين)', desc: 'جحود النعمة واعتزاز الفرد بأمواله وتدمير جنتيه للوعي (32-44)' },
            { id: 3, title: 'فتنة العلم (موسى والخضر)', desc: 'الرحلة لطلب العلم والصبر على تدابير القدر التي خفيت حكمتها (60-82)' },
            { id: 4, title: 'فتنة السلطة (ذو القرنين)', desc: 'التمكين في الأرض والعدل وبناء السد لحماية الضعفاء (83-98)' }
          ]
        };
      default:
        return null;
    }
  };

  const data = getSurahData(selectedSurah);

  return (
    <Card style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0 }}>🗺️ الخرائط الذهنية التفاعلية للسور</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>تصور شجري للمحاور الكبرى والمقاصد لتثبيت الحفظ البصري.</p>
        </div>
        
        {/* Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>اختر السورة:</span>
          <select 
            value={selectedSurah} 
            onChange={(e) => setSelectedSurah(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer'
            }}
          >
            {surahOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mindmap Box */}
      {data && (
        <div style={{
          padding: '32px',
          borderRadius: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          position: 'relative'
        }}>
          {/* Surah title and axis */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '22px', color: data.color, margin: '0 0 8px 0' }}>{data.title}</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 'bold', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              {data.axis}
            </p>
          </div>

          {/* Tree Flowchart Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
            {data.nodes.map((node, index) => (
              <div 
                key={node.id} 
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  position: 'relative',
                  background: 'var(--bg-color)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.25s ease',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                {/* Vertical connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: data.color, 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}>
                    {index + 1}
                  </div>
                  {index < data.nodes.length - 1 && (
                    <div style={{ width: '3px', height: '42px', background: `linear-gradient(to bottom, ${data.color}30, transparent)` }} />
                  )}
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>{node.title}</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const SimilaritiesView = () => {
  const [activeSearch, setActiveSearch] = useState('');

  const similarityItems = [
    {
      id: 1,
      topic: 'قولوا آمنا (البقرة) vs قل آمنا (آل عمران)',
      verses: [
        { surah: 'سورة البقرة (136)', text: 'قُولُوا آمَنَّا بِاللَّهِ وَمَا أُنْزِلَ إِلَيْنَا...' },
        { surah: 'سورة آل عمران (84)', text: 'قُلْ آمَنَّا بِاللَّهِ وَمَا أُنْزِلَ عَلَيْنَا...' }
      ],
      rule: 'سورة البقرة هي أطول سور القرآن وبها نداءات للمؤمنين جماعة فخوطب فيها بالجمع (قولوا)، بينما آل عمران خوطب فيها النبي مفرداً (قل).'
    },
    {
      id: 2,
      topic: 'بلداً آمناً (البقرة) vs البلد آمناً (إبراهيم)',
      verses: [
        { surah: 'سورة البقرة (126)', text: 'وَإِذْ قَالَ إِبْرَاهِيمُ رَبِّ اجْعَلْ هَٰذَا بَلَدًا آمِنًا...' },
        { surah: 'سورة إبراهيم (35)', text: 'وَإِذْ قَالَ إِبْرَاهِيمُ رَبِّ اجْعَلْ هَٰذَا الْبَلَدَ آمِنًا...' }
      ],
      rule: 'دعاء البقرة كان قبل بناء البيت فجاء نكرة (بلداً)، ودعاء إبراهيم كان بعد استقرار السكن وعمارتها فجاءت معرفة (البلد).'
    },
    {
      id: 3,
      topic: 'تساقط عليك (مريم) vs يساقط عليك (مريم قراءة)',
      verses: [
        { surah: 'سورة مريم (25)', text: 'وَهُزِّي إِلَيْكِ بِجِذْعِ النَّخْلَةِ تُسَاقِطْ عَلَيْكِ رُطَبًا جَنِيًّا...' },
        { surah: 'قراءات متواترة أخرى', text: '...تَسَّاقَطْ أو يَسَّاقَطْ عَلَيْكِ رُطَبًا...' }
      ],
      rule: 'تُساقط بالتاء لتناسب تأنيث النخلة (بجذع النخلة)، ويَساقط بالياء لتناسب تذكير الرطب (رطباً).'
    }
  ];

  const filteredItems = similarityItems.filter(item => 
    item.topic.toLowerCase().includes(activeSearch.toLowerCase()) ||
    item.rule.toLowerCase().includes(activeSearch.toLowerCase())
  );

  return (
    <Card style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0 }}>🔍 مرشد المتشابهات اللفظية الذكي</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>حلول وقواعد ذهبية للربط بين الآيات المتشابهة لتلاوة دون تلعثم.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="ابحث عن متشابهة..." 
            value={activeSearch}
            onChange={(e) => setActiveSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredItems.map(item => (
          <div 
            key={item.id}
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h4 style={{ margin: 0, fontSize: '17px', color: 'var(--primary)', fontWeight: 'bold' }}>{item.topic}</h4>
            
            {/* Verses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {item.verses.map((v, i) => (
                <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{v.surah}</span>
                  <p style={{ margin: 0, fontSize: '18px', fontFamily: 'serif', color: 'var(--text-primary)', direction: 'rtl', textAlign: 'right', lineHeight: 1.6 }}>
                    ﴿ {v.text} ﴾
                  </p>
                </div>
              ))}
            </div>

            {/* Rule Box */}
            <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', borderRight: '4px solid #F59E0B' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#B45309', display: 'block', marginBottom: '4px' }}>💡 القاعدة الذهبية للتذكر:</span>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{item.rule}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const FiveFortressesView = ({ setActiveTab }) => {
  const { user, updateUserData } = useAuth();
  const fortressesToday = user?.preferences?.fortressesToday || { 1: false, 2: false, 3: false, 4: false, 5: false };

  const currentPage = (user?.memorizedPagesCount || 0) + 1;
  const currentSurah = getSurahNameForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);

  const handleToggleFort = async (id) => {
    const currentStatus = !!fortressesToday[id];
    const newStatus = !currentStatus;
    
    const newFortressesToday = { ...fortressesToday, [id]: newStatus };
    
    let xpChange = newStatus ? 50 : -50;
    let newXp = Math.max(0, (user?.xp || 100) + xpChange);
    let newLevel = Math.floor(newXp / 500) + 1;
    
    updateUserData({
      xp: newXp,
      level: newLevel,
      preferences: {
        ...(user?.preferences || {}),
        fortressesToday: newFortressesToday
      }
    });
  };

  const fortressesData = [
    {
      id: 1,
      title: '1. القراءة المستمرة (الورد نظرًا)',
      desc: 'قراءة جزء كامل يومياً من المصحف نظرًا للاستماع والتهيئة البصرية.',
      target: `الجزء ${currentJuz} بالكامل (الورد البصري اليومي)`,
      color: '#3B82F6',
      actionLabel: 'تحديد كـ تم القراءة 📖'
    },
    {
      id: 2,
      title: '2. التحضير الأسبوعي',
      desc: 'قراءة السورة المستهدفة كاملة بتركيز وتدبر قبل البدء بحفظها.',
      target: `سورة ${currentSurah} (التهيئة الذهنية للأسبوع)`,
      color: '#8B5CF6',
      actionLabel: 'تحديد كـ تم التحضير 🎯'
    },
    {
      id: 3,
      title: '3. التحضير القريب',
      desc: 'تحضير وقراءة الصفحة المستهدفة بتركيز وتدبر قبل الحفظ بـ 15 دقيقة.',
      target: `صفحة ${currentPage} (التحضير السريع)`,
      color: '#EC4899',
      actionLabel: 'تحديد كـ تم التحضير القريب ⏳'
    },
    {
      id: 4,
      title: '4. الحفظ الجديد',
      desc: 'حفظ وجه جديد بإتقان وتأمل وتكرار صوته مع المعلم.',
      target: `صفحة ${currentPage} من سورة ${currentSurah}`,
      color: '#10B981',
      actionLabel: 'ابدأ تمرين التسميع والحفظ 🎤',
      isInteractive: true
    },
    {
      id: 5,
      title: '5. المراجعة البعيدة',
      desc: 'مراجعة الصفحات المحفوظة سابقاً بانتظام والتلاوة بها في الصلاة لتثبيتها.',
      target: `مراجعة الصفحات من 1 إلى ${Math.max(1, currentPage - 1)}`,
      color: '#F59E0B',
      actionLabel: 'تحديد كـ تم المراجعة والتلاوة 🤲'
    }
  ];

  return (
    <Card style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0 }}>🏰 نظام المتابعة اليومي للحصون الخمسة</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>
          نظام محكم يضمن ثبات السور ومنع التفلت عبر متابعة الورد والحفظ والمراجعة بشكل يومي تفاعلي.
        </p>
      </div>

      {/* Progress Summary */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1px solid var(--primary)',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>إجمالي الإنجاز لليوم:</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', color: 'var(--text-primary)' }}>
            تم إنجاز {Object.values(fortressesToday).filter(Boolean).length} من أصل 5 حصون
          </h3>
        </div>
        <div style={{ width: '150px', height: '10px', background: 'var(--glass-border)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${(Object.values(fortressesToday).filter(Boolean).length / 5) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Fortresses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {fortressesData.map((f) => {
          const isDone = !!fortressesToday[f.id];
          return (
            <div 
              key={f.id}
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: isDone ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)' : 'var(--bg-surface)',
                border: `1px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: `${f.color}15`, 
                  color: f.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={22} fill={isDone ? f.color : 'none'} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', color: 'var(--text-primary)' }}>{f.title}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
                  <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '20px', background: 'var(--bg-color)', color: f.color, fontWeight: 'bold', border: '1px solid var(--glass-border)' }}>
                    🎯 المستهدف: {f.target}
                  </span>
                </div>
              </div>

              {/* Action Trigger */}
              <div>
                {f.isInteractive && !isDone ? (
                  <button
                    onClick={() => setActiveTab('daily-session')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {f.actionLabel}
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleFort(f.id)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`,
                      background: isDone ? 'var(--primary-light)' : 'var(--bg-color)',
                      color: isDone ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isDone ? 'تم بنجاح! +50XP ✓' : f.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default Dashboard;
