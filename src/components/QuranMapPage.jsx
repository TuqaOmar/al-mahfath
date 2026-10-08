import { declaredPages } from '../lib/memorization';
import React, { useState, useEffect, useRef } from 'react';
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
  Award,
  Mic
} from 'lucide-react';
import { getSurahNameForPage, getJuzForPage, getPageRangeForJuz } from '../utils/quranData';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchWithAuth } from '../lib/api';
import { useDialogDismiss } from '../hooks/useDialogDismiss';
import { fetchUserPortfolio, saveAyahToPortfolio, makeAyahKey } from '../lib/portfolioService';

// Helper to construct initial 604 pages accurately based on user's portfolio
const buildQuranPagesData = (user) => {
  const memorizedSet = new Set(declaredPages(user));
  const savedReviews = user?.preferences?.studentDeclaredPageStatuses || {};
  const pages = [];
  for (let i = 1; i <= 604; i++) {
    const isMemorized = memorizedSet.has(i);
    const custom = memorizedSet.has(i) && savedReviews[i];

    let status = 'unmemorized';
    let score = 0;
    let lastReviewed = 'لم يراجع بعد';
    let errorsCount = 0;

    if (custom) {
      status = custom.status;
      score = 0;
      lastReviewed = custom.lastReviewed || 'اليوم';
      errorsCount = 0;
    } else if (isMemorized) {
      status = 'excellent';
      score = 0;
      lastReviewed = 'اليوم';
      errorsCount = 0;
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

export const QuranMapPage = ({ onSelectPageForRecitation }) => {
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
  // Escape and the phone back button close the declared-pages dialog.
  useDialogDismiss(showLevelModal, () => setShowLevelModal(false));
  const [statusMessage, setStatusMessage] = useState('');
  const [ayahPortfolio, setAyahPortfolio] = useState({});
  const [ayahSurah, setAyahSurah] = useState('1');
  const [ayahNumber, setAyahNumber] = useState('1');
  const [ayahStatus, setAyahStatus] = useState('learning');
  const [ayahSaving, setAyahSaving] = useState(false);
  const [ayahFeedback, setAyahFeedback] = useState('');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isCompact, setIsCompact] = useState(typeof window !== 'undefined' && window.innerWidth < 1180);
  const detailPanelRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsCompact(w < 1180);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) { setAyahPortfolio({}); return; }
    fetchUserPortfolio(user.uid).then(data => { if (!cancelled) setAyahPortfolio(data); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const saveRecordedAyahProgress = async () => {
    const surahNumber = Number(ayahSurah);
    const verseNumber = Number(ayahNumber);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > 286) {
      setAyahFeedback('أدخل رقم سورة وآية صالحين.');
      return;
    }
    setAyahSaving(true);
    setAyahFeedback('');
    try {
      const saved = await saveAyahToPortfolio(user.uid, { surahNumber, ayahNumber: verseNumber, status: ayahStatus, source: 'student_recorded' });
      setAyahPortfolio(previous => ({ ...previous, [makeAyahKey(surahNumber, verseNumber)]: saved }));
      setAyahFeedback('تم حفظ تقدم الآية.');
    } catch (error) {
      console.error('Failed to save ayah progress:', error);
      setAyahFeedback('تعذر حفظ تقدم الآية؛ بقي السجل السابق.');
    } finally { setAyahSaving(false); }
  };

  // Initialize and update pages when user changes
  useEffect(() => {
    const initialPages = buildQuranPagesData(user);
    setPages(initialPages);
    setQuickPagesInput(declaredPages(user).length.toString());
  }, [user?.uid, user?.preferences?.studentDeclaredPages, user?.preferences?.studentDeclaredPageStatuses]);

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

  // Commit self-reported planning data before changing counters or claiming success.
  const persistDeclaredPages = async nextPages => {
    const list = nextPages.filter(page => page.status !== 'unmemorized').map(page => page.pageNumber);
    const statuses = Object.fromEntries(nextPages.filter(page => page.status !== 'unmemorized')
      .map(page => [page.pageNumber, { status: page.status, lastReviewed: page.lastReviewed }]));
    setStatusMessage('');
    const result = await updateUserData({ preferences: { ...(user?.preferences || {}),
      studentDeclaredPages: list, studentDeclaredPageStatuses: statuses } });
    if (!result?.success) {
      setStatusMessage('تعذر حفظ التصريح الذاتي؛ بقي السجل السابق.');
      return false;
    }
    setPages(nextPages);
    setStatusMessage('تم حفظ الصفحات المصرّح بها ذاتيًا؛ ليست حفظًا معتمدًا.');
    return true;
  };
  const handleUpdatePageStatus = async (pageNumber, newStatus) => {
    const next = pages.map(page => page.pageNumber === pageNumber
      ? { ...page, status: newStatus, score: 0, errorsCount: 0, lastReviewed: 'اليوم' } : page);
    if (await persistDeclaredPages(next)) setSelectedPage(next.find(page => page.pageNumber === pageNumber));
  };
  const handleBulkSetJuzStatus = async (juzNum, shouldMemorize) => {
    const range = getPageRangeForJuz(juzNum);
    const next = pages.map(page => page.pageNumber >= range.startPage && page.pageNumber <= range.endPage
      ? { ...page, status: shouldMemorize ? 'excellent' : 'unmemorized', score: 0, errorsCount: 0, lastReviewed: 'اليوم' } : page);
    await persistDeclaredPages(next);
  };
  const handleQuickUpdateLevel = async count => {
    const limit = Math.min(604, Math.max(0, Math.floor(Number(count) || 0)));
    const next = pages.map(page => ({ ...page, status: page.pageNumber <= limit ? 'excellent' : 'unmemorized',
      score: 0, errorsCount: 0, lastReviewed: 'اليوم' }));
    if (await persistDeclaredPages(next)) setShowLevelModal(false);
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

  const renderDetailPanelContent = () => {
    if (!selectedPage) return null;
    return (
      <>
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

        <p>تقييم الحفظ المعتمد: غير متاح</p>
        {/* Interactive Page Status Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            تعديل تصريحك الذاتي عن هذه الصفحة:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'excellent', 0)}
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
              🟢 مصرّح بحفظها ذاتيًا
            </button>

            <button
              onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'review', 0)}
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
              🟡 أحتاج مراجعة (تصريح ذاتي)
            </button>

            <button
              onClick={() => handleUpdatePageStatus(selectedPage.pageNumber, 'critical', 0)}
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
              🔴 أحتاج مساعدة (تصريح ذاتي)
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
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>آخر تصريح ذاتي</span>
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
            <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>توجيه عام للخطة (ليس تقييمًا):</strong>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {selectedPage.status === 'unmemorized'
              ? 'الصفحة غير مدرجة في محفوظك حالياً. يمكنك إضافتها لخطتك في الحصن الثالث (الحفظ الجديد).'
              : (selectedPage.status === 'critical' 
                ? 'ينصح بمراجعة هذه الصفحة اليوم في حصن الغد والتكرار 5 مرات صوتاً.' 
                : 'هذا تصريحك الذاتي؛ راجع خطتك وحدد موعد المراجعة المناسب.')}
          </p>
        </div>

        {/* Direct Navigation & Recitation Action Buttons */}
        {onSelectPageForRecitation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={() => {
                const pNum = selectedPage.pageNumber;
                setSelectedPage(null);
                onSelectPageForRecitation(pNum);
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <BookOpen size={18} />
              <span>فتح وقراءة الصفحة {selectedPage.pageNumber} في المصحف التفاعلي 📖</span>
            </button>

            <button
              onClick={() => {
                const pNum = selectedPage.pageNumber;
                setSelectedPage(null);
                onSelectPageForRecitation(pNum);
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid var(--primary)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Mic size={16} />
              <span>تسميع الصفحة {selectedPage.pageNumber} واختبار الحفظ 🎯</span>
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: (isMobile || isCompact) ? 'column' : 'row', 
      gap: '20px', 
      position: 'relative',
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box'
    }} data-testid="quran-map-layout">
      
      {/* Toast Notification */}
      {statusMessage && (
        <div data-testid="declared-pages-feedback" role={statusMessage.startsWith('تعذر') ? 'alert' : 'status'} style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: statusMessage.startsWith('تعذر') ? '#DC2626' : '#10B981',
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
              🎯 تحديث الصفحات المصرّح بها ذاتيًا
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              أدخل عدد الصفحات المصرّح بها ذاتيًا (0 إلى 604). يتحدث العرض بعد نجاح الحفظ؛ لا يمثل اعتماد المعلم.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="number"
                min="0"
                max="604"
                data-testid="declared-pages-input"
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
                data-testid="save-declared-pages"
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
      <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p data-testid="self-reported-page-disclaimer" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>حالات الصفحات تصريحات ذاتية؛ ليست حفظًا معتمدًا أو درجات تسميع.</p>
        {/* KPI Portfolio Header Banner */}
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
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
              data-testid="open-declared-pages"
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
                gap: '8px',
                maxWidth: '100%',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                textAlign: 'center'
              }}
            >
              🎯 تعديل التصريح الذاتي: {activeMemorizedCount} صفحة ✏️
            </button>
          </div>

          {/* KPI Mini-Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(95px, 1fr))' : 'repeat(auto-fit, minmax(110px, 1fr))', 
            gap: '8px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>📗 صفحات مصرّح بها ذاتيًا</span>
              <strong data-testid="declared-pages-count" style={{ fontSize: '18px', color: 'var(--primary)' }}>{activeMemorizedCount} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>صفحة</span></strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>📚 أجزاء مصرّح بها كاملة</span>
              <strong style={{ fontSize: '18px', color: '#10B981' }}>{completedJuzs.length} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>من 30</span></strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>🟢 مصرّح بحفظها ذاتيًا</span>
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '180px', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="ابحث برقم الصفحة أو اسم السورة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '13.5px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '100%' }}>
              {[
                { id: 'all', label: `الكل (604)` },
                { id: 'memorized', label: `📗 المصرّح بها ذاتيًا (${activeMemorizedCount})` },
                { id: 'excellent', label: `🟢 مصرّح بها ذاتيًا (${excellentCount})` },
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
          padding: isMobile ? '12px' : '16px',
          borderRadius: '18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
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
            paddingBottom: '8px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin'
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
                    {isFull ? 'مصرّح به كاملًا ✅' : (isPartial ? `${memInJuz} ص` : 'لم يصرّح')}
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
                  يمكنك التصريح ذاتيًا بصفحات الجزء أو إزالة التصريح؛ يتحدث العرض بعد نجاح الحفظ فقط:
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
          padding: isMobile ? '12px' : '20px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          maxHeight: (isMobile || isCompact) ? 'none' : 'calc(100vh - 120px)',
          minHeight: (isMobile || isCompact) ? 'auto' : '520px',
          overflowY: (isMobile || isCompact) ? 'visible' : 'auto',
          overflowX: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(36px, 1fr))' : 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: isMobile ? '5px' : '6px',
            width: '100%',
            boxSizing: 'border-box'
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
                    height: isMobile ? '36px' : '40px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #FFFFFF' : 'none',
                    backgroundColor: bg,
                    color: page.status === 'unmemorized' ? '#94A3B8' : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '11px' : '12px',
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

        {/* Recorded ayah progress (secondary tool, below the map) */}
        <div data-testid="ayah-progress-editor" style={{ padding: isMobile ? '16px' : '20px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--text-primary)' }}>تسجيل تقدم آية</h3>
          <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>سجلك الذاتي في المحفظة؛ لا يعتمد الحفظ ولا يمنح XP.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>رقم السورة<input aria-label="رقم السورة للتقدم" type="number" min="1" max="114" value={ayahSurah} onChange={event => setAyahSurah(event.target.value)} style={{ ...{ display: 'block', marginTop: '6px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }, width: '96px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>رقم الآية<input aria-label="رقم الآية للتقدم" type="number" min="1" max="286" value={ayahNumber} onChange={event => setAyahNumber(event.target.value)} style={{ ...{ display: 'block', marginTop: '6px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }, width: '96px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>الحالة<select aria-label="حالة تقدم الآية" value={ayahStatus} onChange={event => setAyahStatus(event.target.value)} style={{ display: 'block', marginTop: '6px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}><option value="learning">قيد الحفظ</option><option value="review">مراجعة</option><option value="memorized">مصرّح بحفظها ذاتيًا</option><option value="unmemorized">غير محفوظ</option></select></label>
            <button type="button" data-testid="save-ayah-progress" disabled={ayahSaving} onClick={saveRecordedAyahProgress} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: '#FFFFFF', fontWeight: 700, fontSize: '13.5px', cursor: ayahSaving ? 'wait' : 'pointer', opacity: ayahSaving ? 0.7 : 1 }}>{ayahSaving ? 'جاري الحفظ...' : 'حفظ تقدم الآية'}</button>
          </div>
          <div data-testid="ayah-progress-count" style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>الآيات ذات السجل: {Object.keys(ayahPortfolio).length}</div>
          {ayahFeedback && <div role={ayahFeedback.startsWith('تعذر') ? 'alert' : 'status'} data-testid="ayah-progress-feedback" style={{ marginTop: '10px', fontSize: '13px', color: ayahFeedback.startsWith('تعذر') ? '#B91C1C' : '#047857' }}>{ayahFeedback}</div>}
        </div>

      </div>

      {/* Side Detail Panel (When a page is selected on desktop) */}
      {selectedPage && !isMobile && !isCompact && (
        <div 
          ref={detailPanelRef}
          data-testid="quran-map-detail-panel"
          style={{
            width: '320px',
            minWidth: '280px',
            maxWidth: '350px',
            flexShrink: 0,
            padding: '20px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-soft)',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {renderDetailPanelContent()}
        </div>
      )}

      {/* Mobile & Compact Screens Detail Panel Overlay */}
      {selectedPage && (isMobile || isCompact) && (
        <div 
          data-testid="quran-map-detail-overlay"
          onClick={() => setSelectedPage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '20px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            ref={detailPanelRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '520px',
              maxHeight: isMobile ? '82vh' : '90vh',
              background: 'var(--bg-surface)',
              borderRadius: isMobile ? '24px 24px 0 0' : '24px',
              border: '1px solid var(--glass-border)',
              padding: isMobile ? '20px 18px calc(24px + env(safe-area-inset-bottom, 0px)) 18px' : '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
              boxSizing: 'border-box'
            }}
          >
            {isMobile && (
              <div style={{ width: '40px', height: '4px', background: 'var(--glass-border)', borderRadius: '2px', margin: '0 auto -6px auto' }} />
            )}
            {renderDetailPanelContent()}
          </div>
        </div>
      )}

    </div>
  );
};
