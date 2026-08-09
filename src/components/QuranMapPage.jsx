import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';


// Generate status for 604 pages based on user's memorized pages count
const generateQuranPages = (memorizedCount = 0) => {
  const pages = [];
  const count = Math.max(0, Number(memorizedCount) || 0);

  for (let i = 1; i <= 604; i++) {
    let status = 'unmemorized'; // 'excellent' | 'review' | 'critical' | 'unmemorized'
    let score = 0;

    if (count > 0 && i <= count) {
      if (i % 7 === 0) {
        status = 'critical';
        score = 55;
      } else if (i % 4 === 0) {
        status = 'review';
        score = 75;
      } else {
        status = 'excellent';
        score = 92;
      }
    }

    pages.push({
      pageNumber: i,
      juz: getJuzForPage(i),
      status,
      score,
      lastReviewed: status !== 'unmemorized' ? 'منذ يومين' : 'لم يراجع بعد',
      errorsCount: status === 'critical' ? 3 : (status === 'review' ? 1 : 0),
      surahName: getSurahNameForPage(i)
    });
  }
  return pages;
};

export const QuranMapPage = () => {
  const { user, updateUserData } = useAuth();
  const { notifyAndCelebrate } = useNotifications();
  const memorizedPagesCount = Math.max(0, Number(user?.memorizedPagesCount) || 0);

  const [pages, setPages] = React.useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'excellent' | 'review' | 'critical'
  const [juzFilter, setJuzFilter] = useState('all');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [quickPagesInput, setQuickPagesInput] = useState(memorizedPagesCount.toString());
  const [statusMessage, setStatusMessage] = useState('');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    setQuickPagesInput(memorizedPagesCount.toString());
  }, [memorizedPagesCount]);

  React.useEffect(() => {
    const basePages = generateQuranPages(memorizedPagesCount);
    
    fetch('/api/quran/pages')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.pages)) {
          const merged = basePages.map(dp => {
            const serverPage = data.pages.find(sp => sp.pageNumber === dp.pageNumber);
            return serverPage ? { ...dp, ...serverPage } : dp;
          });
          setPages(merged);
        } else {
          setPages(basePages);
        }
      })
      .catch(() => setPages(basePages));
  }, [memorizedPagesCount]);

  // Update specific page status (e.g. excellent, review, critical, unmemorized)
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

    // Calculate total memorized pages count
    const activeMemorizedCount = updatedPages.filter(p => p.status !== 'unmemorized').length;
    const calcJuz = Number((activeMemorizedCount / 20).toFixed(1));

    updateUserData({
      memorizedPagesCount: activeMemorizedCount,
      totalJuz: calcJuz
    });

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memorizedPagesCount: activeMemorizedCount,
            totalJuz: calcJuz
          })
        });
      } catch (e) {
        console.error('Error syncing user level:', e);
      }
    }

    // Send backend review log
    try {
      await fetch(`/api/quran/pages/${pageNumber}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          score: newScore,
          surahName: updatedSelected?.surahName,
          juz: updatedSelected?.juz
        })
      });
    } catch (e) {
      console.error('Error posting page review:', e);
    }

    if (newStatus === 'excellent') {
      notifyAndCelebrate({
        title: `إتقان ممتاز للصفحة ${pageNumber}! 🟢`,
        message: `أحسنت! أثبتت حفظ الصفحة ${pageNumber} (${updatedSelected?.surahName || ''}) بتقدير ممتاز 100%!`,
        type: 'achievement',
        xpBonus: 75,
        badgeTitle: 'حافظ متقن'
      });
    }

    setStatusMessage(`تم تحديث حالة الصفحة ${pageNumber} بنجاح ✨`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Quick update memorized pages level
  const handleQuickUpdateLevel = async (newCountNum) => {
    const newCount = Math.min(604, Math.max(0, Number(newCountNum) || 0));
    const newPages = generateQuranPages(newCount);
    setPages(newPages);
    setShowLevelModal(false);

    const calcJuz = Number((newCount / 20).toFixed(1));
    updateUserData({
      memorizedPagesCount: newCount,
      totalJuz: calcJuz
    });

    notifyAndCelebrate({
      title: '🗺️ تحديث مستوى الخريطة القرآنية!',
      message: `تم تحديث مستوى حفظك إلى ${newCount} صفحة (${calcJuz} جزءاً) بنجاح!`,
      type: 'achievement',
      xpBonus: 100,
      badgeTitle: 'فارس الخريطة'
    });

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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

  // Filtered pages
  const filteredPages = pages.filter(p => {
    const matchesSearch = searchQuery === '' || p.pageNumber.toString().includes(searchQuery) || p.surahName.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesJuz = juzFilter === 'all' || p.juz.toString() === juzFilter;
    return matchesSearch && matchesStatus && matchesJuz;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#10B981'; // Green
      case 'review': return '#F59E0B'; // Yellow
      case 'critical': return '#EF4444'; // Red
      default: return '#334155'; // Dark Gray
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', position: 'relative' }}>
      
      {/* Toast Notification Message */}
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
          background: 'rgba(0,0,0,0.6)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary)' }}>
              🎯 تحديث إجمالي عدد الصفحات المحفوظة
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              أدخل إجمالي عدد الصفحات التي حفظتها في الصدر حتى الآن (من 0 إلى 604)، وسيتم تحديث الخريطة الذهنية وملفك الشخصي فوراً:
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
                  borderRadius: '10px',
                  border: '1px solid var(--primary)',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header & Controls */}
        <div style={{ 
          padding: isMobile ? '16px' : '24px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '20px' : '24px', color: 'var(--text-primary)', margin: 0 }}>🗺️ الخارطة الشاملة لمصفحات القرآن (604 صفحة)</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>مؤشر مرئي دقيق لاستقرار الذاكرة ودرجة تثبيت كل صفحة في الصدر</p>
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
              🎯 مستوى الحفظ المسجل: {memorizedPagesCount} صفحة ({(memorizedPagesCount / 20).toFixed(1)} جزء) ✏️
            </button>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '180px', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="ابحث برقم الصفحة أو السورة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', width: '100%' }}
              />
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'الكل (604)' },
                { id: 'excellent', label: '🟢 ممتاز', color: '#10B981' },
                { id: 'review', label: '🟡 مراجعة', color: '#F59E0B' },
                { id: 'critical', label: '🔴 حرج', color: '#EF4444' }
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

        {/* 604 Grid Box Container */}
        <div style={{ 
          padding: isMobile ? '12px' : '24px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '6px'
          }}>
            {filteredPages.map(page => {
              const bg = getStatusColor(page.status);
              const isSelected = selectedPage?.pageNumber === page.pageNumber;

              return (
                <button
                  key={page.pageNumber}
                  onClick={() => setSelectedPage(page)}
                  title={`صفحة ${page.pageNumber} - سورة ${page.surahName} (${page.score}%)`}
                  style={{
                    height: '40px',
                    borderRadius: '8px',
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
                    boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {page.pageNumber}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Side Detail Panel (Appears when a page is selected) */}
      {selectedPage && (
        <div style={{
          width: isMobile ? '100%' : '320px',
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-soft)',
          position: 'sticky',
          top: '100px',
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>
              تفاصيل الصفحة {selectedPage.pageNumber}
            </h3>
            <button 
              onClick={() => setSelectedPage(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>السورة والجزء</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', color: 'var(--text-primary)' }}>
              سورة {selectedPage.surahName} (الجزء {selectedPage.juz})
            </h4>
          </div>

          {/* Memory Score Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>استقرار الذاكرة (Memory Score):</span>
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
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', textAlign: 'center' }}>
              <Clock size={18} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>آخر مراجعة</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedPage.lastReviewed}</strong>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', textAlign: 'center' }}>
              <AlertTriangle size={18} color={selectedPage.errorsCount > 0 ? '#EF4444' : 'var(--primary)'} style={{ margin: '0 auto 4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>سجل الأخطاء</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedPage.errorsCount} أخطاء</strong>
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="var(--primary)" />
              <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>توصية الذكاء الاصطناعي:</strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {selectedPage.status === 'critical' 
                ? 'ينصح بمراجعة هذه الصفحة اليوم في حصن الغد والتكرار 5 مرات صوتاً.' 
                : 'حالة الحفظ ممتازة. جدول المراجعة القادم بعد 5 أيام.'}
            </p>
          </div>

          {/* Dynamic Surah Mind Map Flowchart */}
          {(() => {
            const getSurahMindMap = (surahName) => {
              if (surahName === 'الفاتحة') {
                return {
                  axis: 'محور السورة: تحقيق العبودية لله والاستعانة به وهداية الصراط.',
                  nodes: [
                    { label: 'القسم الأول', desc: 'حمد الله والثناء عليه وتمجيده (1-4)' },
                    { label: 'القسم الثاني', desc: 'إفراد الله بالعبادة والاستعانة (5)' },
                    { label: 'القسم الثالث', desc: 'الدعاء بالهداية للصراط المستقيم (6-7)' }
                  ]
                };
              }
              if (surahName === 'البقرة') {
                return {
                  axis: 'محور السورة: تهيئة الأمة للاستخلاف في الأرض وإقامة دين الله.',
                  nodes: [
                    { label: 'المقدمة وأصناف الناس', desc: 'صفات المؤمنين، الكافرين، والمنافقين (1-20)' },
                    { label: 'قصة الاستخلاف وآدم', desc: 'بدء الخلق وعمارة الأرض وقصة السجود لآدم (30-39)' },
                    { label: 'قصة البقرة وميثاق بني إسرائيل', desc: 'نقض العهد والتلكؤ في تلبية الأوامر (40-123)' },
                    { label: 'أحكام التشريع والعبادات', desc: 'أحكام الصيام، النكاح، القصاص، الحج، والإنفاق (163-284)' },
                    { label: 'آية الكرسي وخاتمة الدعاء', desc: 'أعظم آية بالقرآن والالتجاء التام لله (255, 285-286)' }
                  ]
                };
              }
              return {
                axis: `محور السورة: مقاصد سورة ${surahName} وتثبيت العقيدة والعمل الصالح.`,
                nodes: [
                  { label: 'القسم الأول', desc: 'مقدمة السورة وبيان إعجاز القرآن ومحور الهداية.' },
                  { label: 'القسم الثاني', desc: 'القصص والآيات الدالة على عظمة الخالق وتشريعه.' },
                  { label: 'القسم الثالث', desc: 'خاتمة السورة والتوجيهات الإيمانية العامة للحفاظ.' }
                ]
              };
            };

            const map = getSurahMindMap(selectedPage.surahName);
            return (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} color="#3B82F6" />
                  <strong style={{ fontSize: '14px', color: '#2563EB' }}>الخريطة الذهنية للمحاور 🗺️:</strong>
                </div>
                
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {map.axis}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {map.nodes.map((node, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', marginTop: '5px' }} />
                        {idx < map.nodes.length - 1 && (
                          <div style={{ width: '2px', height: '28px', background: 'rgba(59, 130, 246, 0.2)' }} />
                        )}
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563EB', display: 'block' }}>{node.label}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{node.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};
