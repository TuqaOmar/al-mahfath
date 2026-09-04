import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
  Layers,
  Flame,
  Award
} from 'lucide-react';
import { getSurahNameForPage, getJuzForPage, getPageRangeForJuz } from '../utils/quranData';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

// Helper to construct initial 604 pages accurately based on user's portfolio
const buildQuranPagesData = (user) => {
  const userPages = Array.isArray(user?.memorizedPages) ? user.memorizedPages : [];
  const userJuzs = Array.isArray(user?.preferences?.selectedJuzList) ? user.preferences.selectedJuzList : [];
  const count = Number(user?.memorizedPagesCount) || 0;

  const memorizedSet = new Set(userPages);

  // If specific pages list is empty but selectedJuzList is present, populate from Juzs
  if (userPages.length === 0 && userJuzs.length > 0) {
    userJuzs.forEach(juzNum => {
      const range = getPageRangeForJuz(juzNum);
      for (let p = range.startPage; p <= range.endPage; p++) {
        memorizedSet.add(p);
      }
    });
  } else if (userPages.length === 0 && userJuzs.length === 0 && count > 0) {
    // Fallback for legacy account with only count
    for (let p = 1; p <= Math.min(604, count); p++) {
      memorizedSet.add(p);
    }
  }

  // Load custom local reviews if stored for this user
  const savedReviewsKey = `ma7fath_${user?.uid || 'guest'}_quran_page_reviews`;
  let savedReviews = {};
  try {
    savedReviews = JSON.parse(localStorage.getItem(savedReviewsKey) || '{}');
  } catch (e) {}

  const pages = [];
  for (let i = 1; i <= 604; i++) {
    const isMemorized = memorizedSet.has(i);
    const custom = savedReviews[i];

    let status = 'unmemorized';
    let score = 0;
    let lastReviewed = 'لم يراجع بعد';
    let errorsCount = 0;

    if (custom) {
      status = custom.status;
      score = custom.score;
      lastReviewed = custom.lastReviewed || 'اليوم';
      errorsCount = custom.errorsCount || 0;
    } else if (isMemorized) {
      if (i % 9 === 0) {
        status = 'review';
        score = 78;
        lastReviewed = 'منذ يومين';
        errorsCount = 1;
      } else if (i % 17 === 0) {
        status = 'critical';
        score = 55;
        lastReviewed = 'منذ ٤ أيام';
        errorsCount = 3;
      } else {
        status = 'excellent';
        score = 96;
        lastReviewed = 'اليوم';
        errorsCount = 0;
      }
    }

    pages.push({
      pageNumber: i,
      juz: getJuzForPage(i),
      status,
      score,
      lastReviewed,
      errorsCount,
      surahName: getSurahNameForPage(i)
    });
  }

  return pages;
};

export const QuranMapPage = () => {
  const { user, updateUserData } = useAuth();
  const { notifyAndCelebrate } = useNotifications();
  const { isRTL, lang } = useLanguage();

  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'excellent' | 'review' | 'critical' | 'memorized'
  const [activeJuzTab, setActiveJuzTab] = useState('all'); // 'all' | 1 to 30
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [quickPagesInput, setQuickPagesInput] = useState('0');
  const [statusMessage, setStatusMessage] = useState('');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isCompact, setIsCompact] = useState(typeof window !== 'undefined' && window.innerWidth < 1180);
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsCompact(w < 1180);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and update pages when user changes
  useEffect(() => {
    const initialPages = buildQuranPagesData(user);
    setPages(initialPages);
    setQuickPagesInput((user?.memorizedPagesCount || initialPages.filter(p => p.status !== 'unmemorized').length).toString());
  }, [user?.uid, user?.memorizedPagesCount, user?.memorizedPages, user?.preferences?.selectedJuzList]);

  const activeMemorizedPages = pages.filter(p => p.status !== 'unmemorized');
  const activeMemorizedCount = activeMemorizedPages.length;
  const excellentCount = pages.filter(p => p.status === 'excellent').length;
  const reviewCount = pages.filter(p => p.status === 'review').length;
  const criticalCount = pages.filter(p => p.status === 'critical').length;

  // Calculate completed Juzs (where all pages in that Juz are memorized)
  const completedJuzs = [];
  for (let j = 1; j <= 30; j++) {
    const range = getPageRangeForJuz(j);
    const juzPages = pages.filter(p => p.pageNumber >= range.startPage && p.pageNumber <= range.endPage);
    const isCompleted = juzPages.length > 0 && juzPages.every(p => p.status !== 'unmemorized');
    if (isCompleted) completedJuzs.push(j);
  }

  // Update a single page status
  const handleUpdatePageStatus = async (pageNumber, newStatus, newScore) => {
    const updatedPages = pages.map(p => {
      if (p.pageNumber === pageNumber) {
        return {
          ...p,
          status: newStatus,
          score: newScore,
          lastReviewed: newStatus !== 'unmemorized' ? 'اليوم' : 'لم يراجع بعد'
        };
      }
      return p;
    });

    setPages(updatedPages);

    const updatedSelected = updatedPages.find(p => p.pageNumber === pageNumber);
    if (updatedSelected) {
      setSelectedPage(updatedSelected);
    }

    // Persist to local storage reviews for current user
    const savedReviewsKey = `ma7fath_${user?.uid || 'guest'}_quran_page_reviews`;
    let savedReviews = {};
    try {
      savedReviews = JSON.parse(localStorage.getItem(savedReviewsKey) || '{}');
    } catch (e) {}
    savedReviews[pageNumber] = {
      status: newStatus,
      score: newScore,
      lastReviewed: 'اليوم',
      errorsCount: newStatus === 'critical' ? 3 : (newStatus === 'review' ? 1 : 0)
    };
    localStorage.setItem(savedReviewsKey, JSON.stringify(savedReviews));

    // Update user's memorized pages array
    const newMemorizedPages = updatedPages
      .filter(p => p.status !== 'unmemorized')
      .map(p => p.pageNumber)
      .sort((a, b) => a - b);

    const newCount = newMemorizedPages.length;
    const calcJuz = Number((newCount / 20).toFixed(1));

    await updateUserData({
      memorizedPages: newMemorizedPages,
      memorizedPagesCount: newCount,
      totalJuz: calcJuz
    });

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memorizedPages: newMemorizedPages,
            memorizedPagesCount: newCount,
            totalJuz: calcJuz
          })
        });
      } catch (e) {
        console.error('Error syncing user level:', e);
      }
    }

    if (newStatus === 'excellent') {
      notifyAndCelebrate({
        title: `إتقان ممتاز للصفحة ${pageNumber}! 🟢`,
        message: `أحسنت! أثبتت حفظ الصفحة ${pageNumber} (${updatedSelected?.surahName || ''}) بتقدير ممتاز!`,
        type: 'achievement',
        xpBonus: 60,
        badgeTitle: 'حافظ متقن'
      });
    }

    setStatusMessage(`تم تحديث حالة الصفحة ${pageNumber} في محفظتك بنجاح ✨`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Bulk set entire Juz as Memorized or Unmemorized
  const handleBulkSetJuzStatus = async (juzNum, shouldMemorize) => {
    const range = getPageRangeForJuz(juzNum);
    const updatedPages = pages.map(p => {
      if (p.pageNumber >= range.startPage && p.pageNumber <= range.endPage) {
        return {
          ...p,
          status: shouldMemorize ? 'excellent' : 'unmemorized',
          score: shouldMemorize ? 95 : 0,
          lastReviewed: shouldMemorize ? 'اليوم' : 'لم يراجع بعد'
        };
      }
      return p;
    });

    setPages(updatedPages);

    // Save reviews
    const savedReviewsKey = `ma7fath_${user?.uid || 'guest'}_quran_page_reviews`;
    let savedReviews = {};
    try {
      savedReviews = JSON.parse(localStorage.getItem(savedReviewsKey) || '{}');
    } catch (e) {}

    for (let p = range.startPage; p <= range.endPage; p++) {
      savedReviews[p] = {
        status: shouldMemorize ? 'excellent' : 'unmemorized',
        score: shouldMemorize ? 95 : 0,
        lastReviewed: shouldMemorize ? 'اليوم' : 'لم يراجع بعد',
        errorsCount: 0
      };
    }
    localStorage.setItem(savedReviewsKey, JSON.stringify(savedReviews));

    const newMemorizedPages = updatedPages
      .filter(p => p.status !== 'unmemorized')
      .map(p => p.pageNumber)
      .sort((a, b) => a - b);

    const newCount = newMemorizedPages.length;
    const calcJuz = Number((newCount / 20).toFixed(1));

    // Update selectedJuzList
    let currentJuzList = Array.isArray(user?.preferences?.selectedJuzList) ? [...user.preferences.selectedJuzList] : [];
    if (shouldMemorize && !currentJuzList.includes(juzNum)) {
      currentJuzList.push(juzNum);
      currentJuzList.sort((a, b) => a - b);
    } else if (!shouldMemorize) {
      currentJuzList = currentJuzList.filter(j => j !== juzNum);
    }

    const updatedPreferences = {
      ...(user?.preferences || {}),
      selectedJuzList: currentJuzList
    };

    await updateUserData({
      memorizedPages: newMemorizedPages,
      memorizedPagesCount: newCount,
      totalJuz: calcJuz,
      preferences: updatedPreferences
    });

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memorizedPages: newMemorizedPages,
            memorizedPagesCount: newCount,
            totalJuz: calcJuz,
            preferences: updatedPreferences
          })
        });
      } catch (e) {
        console.error('Error syncing bulk juz:', e);
      }
    }

    notifyAndCelebrate({
      title: shouldMemorize ? `تم اعتماد الجزء ${juzNum} كاملاً! 📗` : `تم إلغاء تحديد الجزء ${juzNum}`,
      message: shouldMemorize ? `مبارك! أضيفت جميع صفحات الجزء ${juzNum} لمحفظتك بنجاح.` : `تم تحديث صفحات الجزء ${juzNum} كغير محفوظة.`,
      type: 'achievement',
      xpBonus: shouldMemorize ? 100 : 0
    });

    setStatusMessage(shouldMemorize ? `تم تعليم الجزء ${juzNum} كاملاً كمحفوظ! 🎉` : `تم إلغاء تحديد الجزء ${juzNum}`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Quick update memorized count modal
  const handleQuickUpdateLevel = async (newCountNum) => {
    const newCount = Math.min(604, Math.max(0, Number(newCountNum) || 0));
    const newPages = [];
    const newMemorizedArr = [];

    for (let i = 1; i <= 604; i++) {
      const isMem = i <= newCount;
      if (isMem) newMemorizedArr.push(i);
      newPages.push({
        pageNumber: i,
        juz: getJuzForPage(i),
        status: isMem ? 'excellent' : 'unmemorized',
        score: isMem ? 95 : 0,
        lastReviewed: isMem ? 'اليوم' : 'لم يراجع بعد',
        errorsCount: 0,
        surahName: getSurahNameForPage(i)
      });
    }

    setPages(newPages);
    setShowLevelModal(false);

    const calcJuz = Number((newCount / 20).toFixed(1));
    await updateUserData({
      memorizedPages: newMemorizedArr,
      memorizedPagesCount: newCount,
      totalJuz: calcJuz
    });

    notifyAndCelebrate({
      title: '🗺️ تحديث مستوى الخريطة القرآنية!',
      message: `تم تحديث مستوى حفظك إلى ${newCount} صفحة (${calcJuz} جزءاً) بنجاح!`,
      type: 'achievement',
      xpBonus: 80,
      badgeTitle: 'فارس الخريطة'
    });

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memorizedPages: newMemorizedArr,
            memorizedPagesCount: newCount,
            totalJuz: calcJuz
          })
        });
      } catch (e) {
        console.error('Error updating user memorized count:', e);
      }
    }

    setStatusMessage(`تم تحديث مستوى الحفظ إلى ${newCount} صفحة بنجاح! 🎉`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Filtered pages for grid view
  const filteredPages = pages.filter(p => {
    const matchesSearch = searchQuery === '' || p.pageNumber.toString().includes(searchQuery) || p.surahName.includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'memorized') matchesStatus = p.status !== 'unmemorized';
    else if (statusFilter !== 'all') matchesStatus = p.status === statusFilter;

    const matchesJuz = activeJuzTab === 'all' || p.juz === Number(activeJuzTab);
    return matchesSearch && matchesStatus && matchesJuz;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#10B981'; // Green
      case 'review': return '#F59E0B'; // Yellow
      case 'critical': return '#EF4444'; // Red
      default: return '#334155'; // Dark Slate Gray (unmemorized)
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: (isMobile || isCompact) ? 'column' : 'row', 
      gap: '20px', 
      position: 'relative',
      width: '100%',
      minWidth: 0,
      maxWidth: '100%'
    }}>
      
      {/* Toast Notification */}
      {statusMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#10B981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={20} />
          {statusMessage}
        </div>
      )}

      {/* Quick Level Update Modal */}
      {showLevelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
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
            maxWidth: '450px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary)' }}>
              🎯 تحديث إجمالي عدد الصفحات المحفوظة
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              أدخل إجمالي عدد الصفحات التي حفظتها في صدرك حتى الآن (من 0 إلى 604)، وسيتم تحديث الخريطة الذهنية ومحفظتك فوراً:
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="number"
                min="0"
                max="604"
                value={quickPagesInput}
                onChange={(e) => setQuickPagesInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--primary)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  outline: 'none',
                  fontWeight: 'bold'
                }}
              />
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                صفحة ({(Number(quickPagesInput || 0) / 20).toFixed(1)} جزء)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLevelModal(false)}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                onClick={() => handleQuickUpdateLevel(quickPagesInput)}
                style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                حفظ والتحديث 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* KPI Portfolio Header Banner */}
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: isMobile ? '20px' : '24px', color: 'var(--text-primary)', margin: 0 }}>
                  🗺️ خريطة القرآن التفاعلية (604 صفحة)
                </h2>
                <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>
                  متصل بمحفظتك
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                مرآة بصرية دقيقة تعكس محفوظك الفعلي، نسبة تثبيته، ومواضع المراجعة اليومية
              </p>
            </div>

            <button
              onClick={() => setShowLevelModal(true)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid var(--primary)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🎯 تعديل رصيد المحفظة: {activeMemorizedCount} صفحة ({(activeMemorizedCount / 20).toFixed(1)} جزء) ✏️
            </button>
          </div>

          {/* KPI Mini-Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>📗 محفوظ في الصدر</span>
              <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>{activeMemorizedCount} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>صفحة</span></strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>📚 أجزاء مكتملة</span>
              <strong style={{ fontSize: '18px', color: '#10B981' }}>{completedJuzs.length} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>من 30</span></strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>🟢 حفظ ممتاز</span>
              <strong style={{ fontSize: '18px', color: '#10B981' }}>{excellentCount}</strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>🟡 يحتاج مراجعة</span>
              <strong style={{ fontSize: '18px', color: '#F59E0B' }}>{reviewCount}</strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>🎯 نسبة الختم</span>
              <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{((activeMemorizedCount / 604) * 100).toFixed(1)}%</strong>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="ابحث برقم الصفحة أو اسم السورة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '13.5px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `الكل (604)` },
                { id: 'memorized', label: `📗 المحفوظ (${activeMemorizedCount})` },
                { id: 'excellent', label: `🟢 ممتاز (${excellentCount})` },
                { id: 'review', label: `🟡 مراجعة (${reviewCount})` },
                { id: 'critical', label: `🔴 حرج (${criticalCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${statusFilter === f.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: statusFilter === f.id ? 'var(--primary-light)' : 'var(--bg-color)',
                    color: statusFilter === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 📚 Juz Navigation & Selection Strip (الأجزاء من 1 إلى 30) */}
        <div style={{
          padding: '16px',
          borderRadius: '18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--primary)" /> تصفح وإدارة الأجزاء القرآنية (١ - ٣٠):
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveJuzTab('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${activeJuzTab === 'all' ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: activeJuzTab === 'all' ? 'var(--primary)' : 'transparent',
                  color: activeJuzTab === 'all' ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                عرض المصحف كاملاً
              </button>
            </div>
          </div>

          {/* Scrollable Juz Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((jNum) => {
              const range = getPageRangeForJuz(jNum);
              const juzPages = pages.filter(p => p.pageNumber >= range.startPage && p.pageNumber <= range.endPage);
              const memInJuz = juzPages.filter(p => p.status !== 'unmemorized').length;
              const isFull = juzPages.length > 0 && memInJuz === juzPages.length;
              const isPartial = memInJuz > 0 && !isFull;
              const isActive = activeJuzTab === jNum.toString();

              let badgeColor = '#94A3B8';
              if (isFull) badgeColor = '#10B981';
              else if (isPartial) badgeColor = '#F59E0B';

              return (
                <button
                  key={jNum}
                  onClick={() => setActiveJuzTab(jNum.toString())}
                  style={{
                    flexShrink: 0,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: isActive ? 'var(--primary-light)' : 'var(--bg-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '68px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                    جزء {jNum}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: isFull ? 'rgba(16, 185, 129, 0.15)' : (isPartial ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.15)'),
                    color: badgeColor,
                    fontWeight: 'bold'
                  }}>
                    {isFull ? 'مكتمل ✅' : (isPartial ? `${memInJuz} ص` : 'لم يحفظ')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Juz Quick Bulk Actions Banner */}
          {activeJuzTab !== 'all' && (
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--primary)' }}>
                  📖 الجزء {activeJuzTab} (الصفحات {getPageRangeForJuz(Number(activeJuzTab)).startPage} - {getPageRangeForJuz(Number(activeJuzTab)).endPage})
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                  يمكنك تعليم الجزء كاملاً كمحفوظ أو إلغاؤه بضغطة زر واحدة لتحديث محفظتك فوراً:
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleBulkSetJuzStatus(Number(activeJuzTab), true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10B981',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={14} />
                  <span>تعليم الجزء كاملاً كمحفوظ 🟢</span>
                </button>

                <button
                  onClick={() => handleBulkSetJuzStatus(Number(activeJuzTab), false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء تحديد الجزء ⚪
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 604 Interactive Grid */}
        <div style={{ 
          padding: isMobile ? '12px' : '24px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          maxHeight: '620px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
            gap: '7px'
          }}>
            {filteredPages.map(page => {
              const bg = getStatusColor(page.status);
              const isSelected = selectedPage?.pageNumber === page.pageNumber;

              return (
                <button
                  key={page.pageNumber}
                  onClick={() => setSelectedPage(page)}
                  title={`صفحة ${page.pageNumber} - سورة ${page.surahName} (جزء ${page.juz})`}
                  style={{
                    height: '42px',
                    borderRadius: '9px',
                    border: isSelected ? '2px solid #FFFFFF' : 'none',
                    backgroundColor: bg,
                    color: page.status === 'unmemorized' ? '#94A3B8' : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.7)' : 'none',
                    transform: isSelected ? 'scale(1.12)' : 'scale(1)'
                  }}
                >
                  {page.pageNumber}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Side Detail Panel (When a page is selected) */}
      {selectedPage && (
        <div style={{
          width: (isMobile || isCompact) ? '100%' : '320px',
          minWidth: (isMobile || isCompact) ? '100%' : '280px',
          maxWidth: (isMobile || isCompact) ? '100%' : '350px',
          padding: '20px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-soft)',
          position: (isMobile || isCompact) ? 'relative' : 'sticky',
          top: (isMobile || isCompact) ? 0 : '80px',
          maxHeight: (isMobile || isCompact) ? 'none' : 'calc(100vh - 100px)',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '19px', color: 'var(--text-primary)' }}>
              تفاصيل الصفحة {selectedPage.pageNumber}
            </h3>
            <button 
              onClick={() => setSelectedPage(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>السورة والجزء</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '17px', color: 'var(--text-primary)' }}>
              سورة {selectedPage.surahName} (الجزء {selectedPage.juz})
            </h4>
          </div>

          {/* Memory Score Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>استقرار الذاكرة في الصدر:</span>
              <span style={{ fontWeight: 'bold', color: getStatusColor(selectedPage.status) }}>
                {selectedPage.score}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${selectedPage.score}%`, height: '100%', background: getStatusColor(selectedPage.status), borderRadius: '4px' }} />
            </div>
          </div>

          {/* Interactive Page Status Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              تعديل حالة هذه الصفحة المباشر:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'excellent', 95)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: selectedPage.status === 'excellent' ? '2px solid #10B981' : '1px solid var(--glass-border)',
                  background: selectedPage.status === 'excellent' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-color)',
                  color: '#10B981',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🟢 ممتاز (95%)
              </button>

              <button
                onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'review', 75)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: selectedPage.status === 'review' ? '2px solid #F59E0B' : '1px solid var(--glass-border)',
                  background: selectedPage.status === 'review' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-color)',
                  color: '#F59E0B',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🟡 مراجعة (75%)
              </button>

              <button
                onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'critical', 50)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: selectedPage.status === 'critical' ? '2px solid #EF4444' : '1px solid var(--glass-border)',
                  background: selectedPage.status === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-color)',
                  color: '#EF4444',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🔴 حرج (50%)
              </button>

              <button
                onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'unmemorized', 0)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: selectedPage.status === 'unmemorized' ? '2px solid #94A3B8' : '1px solid var(--glass-border)',
                  background: selectedPage.status === 'unmemorized' ? 'rgba(148, 163, 184, 0.15)' : 'var(--bg-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ⚪ غير محفوظ
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-color)', textAlign: 'center' }}>
              <Clock size={16} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>آخر مراجعة</span>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{selectedPage.lastReviewed}</strong>
            </div>

            <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-color)', textAlign: 'center' }}>
              <AlertTriangle size={16} color={selectedPage.errorsCount > 0 ? '#EF4444' : 'var(--primary)'} style={{ margin: '0 auto 4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>سجل التنبيهات</span>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{selectedPage.errorsCount} ملاحظات</strong>
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={16} color="var(--primary)" />
              <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>توجيه الذكاء الاصطناعي:</strong>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {selectedPage.status === 'unmemorized'
                ? 'الصفحة غير مدرجة في محفوظك حالياً. يمكنك إضافتها لخطتك في الحصن الثالث (الحفظ الجديد).'
                : (selectedPage.status === 'critical' 
                  ? 'ينصح بمراجعة هذه الصفحة اليوم في حصن الغد والتكرار 5 مرات صوتاً.' 
                  : 'حالة الحفظ ممتازة. جدول المراجعة القادم بعد 5 أيام.')}
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
