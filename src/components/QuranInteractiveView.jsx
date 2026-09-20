import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Mic, 
  Square, 
  RotateCcw, 
  Loader2, 
  AlertCircle, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Infinity, 
  Bookmark, 
  Star,
  Check,
  Eye,
  EyeOff,
  FileText,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRecitationRecorder } from '../hooks/useRecitationRecorder';
import { surahs, getJuzForPage, getJuzStartPage } from '../utils/quranData';

const recitersList = [
  { id: 'ar.dossari', name: 'ياسر الدوسري', sub: 'إمام الحرم المكي (تلاوة خاشعة مميزة)' },
  { id: 'ar.alafasy', name: 'مشاري بن راشد العفاسي', sub: 'تلاوة خاشعة' },
  { id: 'ar.husary', name: 'محمود خليل الحصري', sub: 'المعلم والمصحف المرتل' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي', sub: 'المنشاوي المرتل' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد', sub: 'عبد الباسط المرتل' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', sub: 'إمام الحرم المكي' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', sub: 'إمام الحرم المكي' }
];

export const QuranInteractiveView = ({ initialPageNumber = 2, onPageChange }) => {
  const { t, isRTL } = useLanguage();
  const { user, updateUserData } = useAuth();
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [pageNumber, setPageNumber] = useState(initialPageNumber); // Default to Page 2 (Start of Al-Baqarah)
  const [pageInputVal, setPageInputVal] = useState(initialPageNumber.toString());
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const pageCacheRef = useRef({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    const p = Math.max(1, Math.min(604, parseInt(newPage) || 1));
    setPageNumber(p);
    setPageInputVal(p.toString());
    if (onPageChange) {
      onPageChange(p);
    }
  }, [onPageChange]);

  useEffect(() => {
    if (initialPageNumber && initialPageNumber !== pageNumber) {
      setPageNumber(initialPageNumber);
      setPageInputVal(initialPageNumber.toString());
    }
  }, [initialPageNumber]);

  // Keyboard navigation for page flip (ArrowLeft = Next, ArrowRight = Previous in RTL)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      if (e.key === 'ArrowLeft') {
        handlePageChange(pageNumber + 1);
      } else if (e.key === 'ArrowRight') {
        handlePageChange(pageNumber - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, handlePageChange]);

  // Determine current surah and juz based on pageNumber
  let currentSurahIdx = 0;
  for (let i = 0; i < surahs.length; i++) {
    if (surahs[i].startPage <= pageNumber) {
      currentSurahIdx = i;
    } else {
      break;
    }
  }
  const currentJuz = getJuzForPage(pageNumber);

  const favorites = user?.favorites || [];
  const isFavorited = favorites.some(f => f.type === 'page' && f.id === pageNumber);

  const toggleFavoritePage = () => {
    let updated;
    if (isFavorited) {
      updated = favorites.filter(f => !(f.type === 'page' && f.id === pageNumber));
    } else {
      updated = [
        ...favorites,
        {
          type: 'page',
          id: pageNumber,
          title: `الصفحة ${pageNumber} (${surahName || 'سورة الشريفة'})`,
          addedAt: new Date().toLocaleDateString('ar-EG')
        }
      ];
    }
    updateUserData({ favorites: updated });
  };

  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surahName, setSurahName] = useState('البقرة');
  const [activeAyahNum, setActiveAyahNum] = useState(8); // Global ayah number for active audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1); // 1x, 3x, 5x, infinite
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [recitedAyahs, setRecitedAyahs] = useState({});
  const [activeTafsir, setActiveTafsir] = useState('');
  const [tafsirLoading, setTafsirLoading] = useState(false);

  // Recitation & Accuracy states
  const [showRecitationModal, setShowRecitationModal] = useState(false);
  const [recitationScope, setRecitationScope] = useState('page'); // 'page' | 'ayah' (default to full page!)
  const [recitationMode, setRecitationMode] = useState('voice'); // 'voice' | 'text'
  const [writtenRecitation, setWrittenRecitation] = useState('');
  const [hideAyahText, setHideAyahText] = useState(false);
  const [pageRecitationStats, setPageRecitationStats] = useState(null);
  const [ayahRecitationScores, setAyahRecitationScores] = useState({});
  const [recitationHistoryList, setRecitationHistoryList] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWordTooltip, setSelectedWordTooltip] = useState(null);

  const {
    isRecording: isAiRecording,
    isAnalyzing: isAiAnalyzing,
    isSaving: isAiSaving,
    duration: aiDuration,
    error: aiMicError,
    liveTranscript: aiLiveTranscript,
    analysisResult: aiAnalysisResult,
    saveSuccess: aiSaveSuccess,
    startRecording: startAiRecording,
    stopAndAnalyze: stopAiAndAnalyze,
    evaluateTextRecitation: evaluateAiTextRecitation,
    cancelRecording: cancelAiRecording,
    clearResult: clearAiResult
  } = useRecitationRecorder();

  const activeAyahObj = ayahs.find(a => a.number === activeAyahNum) || ayahs[0] || null;

  // Refresh recitation stats & history from server
  const refreshRecitationData = useCallback(() => {
    fetch(`/api/recitation/page-stats/${pageNumber}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setPageRecitationStats(data.stats);
        }
      })
      .catch(() => {});

    fetch(`/api/recitation/history?pageNumber=${pageNumber}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.history)) {
          setRecitationHistoryList(data.history);
          const scores = {};
          data.history.forEach(item => {
            if (!scores[item.ayahNumber] || item.accuracy > scores[item.ayahNumber].accuracy) {
              scores[item.ayahNumber] = item;
            }
          });
          setAyahRecitationScores(scores);
        }
      })
      .catch(() => {});
  }, [pageNumber]);

  useEffect(() => {
    refreshRecitationData();
  }, [refreshRecitationData]);

  const handleStartRecitation = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (audioRef.current) audioRef.current.pause();
    }
    clearAiResult();
    setSelectedWordTooltip(null);
    await startAiRecording();
  };

  const handleStopRecitation = async () => {
    const isPage = recitationScope === 'page';
    const targetExpected = isPage
      ? ayahs.map(a => a.text).join(' ')
      : (activeAyahObj?.text || '');

    const res = await stopAiAndAnalyze(targetExpected, {
      userId: user?.uid || 'demo_user_123',
      pageNumber,
      surahNumber: activeAyahObj?.surah?.number || 1,
      surahName: activeAyahObj?.surah?.name || surahName,
      ayahNumber: isPage ? null : activeAyahObj?.number,
      isFullPage: isPage,
      ayahs: isPage ? ayahs : undefined,
      type: 'voice'
    });

    if (res) {
      refreshRecitationData();
      if (res.accuracy >= 75) {
        if (isPage) {
          const newRecited = { ...recitedAyahs };
          ayahs.forEach(a => { newRecited[a.number] = true; });
          setRecitedAyahs(newRecited);
          const xpGained = res.accuracy >= 90 ? 100 : 60;
          updateUserData({ xp: (user?.xp || 100) + xpGained });
        } else {
          setRecitedAyahs(prev => ({ ...prev, [activeAyahNum]: true }));
          const xpGained = res.accuracy >= 95 ? 50 : 25;
          updateUserData({ xp: (user?.xp || 100) + xpGained });
        }
      }
    }
  };

  const handleEvaluateTextRecitation = async () => {
    if (!writtenRecitation.trim()) return;
    const isPage = recitationScope === 'page';
    const targetExpected = isPage
      ? ayahs.map(a => a.text).join(' ')
      : (activeAyahObj?.text || '');

    const res = await evaluateAiTextRecitation(writtenRecitation, targetExpected, {
      userId: user?.uid || 'demo_user_123',
      pageNumber,
      surahNumber: activeAyahObj?.surah?.number || 1,
      surahName: activeAyahObj?.surah?.name || surahName,
      ayahNumber: isPage ? null : activeAyahObj?.number,
      isFullPage: isPage,
      ayahs: isPage ? ayahs : undefined,
      type: 'text'
    });

    if (res) {
      refreshRecitationData();
      if (res.accuracy >= 75) {
        if (isPage) {
          const newRecited = { ...recitedAyahs };
          ayahs.forEach(a => { newRecited[a.number] = true; });
          setRecitedAyahs(newRecited);
          const xpGained = res.accuracy >= 90 ? 100 : 60;
          updateUserData({ xp: (user?.xp || 100) + xpGained });
        } else {
          setRecitedAyahs(prev => ({ ...prev, [activeAyahNum]: true }));
          const xpGained = res.accuracy >= 95 ? 50 : 25;
          updateUserData({ xp: (user?.xp || 100) + xpGained });
        }
      }
    }
  };

  const handleNextScopeRecitation = () => {
    if (recitationScope === 'page') {
      if (pageNumber < 604) {
        handlePageChange(pageNumber + 1);
        clearAiResult();
        setWrittenRecitation('');
        setSelectedWordTooltip(null);
      }
    } else {
      const currentIndex = ayahs.findIndex(a => a.number === activeAyahNum);
      if (currentIndex >= 0 && currentIndex < ayahs.length - 1 && ayahs[currentIndex + 1]) {
        const nextAyah = ayahs[currentIndex + 1];
        setActiveAyahNum(nextAyah.number);
        clearAiResult();
        setWrittenRecitation('');
        setSelectedWordTooltip(null);
      }
    }
  };

  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isChangingTrackRef = useRef(false);

  // Fetch Tafsir dynamically for the active ayah
  useEffect(() => {
    if (!activeAyahNum) return;
    setTafsirLoading(true);
    fetch(`https://api.alquran.cloud/v1/ayah/${activeAyahNum}/ar.muyassar`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 200 && data.data) {
          setActiveTafsir(data.data.text);
        } else {
          setActiveTafsir('لم نتمكن من العثور على التفسير الميسّر لهذه الآية حالياً.');
        }
        setTafsirLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Tafsir:', err);
        setActiveTafsir('عذراً، تعذر الاتصال بخادم التفسير حالياً.');
        setTafsirLoading(false);
      });
  }, [activeAyahNum]);

  // Load Quran Page from API dynamically with memory caching
  useEffect(() => {
    if (pageCacheRef.current[pageNumber]) {
      const cachedAyahs = pageCacheRef.current[pageNumber];
      setAyahs(cachedAyahs);
      if (cachedAyahs.length > 0) {
        setSurahName(cachedAyahs[0].surah?.name || 'سورة الشريفة');
        setActiveAyahNum(cachedAyahs[0].number);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 200 && data.data && data.data.ayahs) {
          pageCacheRef.current[pageNumber] = data.data.ayahs;
          setAyahs(data.data.ayahs);
          if (data.data.ayahs.length > 0) {
            setSurahName(data.data.ayahs[0].surah?.name || 'سورة الشريفة');
            setActiveAyahNum(data.data.ayahs[0].number);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Quran page:', err);
        setLoading(false);
      });
  }, [pageNumber]);

  const currentAudioUrl = (selectedReciter === 'ar.dossari' && activeAyahObj?.surah?.number && activeAyahObj?.numberInSurah)
    ? `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${String(activeAyahObj.surah.number).padStart(3, '0')}${String(activeAyahObj.numberInSurah).padStart(3, '0')}.mp3`
    : `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${activeAyahNum || 1}.mp3`;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (isPlayingRef.current && audioRef.current) {
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            isPlayingRef.current = true;
            isChangingTrackRef.current = false;
          })
          .catch(e => console.log('Audio auto-play error:', e));
      }
    }
  }, [activeAyahNum, selectedReciter]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlayingRef.current) {
      isChangingTrackRef.current = false;
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      isChangingTrackRef.current = false;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
        })
        .catch(e => console.log('Audio play error:', e));
    }
  };

  const handleAyahClick = (ayahNum) => {
    isChangingTrackRef.current = true;
    setActiveAyahNum(ayahNum);
    setCurrentRepeat(1);
    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  const handleAudioEnded = () => {
    if (repeatCount === 'infinite') {
      setCurrentRepeat(prev => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
      return;
    }

    if (currentRepeat < repeatCount) {
      setCurrentRepeat(prev => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
    } else {
      setCurrentRepeat(1);
      const currentIndex = ayahs.findIndex(a => a.number === activeAyahNum);
      if (currentIndex >= 0 && currentIndex < ayahs.length - 1 && ayahs[currentIndex + 1]) {
        isChangingTrackRef.current = true;
        setActiveAyahNum(ayahs[currentIndex + 1].number);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    }
  };

  const markAyahRecited = (ayahNum) => {
    setRecitedAyahs(prev => ({
      ...prev,
      [ayahNum]: !prev[ayahNum]
    }));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      direction: 'rtl',
      textAlign: 'right',
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%'
    }}>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        onEnded={handleAudioEnded}
        onPause={() => {
          if (!isChangingTrackRef.current) {
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
        }}
      />

      {/* Page Header & Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 24px',
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              المصحف التفاعلي وقراءة وتصحيح التلاوة
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              سورة {surahName || surahs[currentSurahIdx]?.name || 'الفاتحة'} • الصفحة {pageNumber} من 604
            </span>
          </div>
        </div>

        {/* Page Switcher & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Surah Dropdown Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-color)'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>السورة:</span>
            <select
              value={currentSurahIdx}
              onChange={(e) => {
                const sIdx = parseInt(e.target.value);
                if (surahs[sIdx]) {
                  handlePageChange(surahs[sIdx].startPage);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {surahs.map((s, idx) => (
                <option key={s.name} value={idx}>
                  {idx + 1}. {s.name} (ص {s.startPage})
                </option>
              ))}
            </select>
          </div>

          {/* Juz Dropdown Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-color)'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>الجزء:</span>
            <select
              value={currentJuz}
              onChange={(e) => {
                const jNum = parseInt(e.target.value);
                handlePageChange(getJuzStartPage(jNum));
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map(jNum => (
                <option key={jNum} value={jNum}>
                  الجزء {jNum} (ص {getJuzStartPage(jNum)})
                </option>
              ))}
            </select>
          </div>

          {/* Favorite Bookmark */}
          <button
            onClick={toggleFavoritePage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: isFavorited ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-color)',
              color: isFavorited ? '#D97706' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
            title={isFavorited ? 'إزالة الصفحة من المفضلة' : 'حفظ الصفحة في المفضلة'}
          >
            <Bookmark size={16} fill={isFavorited ? '#D97706' : 'none'} />
            <span>{isFavorited ? 'محفوظة' : 'تفضيل'}</span>
          </button>

          {/* Page Previous Button */}
          <button
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
              opacity: pageNumber <= 1 ? 0.5 : 1,
              fontWeight: 600,
              fontSize: '13px'
            }}
            title="الانتقال إلى الصفحة السابقة"
          >
            <ChevronRight size={16} />
            <span>السابقة</span>
          </button>

          {/* Interactive Direct Page Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseInt(pageInputVal);
              if (!isNaN(val)) {
                handlePageChange(val);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--primary-light)',
              borderRadius: '10px',
              border: '1px solid var(--primary)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>ص:</span>
            <input
              type="number"
              min={1}
              max={604}
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              onBlur={() => {
                const val = parseInt(pageInputVal);
                if (!isNaN(val)) {
                  handlePageChange(val);
                } else {
                  setPageInputVal(pageNumber.toString());
                }
              }}
              style={{
                width: '46px',
                padding: '2px 4px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>/ 604</span>
            <button
              type="submit"
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              انتقال
            </button>
          </form>

          {/* Page Next Button */}
          <button
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= 604}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              cursor: pageNumber >= 604 ? 'not-allowed' : 'pointer',
              opacity: pageNumber >= 604 ? 0.5 : 1,
              fontWeight: 600,
              fontSize: '13px'
            }}
            title="الانتقال إلى الصفحة التالية"
          >
            <span>التالية</span>
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Quick Jump Shortcuts for Common Surahs/Pages */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '10px 16px',
        borderRadius: '14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        fontSize: '12px'
      }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>انتقال سريع:</span>
        {[
          { name: 'الفاتحة', page: 1 },
          { name: 'البقرة', page: 2 },
          { name: 'آل عمران', page: 50 },
          { name: 'النساء', page: 77 },
          { name: 'يوسف', page: 235 },
          { name: 'الكهف', page: 293 },
          { name: 'مريم', page: 305 },
          { name: 'يس', page: 440 },
          { name: 'الملك', page: 562 },
          { name: 'النبأ', page: 582 },
          { name: 'الإخلاص', page: 604 }
        ].map(item => (
          <button
            key={item.name}
            onClick={() => handlePageChange(item.page)}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: pageNumber === item.page ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
              background: pageNumber === item.page ? 'var(--primary-light)' : 'transparent',
              color: pageNumber === item.page ? 'var(--primary)' : 'var(--text-primary)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {item.name} (ص {item.page})
          </button>
        ))}
        <span style={{ marginRight: 'auto', fontSize: '11px', color: 'var(--text-secondary)' }}>
          ⌨️ يمكنك أيضاً استخدام الأسهم (⬅️ / ➡️) للتنقل بين الصفحات
        </span>
      </div>

      {/* Reciter & Audio Controls Bar */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Reciter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Volume2 size={20} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>القارئ المرتل:</span>
          <select
            value={selectedReciter}
            onChange={(e) => setSelectedReciter(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {recitersList.map((reciter) => (
              <option key={reciter.id} value={reciter.id}>
                {reciter.name} ({reciter.sub})
              </option>
            ))}
          </select>
        </div>

        {/* Playback Controls & Recitation Launch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Repeat Ayah Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <Repeat size={15} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تكرار الآية:</span>
            {[1, 3, 5, 'infinite'].map((val) => (
              <button
                key={val}
                onClick={() => setRepeatCount(val)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: repeatCount === val ? 'var(--primary)' : 'transparent',
                  color: repeatCount === val ? 'white' : 'var(--text-primary)',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {val === 'infinite' ? <Infinity size={12} /> : `${val}x`}
              </button>
            ))}
          </div>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            title={isPlaying ? 'إيقاف مؤقت' : 'استماع للآية الحالية'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '-2px' }} />}
          </button>

          {/* Recite Page (Primary) & Single Ayah Buttons */}
          <button
            onClick={() => {
              setRecitationScope('page');
              setShowRecitationModal(true);
              if (isPlaying) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                if (audioRef.current) audioRef.current.pause();
              }
            }}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s ease'
            }}
            title="تسميع الصفحة كاملة وتصحيح التلاوة وتخزين دقة الحفظ"
          >
            <Mic size={17} />
            <span>📖 تسميع الصفحة {pageNumber} كاملة 🎯</span>
          </button>

          <button
            onClick={() => {
              setRecitationScope('ayah');
              setShowRecitationModal(prev => !prev);
              if (isPlaying) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                if (audioRef.current) audioRef.current.pause();
              }
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '12px',
              border: `1px solid ${showRecitationModal && recitationScope === 'ayah' ? 'var(--primary)' : 'rgba(16, 185, 129, 0.3)'}`,
              background: showRecitationModal && recitationScope === 'ayah' ? 'var(--primary)' : 'rgba(16, 185, 129, 0.08)',
              color: showRecitationModal && recitationScope === 'ayah' ? 'white' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="تسميع الآية المحددة فقط"
          >
            <span>آية محددة</span>
          </button>
        </div>
      </div>

      {/* Recitation Accuracy & Stats Banner for Current Page */}
      {pageRecitationStats && pageRecitationStats.hasAttempts && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} />
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  معدل دقة تسميع الصفحة {pageNumber}:{' '}
                  <span style={{ color: 'var(--primary, #10B981)', fontSize: '16px' }}>{pageRecitationStats.averageAccuracy}%</span>
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '8px' }}>
                  (أعلى نتيجة: {pageRecitationStats.bestAccuracy}% • {pageRecitationStats.totalAttempts} محاولات مسجلة)
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHistoryModal(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={14} />
              <span>سجل التسميعات السابقة</span>
            </button>
          </div>

          <div style={{ width: '100%', height: '7px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${pageRecitationStats.averageAccuracy}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      {/* Recitation Workspace Panel (قراءة، تسميع، تصحيح، وتخزين دقة الحفظ) */}
      {showRecitationModal && (
        <>
          {/* Backdrop on mobile */}
          {isMobile && (
            <div 
              onClick={() => setShowRecitationModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(3px)',
                zIndex: 9998
              }}
            />
          )}

          <div style={{
            position: isMobile ? 'fixed' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 9999 : 'auto',
            maxHeight: isMobile ? '88vh' : 'none',
            overflowY: isMobile ? 'auto' : 'visible',
            padding: isMobile ? '16px 16px 28px' : '26px',
            borderRadius: isMobile ? '24px 24px 0 0' : '24px',
            background: 'var(--bg-surface)',
            border: isMobile ? '1px solid var(--glass-border)' : '2px solid var(--primary)',
            borderBottom: isMobile ? 'none' : undefined,
            boxShadow: isMobile ? '0 -10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 35px rgba(16, 185, 129, 0.15)',
            direction: 'rtl',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '14px' : '18px',
            animation: isMobile ? 'slideUp 0.25s ease-out' : 'none'
          }}>
            {/* Mobile Sheet Drag Handle */}
            {isMobile && (
              <div style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--text-secondary)',
                opacity: 0.3,
                margin: '0 auto 4px auto'
              }} />
            )}

            {/* Header & Scope / Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {recitationScope === 'page'
                    ? `تسميع وتصحيح الصفحة ${pageNumber} كاملة (${ayahs.length} آيات) - سورة ${surahName}`
                    : `تسميع وتصحيح الآية ${activeAyahObj?.numberInSurah || 1} من سورة ${surahName}`}
                </h4>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  نظام التسميع والتحقق الصارم: يضبط الحركات والإعراب بدقة، يصحح التلاوة، ويخزن نسبة الدقة.
                </span>
              </div>
            </div>

            {/* Scope, Mode Selector & Hide Text Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {/* Scope Selector: Page vs Ayah */}
              <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <button
                  onClick={() => {
                    setRecitationScope('page');
                    clearAiResult();
                    setSelectedWordTooltip(null);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: recitationScope === 'page' ? 'var(--primary)' : 'transparent',
                    color: recitationScope === 'page' ? 'white' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <BookOpen size={14} />
                  <span>صفحة كاملة ({pageNumber})</span>
                </button>
                <button
                  onClick={() => {
                    setRecitationScope('ayah');
                    clearAiResult();
                    setSelectedWordTooltip(null);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: recitationScope === 'ayah' ? 'var(--primary)' : 'transparent',
                    color: recitationScope === 'ayah' ? 'white' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>آية محددة ({activeAyahObj?.numberInSurah || 1})</span>
                </button>
              </div>

              {/* Toggle Hide Text */}
              <button
                onClick={() => setHideAyahText(prev => !prev)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: hideAyahText ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-color)',
                  color: hideAyahText ? '#DC2626' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={hideAyahText ? 'إظهار نص الصفحة' : 'إخفاء الصفحة للتسميع غيباً'}
              >
                {hideAyahText ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{hideAyahText ? 'النص مخفي (تسميع غيباً)' : 'إخفاء للتسميع غيباً'}</span>
              </button>

              {/* Mode: Voice vs Text */}
              <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <button
                  onClick={() => setRecitationMode('voice')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: recitationMode === 'voice' ? 'var(--primary)' : 'transparent',
                    color: recitationMode === 'voice' ? 'white' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Mic size={13} />
                  <span>تسميع صوتي</span>
                </button>
                <button
                  onClick={() => setRecitationMode('text')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: recitationMode === 'text' ? 'var(--primary)' : 'transparent',
                    color: recitationMode === 'text' ? 'white' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FileText size={13} />
                  <span>تسميع كتابي</span>
                </button>
              </div>

              {/* Close Workspace */}
              <button
                onClick={() => setShowRecitationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px'
                }}
                title="إغلاق نافذة التسميع"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Strict Diacritic & Grammar Verification Notice */}
          <div style={{
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#1D4ED8'
          }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>تدقيق إعرابي وحركي صارم مفعل:</strong> يقوم المحرك بفحص اللحن الجلي (مثل: رفع المنصوب أو المجرور كقول <em>المؤمنون</em> بدل <em>المؤمنين</em>، وحركات الإعراب الأخيرة) واحتسابه خطأً صريحاً لضبط الحفظ بإتقان تام.
            </span>
          </div>

          {/* Reference Quran Text Box */}
          <div style={{
            padding: '20px 24px',
            borderRadius: '16px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            textAlign: 'center',
            position: 'relative',
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            {hideAyahText ? (
              <div style={{ padding: '20px 0', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  🙈 {recitationScope === 'page' ? `نص الصفحة ${pageNumber} كاملة مخفي` : 'نص الآية مخفي'} لتسميعه غيباً من صدرك... انقر "إظهار" عند الحاجة للمراجعة.
                </span>
              </div>
            ) : (
              <div>
                {recitationScope === 'page' ? (
                  <p style={{
                    margin: 0,
                    fontSize: '20px',
                    fontFamily: 'serif',
                    lineHeight: 2.2,
                    color: 'var(--text-primary)',
                    fontWeight: 700
                  }}>
                    {ayahs.map((a) => (
                      <span key={a.number} style={{ margin: '0 4px' }}>
                        {a.text}{' '}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--primary)',
                          color: 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 800,
                          margin: '0 2px'
                        }}>
                          {a.numberInSurah}
                        </span>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p style={{
                    margin: 0,
                    fontSize: '23px',
                    fontFamily: 'serif',
                    lineHeight: 1.9,
                    color: 'var(--text-primary)',
                    fontWeight: 700
                  }}>
                    ﴿ {activeAyahObj?.text} ﴾
                  </p>
                )}
              </div>
            )}

            {recitationScope === 'ayah' && activeAyahObj && ayahRecitationScores[activeAyahObj.number] && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                آخر دقة مسجلة لهذه الآية:{' '}
                <strong style={{ color: 'var(--primary, #10B981)' }}>
                  {ayahRecitationScores[activeAyahObj.number].accuracy}% ({ayahRecitationScores[activeAyahObj.number].rating || 'محفوظة'})
                </strong>
              </div>
            )}
          </div>

          {/* Voice Recitation Controls & Live Feedback */}
          {recitationMode === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {recitationScope === 'page'
                    ? `اضغط "ابدأ تسميع الصفحة كاملة" وتلُ آيات الصفحة ${pageNumber} متواصلة بصوت واضح. سيقوم النظام بفحص الصفحة بالكامل وحساب دقة كل آية:`
                    : 'اضغط "ابدأ التسميع" واقرأ الآية بصوت واضح. سيقوم النظام بمطابقة نطقك فورياً وحساب دقة الحفظ:'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!isAiRecording ? (
                    <button
                      onClick={handleStartRecitation}
                      disabled={isAiAnalyzing}
                      style={{
                        padding: '9px 22px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: isAiAnalyzing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Mic size={17} />
                      <span>{recitationScope === 'page' ? `ابدأ تسميع الصفحة ${pageNumber} كاملة 🎙️` : 'ابدأ التسميع الصوتي للآية'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecitation}
                      style={{
                        padding: '9px 22px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#EF4444',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'pulse 1.5s infinite',
                        boxShadow: '0 3px 12px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Square size={15} fill="white" />
                      <span>إيقاف وفحص تلاوة {recitationScope === 'page' ? 'الصفحة كاملة' : 'الآية'} ({Math.floor(aiDuration / 60)}:{(aiDuration % 60).toString().padStart(2, '0')})</span>
                    </button>
                  )}

                  {aiAnalysisResult && (
                    <button
                      onClick={() => { clearAiResult(); setSelectedWordTooltip(null); }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="إعادة التسميع من جديد"
                    >
                      <RotateCcw size={15} />
                      <span>إعادة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Live Speech Recognition Transcript Indicator */}
              {isAiRecording && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px dashed #10B981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '12px', color: 'var(--primary, #10B981)', fontWeight: 'bold' }}>الميكروفون يستمع لتلاوتك الآن:</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {aiLiveTranscript ? `"${aiLiveTranscript}"` : 'تفضل بالتلاوة بصوت مسموع وواضح...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Recitation Input (تسميع كتابي) */}
          {recitationMode === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {recitationScope === 'page'
                  ? `اكتب آيات الصفحة ${pageNumber} كاملة متواصلة غيباً هنا لفحص دقة الحفظ، اللحن الجلي، والحركات الإعرابية:`
                  : 'اكتب الآية الكريمة غيباً كما حفظتها (مع أو بدون تشكيل):'}
              </span>
              <textarea
                value={writtenRecitation}
                onChange={(e) => setWrittenRecitation(e.target.value)}
                placeholder={recitationScope === 'page'
                  ? `اكتب آيات الصفحة ${pageNumber} متواصلة هنا غيباً... (مثال لتجربة التدقيق: جرّب كتابة 'المؤمنون' في موضع 'المؤمنين' لترى رصد الخطأ فورياً)`
                  : 'اكتب نص الآية هنا غيباً لفحص دقة الحفظ...'}
                rows={recitationScope === 'page' ? 4 : 3}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontSize: '18px',
                  fontFamily: 'serif',
                  lineHeight: 1.8,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                {recitationScope === 'page' && pageNumber === 2 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setWrittenRecitation('الم ذلك الكتاب لا ريب فيه هدى للمتقين الذين يؤمنون بالغيب ويقيمون الصلاة ومما رزقناهم ينفقون والذين يؤمنون بما انزل اليك وما انزل من قبلك وبالاخرة هم يوقنون اولئك على هدى من ربهم واولئك هم المفلحون')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(55, 125, 113, 0.4)',
                        background: 'var(--primary-light)',
                        color: 'var(--primary, #10B981)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="تعبئة تلاوة الصفحة 2 الصحيحة لاختبار دقة الفحص"
                    >
                      ✨ تجربة تلاوة صحيحة للصفحة 2 (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWrittenRecitation('الم ذلك الكتاب لا ريب فيه هدى للمتقون الذين يؤمنون بالغيب ويقيمون الصلاة ومما رزقناهم ينفقون والذين يؤمنون بما انزل اليك وما انزل من قبلك وبالاخرة هم يوقنون اولئك على هدى من ربهم واولئك هم المفلحون')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220, 38, 38, 0.4)',
                        background: 'rgba(220, 38, 38, 0.08)',
                        color: '#DC2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="تعبئة خطأ إعرابي تجريبي (للمتقون بدل للمتقين) للتأكد من رصد اللحن الجلي"
                    >
                      ⚠️ تجربة خطأ إعرابي (للمتقون بدل للمتقين)
                    </button>
                  </div>
                )}

                <button
                  onClick={handleEvaluateTextRecitation}
                  disabled={isAiAnalyzing || !writtenRecitation.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: (isAiAnalyzing || !writtenRecitation.trim()) ? 'not-allowed' : 'pointer',
                    opacity: !writtenRecitation.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginRight: 'auto'
                  }}
                >
                  <Check size={16} />
                  <span>فحص وتصحيح التسميع الكتابي</span>
                </button>
              </div>
            </div>
          )}

          {/* Analyzing Spinner */}
          {isAiAnalyzing && (
            <div style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--primary-light)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                جاري مطابقة التلاوة مع النص العثماني والتدقيق الإعرابي والحركي الصارم وتخزين النتائج...
              </span>
            </div>
          )}

          {/* Mic or API Error */}
          {aiMicError && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{aiMicError}</span>
            </div>
          )}

          {/* Full Analysis, Correction & Accuracy Storage View */}
          {aiAnalysisResult && (
            <div style={{
              padding: '20px',
              borderRadius: '18px',
              background: aiAnalysisResult.accuracy >= 75 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(217, 119, 6, 0.08)',
              border: `1px solid ${aiAnalysisResult.accuracy >= 75 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Top Score & Status Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '18px',
                    background: aiAnalysisResult.accuracy >= 90 ? '#10B981' : (aiAnalysisResult.accuracy >= 75 ? '#F59E0B' : '#EF4444'),
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>{aiAnalysisResult.accuracy}%</span>
                    <span style={{ fontSize: '10px', opacity: 0.9 }}>{aiAnalysisResult.isFullPage ? 'دقة الصفحة' : 'الدقة'}</span>
                  </div>

                  <div>
                    <h5 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {aiAnalysisResult.ratingIcon || '🎯'} {aiAnalysisResult.rating || 'نتيجة التسميع'}
                      {aiAnalysisResult.isFullPage && <span style={{ marginRight: '8px', fontSize: '13px', color: 'var(--primary)' }}>(الصفحة {pageNumber} كاملة)</span>}
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>كلمات صحيحة: <strong style={{ color: 'var(--primary, #10B981)' }}>{aiAnalysisResult.stats?.correctCount || 0}</strong></span>
                      {aiAnalysisResult.stats?.grammarCount > 0 && (
                        <span>لحن جلي (إعراب/تصريف): <strong style={{ color: '#DC2626' }}>{aiAnalysisResult.stats.grammarCount}</strong></span>
                      )}
                      <span>أخطاء استبدال: <strong style={{ color: '#DC2626' }}>{aiAnalysisResult.stats?.errorCount || 0}</strong></span>
                      <span>كلمات منسية: <strong style={{ color: '#DC2626' }}>{aiAnalysisResult.stats?.missingCount || 0}</strong></span>
                      {aiAnalysisResult.stats?.diacriticCount > 0 && (
                        <span>حركات/تشكيل: <strong style={{ color: '#D97706' }}>{aiAnalysisResult.stats.diacriticCount}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Storage & XP Confirmation */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary, #10B981)',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle2 size={14} />
                    تم تخزين دقة {aiAnalysisResult.isFullPage ? `الصفحة ${pageNumber} كاملة` : 'الآية'} ({aiAnalysisResult.accuracy}%) في المحفظة 💾
                  </span>

                  {aiAnalysisResult.accuracy >= 75 && (
                    <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={14} /> +{aiAnalysisResult.isFullPage ? 100 : (aiAnalysisResult.accuracy >= 95 ? 50 : 25)} XP خبرة حفظ
                    </span>
                  )}
                </div>
              </div>

              {/* Dedicated Section: تقرير الأخطاء بالتحديد وما يجب تصويبه */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: (aiAnalysisResult.mistakes && aiAnalysisResult.mistakes.length > 0)
                  ? '1.5px solid rgba(220, 38, 38, 0.4)'
                  : '1.5px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(aiAnalysisResult.mistakes && aiAnalysisResult.mistakes.length > 0) ? (
                      <>
                        <AlertCircle size={20} style={{ color: '#DC2626' }} />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#DC2626' }}>
                          📋 تقرير الأخطاء بالتحديد ({aiAnalysisResult.mistakes.length} مواضع تحتاج تصويباً):
                        </h4>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} style={{ color: 'var(--primary, #10B981)' }} />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--primary, #10B981)' }}>
                          🌟 تبارك الرحمن! تلاوة خالية من أي أخطاء أو لحن جلي ✨
                        </h4>
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {(aiAnalysisResult.mistakes && aiAnalysisResult.mistakes.length > 0)
                      ? 'مقارنة دقيقة: ما تم نطقه مقابل الصواب في كتاب الله'
                      : 'إتقان تام للكلمات وحركات الإعراب والتصريف'}
                  </span>
                </div>

                {/* If no mistakes: celebratory feedback */}
                {(!aiAnalysisResult.mistakes || aiAnalysisResult.mistakes.length === 0) && (
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRight: '4px solid #10B981',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.7
                  }}>
                    ما شاء الله لا قوة إلا بالله! تم مطابقة تلاوتك لكلمات المصحف الشريف بالكامل دون رصد أي لحن جلي، استبدال، أو إسقاط للكلمات. حفظك في هذا الموضع متين ومثبت بإحسان.
                  </div>
                )}

                {/* If mistakes exist: explicit card for each mistake */}
                {aiAnalysisResult.mistakes && aiAnalysisResult.mistakes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiAnalysisResult.mistakes.map((m, mIdx) => (
                      <div
                        key={m.id || mIdx}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          background: 'var(--bg-color)',
                          border: '1px solid rgba(220, 38, 38, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        {/* Header of mistake: Location & Error Type Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#DC2626',
                              color: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {mIdx + 1}
                            </span>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                              {m.numberInSurah ? `في الآية رقم ${m.numberInSurah}` : (m.ayahNumber ? `الآية رقم ${m.ayahNumber}` : 'موضع في الصفحة')}
                              {m.surahName ? ` (${m.surahName})` : ''}
                            </strong>
                          </div>

                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: m.type === 'grammar_error' ? 'rgba(220, 38, 38, 0.15)' : (m.type === 'missing_word' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.15)'),
                            color: m.type === 'grammar_error' ? '#B91C1C' : (m.type === 'missing_word' ? '#DC2626' : '#D97706'),
                            border: `1px solid ${m.type === 'grammar_error' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}>
                            {m.typeLabel || 'خطأ في التسميع'}
                          </span>
                        </div>

                        {/* Comparison Boxes: Spoken vs Quran Expected */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '10px'
                        }}>
                          {/* Spoken / Mistake Box */}
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(220, 38, 38, 0.07)',
                            border: '1px solid rgba(220, 38, 38, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 'bold' }}>
                              ❌ ما نطقته أنت (الخطأ):
                            </span>
                            <span style={{
                              fontSize: '17px',
                              fontFamily: 'serif',
                              fontWeight: 700,
                              color: '#B91C1C',
                              direction: 'rtl'
                            }}>
                              {m.spoken ? `« ${m.spoken} »` : '« لم تُنطق (كلمة منسية سقطت) »'}
                            </span>
                          </div>

                          {/* Expected / Quran Truth Box */}
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '11px', color: 'var(--primary, #10B981)', fontWeight: 'bold' }}>
                              ✅ الصواب في كتاب الله:
                            </span>
                            <span style={{
                              fontSize: '18px',
                              fontFamily: 'serif',
                              fontWeight: 800,
                              color: 'var(--primary, #10B981)',
                              direction: 'rtl'
                            }}>
                              « {m.expected} »
                            </span>
                          </div>
                        </div>

                        {/* Explanation & Correction Tip */}
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-surface)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          lineHeight: 1.6,
                          borderRight: '3px solid var(--primary)'
                        }}>
                          <div>💡 <strong>الشرح:</strong> {m.message}</div>
                          {m.correctionTip && (
                            <div style={{ marginTop: '4px', color: 'var(--primary)', fontWeight: 700 }}>
                              🎯 <strong>توجيه التثبيت:</strong> {m.correctionTip}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Word-by-Word Colorized Corrections */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🔍 تصحيح الكلمات ومطابقة النطق (انقر على أي كلمة لعرض سبب الخطأ وتصحيحه):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> صحيح</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} /> لحن جلي / خطأ كلمة</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} /> حركة تشكيل / زيادة</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px dashed #DC2626' }} /> كلمة منسية</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  padding: '18px',
                  background: 'var(--bg-color)',
                  borderRadius: '14px',
                  border: '1px solid var(--glass-border)',
                  lineHeight: 2
                }}>
                  {aiAnalysisResult.results?.map((w, idx) => {
                    let bg = 'var(--primary-light)';
                    let color = 'var(--primary, #10B981)';
                    let border = 'rgba(55, 125, 113, 0.3)';

                    if (w.status === 'grammar_error') {
                      bg = 'rgba(220, 38, 38, 0.18)';
                      color = '#B91C1C';
                      border = '2px solid #DC2626';
                    } else if (w.status === 'word_error') {
                      bg = 'rgba(239, 68, 68, 0.12)';
                      color = '#DC2626';
                      border = '1px solid rgba(239, 68, 68, 0.3)';
                    } else if (w.status === 'missing_word') {
                      bg = 'rgba(239, 68, 68, 0.05)';
                      color = '#DC2626';
                      border = '1px dashed #DC2626';
                    } else if (w.status === 'diacritic_error' || w.status === 'extra_word') {
                      bg = 'rgba(245, 158, 11, 0.12)';
                      color = '#D97706';
                      border = '1px solid rgba(245, 158, 11, 0.3)';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedWordTooltip(selectedWordTooltip?.idx === idx ? null : { ...w, idx })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '18px',
                          fontFamily: 'serif',
                          fontWeight: 700,
                          background: bg,
                          color: color,
                          border: border,
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{w.expected || w.spoken}</span>
                        {w.status === 'grammar_error' && (
                          <span style={{ fontSize: '10px', background: '#DC2626', color: 'white', borderRadius: '4px', padding: '1px 4px' }}>
                            لحن جلي
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Word Detail Popover */}
                {selectedWordTooltip && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: selectedWordTooltip.status === 'grammar_error' ? 'rgba(220, 38, 38, 0.08)' : 'var(--bg-surface)',
                    border: `1.5px solid ${selectedWordTooltip.status === 'grammar_error' ? '#DC2626' : 'var(--primary)'}`,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <strong style={{ color: selectedWordTooltip.status === 'grammar_error' ? '#DC2626' : 'var(--primary)' }}>
                        {selectedWordTooltip.status === 'grammar_error' ? '⚠️ تنبيه لحن جلي / خطأ إعرابي: ' : 'تنبيه الكلمة: '}
                      </strong>
                      <span>{selectedWordTooltip.message}</span>
                      {selectedWordTooltip.spoken && (
                        <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>
                          (المنطوق في التلاوة: "{selectedWordTooltip.spoken}")
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedWordTooltip(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Per-Ayah Breakdown for Page Recitation (تفصيل دقة كل آية بالصفحة) */}
              {aiAnalysisResult.isFullPage && Array.isArray(aiAnalysisResult.ayahBreakdown) && aiAnalysisResult.ayahBreakdown.length > 0 && (
                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                      تفصيل دقة كل آية في الصفحة ({aiAnalysisResult.ayahBreakdown.length} آيات):
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      متوسط دقة الصفحة: <strong>{aiAnalysisResult.accuracy}%</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {aiAnalysisResult.ayahBreakdown.map((ab) => (
                      <div
                        key={ab.ayahNumber}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-color)',
                          border: `1px solid ${ab.accuracy >= 90 ? 'rgba(16, 185, 129, 0.3)' : (ab.accuracy >= 75 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                            الآية {ab.numberInSurah}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 900,
                            background: ab.accuracy >= 90 ? '#10B981' : (ab.accuracy >= 75 ? '#F59E0B' : '#EF4444'),
                            color: 'white'
                          }}>
                            {ab.accuracy}%
                          </span>
                        </div>

                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: 'serif'
                        }}>
                          {ab.text}
                        </p>

                        {ab.mistakes && ab.mistakes.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                            {ab.mistakes.slice(0, 2).map((m, mIdx) => (
                              <span key={mIdx} style={{ fontSize: '11px', color: '#DC2626' }}>
                                • {m.message}
                              </span>
                            ))}
                            {ab.mistakes.length > 2 && (
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                + {ab.mistakes.length - 2} ملاحظات أخرى
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text comparison transcript */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--bg-surface)',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>ما التقطه النظام من تلاوتك: </span>
                  <strong style={{ color: 'var(--primary)' }}>"{aiAnalysisResult.transcribedText || aiAnalysisResult.transcribedSpoken || '—'}"</strong>
                </div>
              </div>

              {/* Next Steps Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={() => { clearAiResult(); setSelectedWordTooltip(null); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>إعادة التسميع لتحسين الدقة</span>
                </button>

                <button
                  onClick={handleNextScopeRecitation}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{recitationScope === 'page' ? 'الانتقال للصفحة التالية والتسميع' : 'الانتقال للآية التالية'}</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </>
      )}

      {/* Recitation History Modal */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '24px',
            direction: 'rtl',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} style={{ color: 'var(--primary)' }} />
                <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: 800 }}>
                  سجل دقة التسميعات للصفحة {pageNumber}
                </h4>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {recitationHistoryList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                لم يتم تسجيل أي تسميعات سابقة لهذه الصفحة حتى الآن.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recitationHistoryList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                          الآية {item.ayahNumber} ({item.surahName})
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: item.type === 'voice' ? 'var(--primary-light)' : 'rgba(59, 130, 246, 0.1)',
                          color: item.type === 'voice' ? 'var(--primary, #10B981)' : '#2563EB'
                        }}>
                          {item.type === 'voice' ? '🎙️ صوتي' : '✍️ كتابي'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(item.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '14px',
                        background: item.accuracy >= 90 ? '#10B981' : (item.accuracy >= 75 ? '#F59E0B' : '#EF4444'),
                        color: 'white'
                      }}>
                        {item.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Synchronized Verses Display Box */}
      <div style={{
        padding: isMobile ? '16px 12px' : '36px',
        borderRadius: isMobile ? '20px' : '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '80px' : '0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            {isMobile ? '💡 المس أي آية للاستماع أو التسميع:' : '💡 انقر على أي آية للاستماع إليها أو اضغط أيقونة الميكروفون للتسميع والتصحيح:'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>
            {surahName} (صفحة {pageNumber})
          </span>
        </div>

        {/* Verses List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            جاري تحميل آيات الصفحة من المصحف الشريف...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
            {ayahs.map((ayah) => {
              const isActive = activeAyahNum === ayah.number;
              const isRecited = recitedAyahs[ayah.number];
              const ayahScore = ayahRecitationScores[ayah.number];

              return (
                <div
                  key={ayah.number}
                  onClick={() => handleAyahClick(ayah.number)}
                  style={{
                    padding: isMobile ? '14px 12px' : '20px 24px',
                    borderRadius: isMobile ? '14px' : '16px',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' 
                      : 'var(--bg-color)',
                    border: `2px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: isMobile ? '10px' : '16px',
                    boxShadow: isActive ? '0 4px 16px rgba(16, 185, 129, 0.15)' : 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  {/* Verse Text */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isActive ? 'var(--primary)' : 'var(--glass-border)',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {ayah.numberInSurah}
                    </span>

                    <p style={{
                      margin: 0,
                      fontSize: '22px',
                      fontFamily: 'serif',
                      lineHeight: 1.8,
                      color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      direction: 'rtl',
                      textAlign: 'right',
                      width: '100%'
                    }}>
                      ﴿ {ayah.text} ﴾
                    </p>
                  </div>

                  {/* Status Indicator & Quick Recite */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Saved Recitation Accuracy Score Badge */}
                    {ayahScore && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: ayahScore.accuracy >= 90 ? 'var(--primary-light)' : 'rgba(245, 158, 11, 0.15)',
                        color: ayahScore.accuracy >= 90 ? 'var(--primary, #10B981)' : '#D97706',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }} title={`آخر دقة تسميع: ${ayahScore.accuracy}%`}>
                        <Award size={12} /> {ayahScore.accuracy}%
                      </span>
                    )}

                    {isActive && isPlaying && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        <Sparkles size={12} /> يجري الاستماع
                      </span>
                    )}

                    {/* Quick Recite Ayah Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAyahNum(ayah.number);
                        setShowRecitationModal(true);
                        if (isPlaying) {
                          setIsPlaying(false);
                          isPlayingRef.current = false;
                          if (audioRef.current) audioRef.current.pause();
                        }
                      }}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                      title="تسميع هذه الآية وتصحيحها"
                    >
                      <Mic size={15} />
                      <span>تسميع</span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); markAyahRecited(ayah.number); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: isRecited ? '#10B981' : 'var(--text-secondary)'
                      }}
                      title="تحديد كـ تم التسميع يدوياً"
                    >
                      <CheckCircle2 size={22} fill={isRecited ? '#10B981' : 'none'} color={isRecited ? 'white' : 'currentColor'} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Page Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          marginTop: '20px',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
              opacity: pageNumber <= 1 ? 0.4 : 1,
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <ChevronRight size={18} />
            <span>الصفحة السابقة {pageNumber > 1 ? `(ص ${pageNumber - 1})` : ''}</span>
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
              صفحة {pageNumber} من 604
            </span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>
              سورة {surahName || surahs[currentSurahIdx]?.name || 'الفاتحة'} • الجزء {getJuzForPage(pageNumber)}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= 604}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              cursor: pageNumber >= 604 ? 'not-allowed' : 'pointer',
              opacity: pageNumber >= 604 ? 0.4 : 1,
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <span>الصفحة التالية {pageNumber < 604 ? `(ص ${pageNumber + 1})` : ''}</span>
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Tafsir & Reflection Card */}
      {activeAyahNum && (
        <div style={{
          padding: '24px 28px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.04) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📖 التفسير الميسّر والتدبر للآية {ayahs.find(a => a.number === activeAyahNum)?.numberInSurah || ''}
          </h4>
          {tafsirLoading ? (
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>جاري تحميل التفسير والتدبر للآية...</div>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.7, direction: 'rtl', textAlign: 'right' }}>
                {activeTafsir}
              </p>
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-surface)', borderRight: '4px solid var(--primary)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                💡 <b>توجيه للتدبر والعمل بالآية:</b> تأمل المعنى السابق واسعَ لتطبيق توجيهات الآية الكريمة في سلوكك اليومي ومعاملاتك مع الآخرين لتنال بركة حفظ وفهم كلام الله.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile-Only Quran Floating Action Dock (Docking above BottomNavBar) */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
          left: '12px',
          right: '12px',
          padding: '8px 12px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 900,
          color: 'white',
          direction: 'rtl'
        }}>
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pageNumber <= 1 ? 0.3 : 1,
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer'
            }}
            title="الصفحة السابقة"
          >
            <ChevronRight size={18} />
          </button>

          {/* Audio Recitation Play/Pause */}
          <button
            onClick={handleTogglePlay}
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              background: isPlaying ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              border: isPlaying ? '1px solid #10B981' : 'none',
              color: isPlaying ? '#34D399' : 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? 'إيقاف' : 'استماع'}</span>
          </button>

          {/* Center Prominent AI Recitation Button */}
          <button
            onClick={() => {
              if (navigator?.vibrate) {
                try { navigator.vibrate(15); } catch (e) {}
              }
              setShowRecitationModal(true);
            }}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '2.5px solid rgba(255, 255, 255, 0.35)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(55, 125, 113, 0.5)',
              cursor: 'pointer',
              marginTop: '-18px',
              touchAction: 'manipulation'
            }}
            title="تسميع وتصحيح ذكي بالذكاء الاصطناعي"
          >
            <Mic size={22} />
          </button>

          {/* Current Page Indicator with Quick Jump */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>صفحة</span>
            <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>{pageNumber}</strong>
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= 604}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pageNumber >= 604 ? 0.3 : 1,
              cursor: pageNumber >= 604 ? 'not-allowed' : 'pointer'
            }}
            title="الصفحة التالية"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

    </div>
  );
};
