import React, { useState, useEffect, useMemo } from 'react';
import { 
  Map, 
  Search, 
  Star, 
  Check, 
  CheckCircle, 
  BookOpen, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Layers, 
  Award, 
  Info, 
  ShieldCheck, 
  ExternalLink,
  Flame,
  Bookmark,
  Share2
} from 'lucide-react';
import { Card } from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  getSurahMindMap, 
  getAllSurahsList, 
  MIND_MAPS_SOURCE_INFO 
} from '../utils/quranMindMapsData';

// Normalizes Arabic text for flexible search
function normalizeArabic(text = '') {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .trim()
    .toLowerCase();
}

export const MindMapsView = ({ onSelectPageForRecitation }) => {
  const { user, updateUserData } = useAuth();
  const userId = user?.uid || 'guest';
  const { notifyAndCelebrate } = useNotifications();
  const { lang, isRTL } = useLanguage();

  const allSurahs = useMemo(() => getAllSurahsList(), []);

  // State
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'meccan', 'medinan', 'favorite'
  const [selectedJuz, setSelectedJuz] = useState('all');
  const [showSourceInfo, setShowSourceInfo] = useState(false);

  // Favorites from user profile
  const favorites = user?.favorites || [];
  const isCurrentSurahFavorited = favorites.some(
    f => f.type === 'surah' && (f.id === selectedSurahNumber || f.number === selectedSurahNumber)
  );

  const toggleSurahFavorite = () => {
    let updated;
    const currentMindMap = getSurahMindMap(selectedSurahNumber);
    if (isCurrentSurahFavorited) {
      updated = favorites.filter(
        f => !(f.type === 'surah' && (f.id === selectedSurahNumber || f.number === selectedSurahNumber))
      );
    } else {
      updated = [
        ...favorites,
        {
          type: 'surah',
          id: selectedSurahNumber,
          number: selectedSurahNumber,
          title: `خريطة سورة ${currentMindMap.name}`,
          startPage: currentMindMap.startPage,
          addedAt: new Date().toLocaleDateString('ar-EG')
        }
      ];
    }
    updateUserData({ favorites: updated });
  };

  // Completed nodes persistence
  const [completedNodes, setCompletedNodes] = useState(() => {
    try {
      const saved = localStorage.getItem(`ma7fath_${userId}_completed_mindmap_nodes`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ma7fath_${userId}_completed_mindmap_nodes`);
      setCompletedNodes(saved ? JSON.parse(saved) : {});
    } catch {
      setCompletedNodes({});
    }
  }, [userId]);

  const saveCompletedNodes = (updated) => {
    setCompletedNodes(updated);
    try {
      localStorage.setItem(`ma7fath_${userId}_completed_mindmap_nodes`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter surahs list for the selector
  const filteredSurahs = useMemo(() => {
    const normQuery = normalizeArabic(searchQuery);

    return allSurahs.filter(s => {
      // Search match
      if (normQuery) {
        const matchesName = normalizeArabic(s.name).includes(normQuery);
        const matchesNum = s.number.toString() === normQuery;
        if (!matchesName && !matchesNum) return false;
      }

      // Revelation filter
      if (filterType === 'meccan' && s.revelationType !== 'مكية') return false;
      if (filterType === 'medinan' && s.revelationType !== 'مدنية') return false;
      if (filterType === 'favorite') {
        const isFav = favorites.some(
          f => f.type === 'surah' && (f.id === s.number || f.number === s.number)
        );
        if (!isFav) return false;
      }

      // Juz filter
      if (selectedJuz !== 'all' && s.juz !== parseInt(selectedJuz)) {
        return false;
      }

      return true;
    });
  }, [allSurahs, searchQuery, filterType, selectedJuz, favorites]);

  // Current active mind map data
  const currentMindMap = useMemo(() => {
    return getSurahMindMap(selectedSurahNumber);
  }, [selectedSurahNumber]);

  // Handle node completion
  const handleToggleNode = (node) => {
    const key = `surah_${selectedSurahNumber}_node_${node.id}`;
    const currentVal = !!completedNodes[key];
    const newVal = !currentVal;

    const updated = { ...completedNodes, [key]: newVal };
    saveCompletedNodes(updated);

    if (newVal) {
      const totalNodes = currentMindMap.nodes || [];
      const completedCount = totalNodes.filter(n => !!updated[`surah_${selectedSurahNumber}_node_${n.id}`]).length;

      if (completedCount === totalNodes.length) {
        notifyAndCelebrate({
          title: `🌟 إتقان خريطة سورة ${currentMindMap.name}!`,
          message: `مبارك! أتممت استيعاب وحفظ كافة المحاور الذهنية والمقاصد لسورة ${currentMindMap.name} كاملة بنجاح!`,
          type: 'mindmap',
          xpBonus: 150,
          badgeTitle: 'خبير الخرائط الذهنية'
        });
      } else {
        notifyAndCelebrate({
          title: `🗺️ استيعاب محور في سورة ${currentMindMap.name}`,
          message: `أتقنت محور "${node.title}" (${node.ayahRange}) وفق منهج المختصر في التفسير!`,
          type: 'mindmap',
          xpBonus: 40,
          badgeTitle: 'بطل التدبر الشجري'
        });
      }
    }
  };

  const totalNodesCount = currentMindMap.nodes?.length || 0;
  const completedNodesCount = currentMindMap.nodes?.filter(
    n => !!completedNodes[`surah_${selectedSurahNumber}_node_${n.id}`]
  ).length || 0;
  const progressPercent = totalNodesCount ? Math.round((completedNodesCount / totalNodesCount) * 100) : 0;

  // Navigation handlers
  const handlePrevSurah = () => {
    if (selectedSurahNumber > 1) {
      setSelectedSurahNumber(selectedSurahNumber - 1);
    }
  };

  const handleNextSurah = () => {
    if (selectedSurahNumber < 114) {
      setSelectedSurahNumber(selectedSurahNumber + 1);
    }
  };

  const quickSurahs = [
    { num: 1, name: 'الفاتحة' },
    { num: 2, name: 'البقرة' },
    { num: 3, name: 'آل عمران' },
    { num: 12, name: 'يوسف' },
    { num: 18, name: 'الكهف' },
    { num: 36, name: 'يس' },
    { num: 55, name: 'الرحمن' },
    { num: 56, name: 'الواقعة' },
    { num: 67, name: 'الملك' },
    { num: 78, name: 'النبأ' },
    { num: 112, name: 'الإخلاص' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1080px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Header Banner with Authoritative Source Citation */}
      <div style={{
        padding: '24px 28px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
        color: 'white',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Map size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  الخرائط الذهنية لكامل سور القرآن الكريم (114 سورة)
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#94A3B8' }}>
                  تقسيم شجري بصري للمقاصد الكبرى والمحاور الموضوعية لضبط الحفظ والربط الذهني بين الآيات.
                </p>
              </div>
            </div>
          </div>

          {/* Source Badge with interactive toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSourceInfo(!showSourceInfo)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#34D399',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="عرض تفاصيل التوثيق والمصادر المعتمدة"
            >
              <ShieldCheck size={16} />
              <span>المصدر: المختصر في التفسير (مركز تفسير)</span>
              <Info size={14} style={{ opacity: 0.8 }} />
            </button>
          </div>
        </div>

        {/* Source Documentation Dropdown details */}
        {showSourceInfo && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            fontSize: '13px',
            lineHeight: 1.7,
            color: '#E2E8F0'
          }}>
            <div style={{ fontWeight: 800, color: '#34D399', marginBottom: '6px' }}>
              📜 منهجية التوثيق والاعتماد العلمي للخرائط الذهنية:
            </div>
            <div>
              تم استخراج المقاصد العامة والمحاور الموضوعية لكافة سور القرآن الكريم الـ 114 وفق أحدث المراجع القرآنية المعتمدة:
            </div>
            <ul style={{ margin: '6px 0 0 0', paddingRight: '20px', color: '#CBD5E1' }}>
              <li><strong>المصدر الرئيس:</strong> «المختصر في التفسير» الصادر عن مركز تفسير للدراسات القرآنية (بإشراف نخبة من علماء التفسير).</li>
              <li><strong>التقسيم الموضوعي الشجري:</strong> «أطلس سور القرآن الكريم (الخرائط الذهنية)» لفضيلة د. صفوة برهان الشوادفي.</li>
              <li><strong>الترابط ومفاتيح الربط الذهني:</strong> «مقاصد سور القرآن الكريم» و«نظم الدرر في تناسب الآيات والسور» للإمام البقاعي.</li>
            </ul>
          </div>
        )}

        {/* Quick Surahs Carousel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none'
        }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 600 }}>
            وصول سريع:
          </span>
          {quickSurahs.map(qs => (
            <button
              key={qs.num}
              onClick={() => setSelectedSurahNumber(qs.num)}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                border: selectedSurahNumber === qs.num ? '1px solid #34D399' : '1px solid rgba(255,255,255,0.12)',
                background: selectedSurahNumber === qs.num ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255,255,255,0.06)',
                color: selectedSurahNumber === qs.num ? '#34D399' : '#E2E8F0',
                fontSize: '12px',
                fontWeight: selectedSurahNumber === qs.num ? 800 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {qs.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Surah Search, Filters & Selection Bar */}
      <div style={{
        padding: '18px 22px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Top Row: Search Input & Main Select */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: '1 1 260px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '14px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="ابحث باسم السورة (مثال: البقرة، الكهف) أو رقمها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isRTL ? '10px 42px 10px 14px' : '10px 14px 10px 42px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Surah Direct Dropdown (All 114) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              السورة:
            </span>
            <select
              value={selectedSurahNumber}
              onChange={(e) => setSelectedSurahNumber(parseInt(e.target.value))}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--primary-border, var(--glass-border))',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {allSurahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. سورة {s.name} ({s.revelationType} - {s.ayahCount} آية)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Prev / Next Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handlePrevSurah}
              disabled={selectedSurahNumber <= 1}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: selectedSurahNumber <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: selectedSurahNumber <= 1 ? 'not-allowed' : 'pointer',
                opacity: selectedSurahNumber <= 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="السورة السابقة"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={handleNextSurah}
              disabled={selectedSurahNumber >= 114}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: selectedSurahNumber >= 114 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: selectedSurahNumber >= 114 ? 'not-allowed' : 'pointer',
                opacity: selectedSurahNumber >= 114 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="السورة التالية"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Filter Pills (All, Meccan, Medinan, Favorites, Juz) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            التصنيف:
          </span>
          {[
            { id: 'all', label: `الكل (114)` },
            { id: 'meccan', label: `مكية (86)` },
            { id: 'medinan', label: `مدنية (28)` },
            { id: 'favorite', label: `المفضلة ⭐ (${favorites.filter(f => f.type === 'surah').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '5px 12px',
                borderRadius: '10px',
                border: filterType === tab.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: filterType === tab.id ? 'var(--primary-light)' : 'transparent',
                color: filterType === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: filterType === tab.id ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}

          {/* Juz Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginInlineStart: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              الجزء:
            </span>
            <select
              value={selectedJuz}
              onChange={(e) => setSelectedJuz(e.target.value)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">كافة الأجزاء (30)</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => (
                <option key={juzNum} value={juzNum}>الجزء {juzNum}</option>
              ))}
            </select>
          </div>
        </div>

        {/* If filtered list has results from search */}
        {searchQuery && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, alignSelf: 'center' }}>
              نتائج البحث ({filteredSurahs.length}):
            </span>
            {filteredSurahs.slice(0, 10).map(s => (
              <button
                key={s.number}
                onClick={() => {
                  setSelectedSurahNumber(s.number);
                  setSearchQuery('');
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--primary-border, var(--glass-border))',
                  background: s.number === selectedSurahNumber ? 'var(--primary)' : 'var(--bg-color)',
                  color: s.number === selectedSurahNumber ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {s.name} ({s.number})
              </button>
            ))}
            {filteredSurahs.length === 0 && (
              <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
                لم يتم العثور على سورة مطابقة لبحثك.
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. The Active Mind Map Card */}
      <Card style={{ padding: '28px', position: 'relative' }}>
        {/* Top Bar: Surah Meta, Star & Quran Recitation Quick Link */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          {/* Surah Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: currentMindMap.color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              boxShadow: `0 4px 14px ${currentMindMap.color}40`
            }}>
              {currentMindMap.number}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {currentMindMap.title}
                </h2>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '8px',
                  background: currentMindMap.revelationType === 'مكية' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  color: currentMindMap.revelationType === 'مكية' ? '#3B82F6' : '#10B981',
                  fontSize: '11.5px',
                  fontWeight: 700
                }}>
                  {currentMindMap.revelationType}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>آياتها: <strong>{currentMindMap.numberOfAyahs}</strong></span>
                <span>•</span>
                <span>الصفحة: <strong>{currentMindMap.startPage}</strong></span>
                <span>•</span>
                <span>الجزء: <strong>{currentMindMap.juz}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Star + Jump to Recitation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Direct Recitation Link */}
            {onSelectPageForRecitation && (
              <button
                onClick={() => onSelectPageForRecitation(currentMindMap.startPage)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-border, var(--glass-border))',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="الانتقال إلى المصحف الشريف لتسميع هذه السورة"
              >
                <BookOpen size={15} />
                <span>تسميع في المصحف (ص {currentMindMap.startPage})</span>
              </button>
            )}

            {/* Favorite Star Button */}
            <button
              onClick={toggleSurahFavorite}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: `1px solid ${isCurrentSurahFavorited ? '#F59E0B' : 'var(--glass-border)'}`,
                background: isCurrentSurahFavorited ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-color)',
                color: isCurrentSurahFavorited ? '#D97706' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Star size={16} fill={isCurrentSurahFavorited ? '#F59E0B' : 'none'} color={isCurrentSurahFavorited ? '#F59E0B' : 'currentColor'} />
              <span>{isCurrentSurahFavorited ? 'في المفضلة' : 'حفظ بالمفضلة'}</span>
            </button>
          </div>
        </div>

        {/* Central Thematic Purpose (المقصد الرئيس والعمود الفقري للسورة) */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '18px',
          background: 'var(--bg-surface-elevated, var(--bg-color))',
          border: `1.5px solid ${currentMindMap.color}40`,
          marginBottom: '28px',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Compass size={18} style={{ color: currentMindMap.color }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: currentMindMap.color }}>
              المقصد الكلي والعمود الفقري للسورة (وفق المختصر في التفسير):
            </h3>
          </div>
          <p style={{
            margin: '0 0 14px 0',
            fontSize: '15.5px',
            lineHeight: 1.7,
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            {currentMindMap.axis}
          </p>

          {/* Memorization Mental Key (مفتاح الربط الذهني للحافظ) */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <Sparkles size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>مفتاح الربط الذهني للحافظ: </strong>
              <span>{currentMindMap.memorizationKey}</span>
            </div>
          </div>
        </div>

        {/* Mastery / Comprehension Progress Bar */}
        <div style={{
          padding: '14px 20px',
          borderRadius: '14px',
          background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: currentMindMap.color }} />
            <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 800 }}>
              استيعاب المحاور الذهنية للسورة:
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              {completedNodesCount} من {totalNodesCount} محاور ({progressPercent}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px', maxWidth: '300px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              borderRadius: '4px',
              background: 'var(--glass-border)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: currentMindMap.color,
                transition: 'width 0.35s ease',
                borderRadius: '4px'
              }} />
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: currentMindMap.color }}>
              %{progressPercent}
            </span>
          </div>
        </div>

        {/* Visual Mind Map Flowchart / Tree (المحاور الموضوعية المتسلسلة) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '780px', margin: '0 auto' }}>
          {currentMindMap.nodes.map((node, index) => {
            const nodeKey = `surah_${selectedSurahNumber}_node_${node.id}`;
            const isDone = !!completedNodes[nodeKey];

            return (
              <div
                key={node.id}
                style={{
                  display: 'flex',
                  gap: '18px',
                  alignItems: 'flex-start',
                  position: 'relative',
                  background: isDone 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)' 
                    : 'var(--bg-surface)',
                  padding: '22px',
                  borderRadius: '18px',
                  border: `1.5px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`,
                  boxShadow: 'var(--shadow-soft)',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Vertical Tree Connector & Index Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isDone ? 'var(--primary)' : currentMindMap.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '15px',
                    boxShadow: `0 3px 10px ${isDone ? 'rgba(16, 185, 129, 0.4)' : `${currentMindMap.color}40`}`
                  }}>
                    {isDone ? <Check size={18} strokeWidth={3} /> : index + 1}
                  </div>

                  {index < currentMindMap.nodes.length - 1 && (
                    <div style={{
                      width: '3px',
                      height: '60px',
                      background: `linear-gradient(to bottom, ${currentMindMap.color}40, transparent)`,
                      margin: '6px 0'
                    }} />
                  )}
                </div>

                {/* Node Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {node.title}
                        </h4>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: 'var(--bg-color)',
                          border: '1px solid var(--glass-border)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: currentMindMap.color
                        }}>
                          الآيات {node.ayahRange}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Completion Toggle */}
                    <button
                      onClick={() => handleToggleNode(node)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: `1px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`,
                        background: isDone ? 'var(--primary-light)' : 'var(--bg-color)',
                        color: isDone ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle size={14} color="var(--primary)" />
                          <span>تم الاستيعاب والحفظ 🟢</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>تحديد كـ مستوعب</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Thematic Explanation */}
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.8,
                    textAlign: 'justify'
                  }}>
                    {node.desc}
                  </p>

                  {/* Detailed Thematic Points if present */}
                  {node.detailedPoints && node.detailedPoints.length > 0 && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      border: '1px dashed var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: currentMindMap.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>📌</span>
                        <span>محاور وتفاصيل المقطع:</span>
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingInlineStart: '18px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.7
                      }}>
                        {node.detailedPoints.map((pt, ptIdx) => (
                          <li key={ptIdx} style={{ marginBottom: '4px' }}>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Memorization & Connection Cue */}
                  {node.memorizationCue && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: `${currentMindMap.color}0D`,
                      border: `1px solid ${currentMindMap.color}25`,
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: 1.6
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>🔗</span>
                      <div>
                        <strong style={{ color: currentMindMap.color, marginInlineEnd: '4px' }}>مفتاح الربط الذهني للحفظ:</strong>
                        <span>{node.memorizationCue}</span>
                      </div>
                    </div>
                  )}

                  {/* Key Takeaway / Hook */}
                  {node.keyTakeaway && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-color)',
                      borderInlineStart: `3px solid ${currentMindMap.color}`,
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>💡</span>
                      <span>{node.keyTakeaway}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
