import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  BookOpen, 
  Moon, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Circle, 
  Compass, 
  Flame, 
  Clock, 
  Layers, 
  Play, 
  Pause, 
  Volume2, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Sliders, 
  Heart, 
  Sun, 
  Award, 
  Check, 
  Cloud,
  ArrowRight,
  ExternalLink,
  Mic,
  Calendar,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  getSurahNameForPage, 
  getJuzForPage, 
  getPageRangeForJuz, 
  getJuzStartPage,
  surahs 
} from '../utils/quranData';
import { 
  generateFiveFortressesPlan, 
  saveFortressPlanToFirestore, 
  getFortressPlanFromFirestore 
} from '../lib/fortressService';

export const FiveFortressesVisualMap = ({ onNavigateToVoiceRecitation, onNavigateToQuran }) => {
  const { user, updateUserData } = useAuth();
  const { isRTL, lang } = useLanguage();
  const { notifyAndCelebrate } = useNotifications();
  const userId = user?.uid || 'guest';

  // Current user's progress
  const userMemorizedCount = Math.max(0, Number(user?.memorizedPagesCount) || 0);
  const initialPage = Math.min(604, Math.max(1, userMemorizedCount + 1));
  const initialJuz = getJuzForPage(initialPage);

  // Active state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentJuz, setCurrentJuz] = useState(initialJuz);
  const [activeFortressTab, setActiveFortressTab] = useState(1); // 1 to 5
  const [completion, setCompletion] = useState(user?.preferences?.fortressesToday || {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  });

  // Repetition Clicker Studio State
  const [repCounter, setRepCounter] = useState(0);
  const [repTarget, setRepTarget] = useState(20);
  const [repStep, setRepStep] = useState(1); // 1: Ayah 1 (20x), 2: Ayah 2 (20x), 3: Link (10x), 4: Whole Page (40x)

  // Audio State for Fortresses
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0); // 1.0, 1.25, 1.5
  const [selectedReciter, setSelectedReciter] = useState('ar.husary');
  const audioRef = useRef(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'saving' | 'saved'

  // Calculate dynamic 5-fortresses boundaries
  const currentSurah = getSurahNameForPage(currentPage);
  const juzRange = getPageRangeForJuz(currentJuz);
  
  // Fortress 1 (Khatmah Hadr): Current Juz
  const fort1Juz = currentJuz;
  const fort1Range = getPageRangeForJuz(fort1Juz);

  // Fortress 2 (Triple Preparation): Night Prep (Page + 1), Close Prep (Current Page)
  const nextPage = Math.min(604, currentPage + 1);
  const nextSurah = getSurahNameForPage(nextPage);

  // Fortress 3 (New Memorization): Current Page
  const fort3Page = currentPage;
  const fort3Surah = currentSurah;

  // Fortress 4 (Near Revision): Last 20 pages
  const fort4Start = Math.max(1, currentPage - 20);
  const fort4End = Math.max(1, currentPage - 1);
  const fort4TotalPages = currentPage > 1 ? (fort4End - fort4Start + 1) : 0;

  // Fortress 5 (Distant Revision): Ajzaa 1 to (currentJuz - 1)
  const pastAjzaaCount = Math.max(0, currentJuz - 1);
  const todayDistantJuz = pastAjzaaCount > 0 ? ((currentPage % pastAjzaaCount) + 1) : null;

  // Sound effect for repetition ding
  const playDing = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context might not be allowed without gesture
    }
  };

  // Load from Firestore or local storage
  useEffect(() => {
    async function loadData() {
      if (userId && userId !== 'guest') {
        const remotePlan = await getFortressPlanFromFirestore(userId, currentJuz, currentPage);
        if (remotePlan?.completionStatus) {
          setCompletion(remotePlan.completionStatus);
        }
      }
    }
    loadData();
  }, [userId]);

  // Handle page change
  const handlePageChange = (newPageNum) => {
    const safeP = Math.min(604, Math.max(1, Number(newPageNum) || 1));
    setCurrentPage(safeP);
    const safeJ = getJuzForPage(safeP);
    setCurrentJuz(safeJ);
    setRepCounter(0);
  };

  // Handle Juz change
  const handleJuzChange = (newJuzNum) => {
    const safeJ = Math.min(30, Math.max(1, Number(newJuzNum) || 1));
    setCurrentJuz(safeJ);
    const startP = getJuzStartPage(safeJ);
    setCurrentPage(startP);
    setRepCounter(0);
  };

  // Toggle completion of a fortress
  const handleToggleFortress = async (fortId) => {
    const newStatus = !completion[fortId];
    const updated = {
      ...completion,
      [fortId]: newStatus
    };
    setCompletion(updated);

    // Calculate XP
    const deltaXp = newStatus ? 60 : -60;
    const newXp = Math.max(0, (user?.xp || 100) + deltaXp);
    const newLevel = Math.floor(newXp / 500) + 1;

    updateUserData({
      xp: newXp,
      level: newLevel,
      preferences: {
        ...(user?.preferences || {}),
        fortressesToday: updated
      }
    });

    // Save to Firestore
    setSyncStatus('saving');
    const planObj = generateFiveFortressesPlan(currentJuz, currentPage);
    planObj.completionStatus = updated;
    await saveFortressPlanToFirestore(userId, planObj);
    setSyncStatus('saved');
    setTimeout(() => setSyncStatus('synced'), 2000);

    if (newStatus) {
      playDing();
      const doneCount = Object.values(updated).filter(Boolean).length;
      if (doneCount === 5) {
        notifyAndCelebrate({
          title: isRTL ? '🏆 تاج الحصون الخمسة! أنجزت كافة الحصون اليومية!' : '🏆 5-Fortresses Crown! All 5 Completed!',
          message: isRTL 
            ? 'ما شاء الله تبارك الله! أتممت القراءة والتحضير والحفظ والمراجعة القريبة والبعيدة!'
            : 'MashaAllah! You completed Continuous Reading, Triple Prep, New Memorization, Near Review, and Distant Review!',
          type: 'wird',
          xpBonus: 250,
          badgeTitle: isRTL ? 'فارس الحصون الخمسة' : 'Knight of Five Fortresses'
        });
      } else {
        const fortNames = {
          1: isRTL ? 'قراءة الختمة والحدر' : 'Continuous Reading (Hadr)',
          2: isRTL ? 'التحضير الثلاثي' : 'Triple Preparation',
          3: isRTL ? 'الحفظ الجديد بالتكرار' : 'New Memorization',
          4: isRTL ? 'المراجعة القريبة' : 'Near Past Review',
          5: isRTL ? 'المراجعة البعيدة' : 'Distant Past Review'
        };
        notifyAndCelebrate({
          title: isRTL ? `تم إنجاز: ${fortNames[fortId]}! 🎯` : `Completed: ${fortNames[fortId]}! 🎯`,
          message: isRTL ? 'أكملت الحصن بنجاح (+60 XP). بارك الله في همتك!' : 'Fortress marked complete (+60 XP)!',
          type: 'wird',
          xpBonus: 60
        });
      }
    }
  };

  // Repetition Increment
  const handleIncrementRep = () => {
    const next = repCounter + 1;
    setRepCounter(next);
    playDing();

    if (next >= repTarget) {
      notifyAndCelebrate({
        title: isRTL ? '🎉 اكتمل نصاب التكرار بنجاح!' : '🎉 Repetition Target Reached!',
        message: isRTL ? `أتممت ${repTarget} تكراراً متقناً لرسوخ الآيات في الذاكرة الدائمة!` : `You achieved ${repTarget} repetitions!`,
        type: 'wird',
        xpBonus: 40
      });
    }
  };

  // Audio Playback Handler
  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.playbackRate = audioSpeed;
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(e => console.log('Audio playback waiting:', e));
    }
  };

  const handleSpeedChange = (speed) => {
    setAudioSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const completedCount = Object.values(completion).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  // Audio URL helper for Quran Surah or Ayah
  const getAudioSource = () => {
    const surahNum = surahs.findIndex(s => s.name === currentSurah) + 1 || 1;
    const formattedSurah = String(surahNum).padStart(3, '0');
    return `https://server8.mp3quran.net/afs/${formattedSurah}.mp3`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* 🌟 Top Hero: 5-Fortresses Shield Panorama */}
      <div style={{
        padding: '24px 28px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)',
        color: 'white',
        border: '1.5px solid rgba(52, 211, 153, 0.35)',
        boxShadow: '0 12px 35px rgba(6, 78, 59, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: isRTL ? '-30px' : 'auto',
          left: isRTL ? 'auto' : '-30px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(52, 211, 153, 0.2)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.2)'
              }}>
                <ShieldCheck size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                    {isRTL ? 'خريطة الحصون الخمسة التفاعلية 🏰' : 'Interactive 5-Fortresses Quran Map 🏰'}
                  </h2>
                  <span style={{
                    fontSize: '11.5px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: 'rgba(52, 211, 153, 0.25)',
                    color: '#6EE7B7',
                    fontWeight: 800,
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                  }}>
                    {isRTL ? 'المنهجية العلمية الراسخة' : 'Proven Scientific Methodology'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#A7F3D0' }}>
                  {isRTL 
                    ? 'ربط وتوزيع أورادك الخمسة بدقة على كامل صفحات المصحف (604 صفحة) لتثبيت الحفظ ومنع النسيان.'
                    : 'Real-time mapping of your 5 daily Quranic fortresses across all 604 pages to guarantee unshakable retention.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sync & XP Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#D1FAE5'
            }}>
              <Cloud size={14} color="#34D399" />
              <span>{syncStatus === 'saving' ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'مربوط بسحابة Firestore' : 'Firestore Synced')}</span>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#FBBF24',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              <Flame size={14} />
              <span>{completedCount} / 5 {isRTL ? 'حصون منجزة' : 'Fortresses'} ({progressPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Global Fortress Progress Bar */}
        <div style={{ marginTop: '16px', width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #FBBF24 0%, #10B981 100%)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* 🧭 Interactive Quran Heat Navigator: The 604-Page 5-Fortresses Strip */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {isRTL ? 'شريط الرؤية الشاملة لمواقع الحصون الخمسة بالمصحف' : 'Comprehensive 5-Fortresses Quran Strip'}
            </h3>
          </div>

          {/* Quick Page & Juz Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{isRTL ? 'الجزء:' : 'Juz:'}</span>
              <select
                value={currentJuz}
                onChange={(e) => handleJuzChange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                  <option key={j} value={j}>
                    {isRTL ? `الجزء ${j}` : `Juz ${j}`} ({getPageRangeForJuz(j).startPage}-{getPageRangeForJuz(j).endPage})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{isRTL ? 'الصفحة:' : 'Page:'}</span>
              <input
                type="number"
                min="1"
                max="604"
                value={currentPage}
                onChange={(e) => handlePageChange(e.target.value)}
                style={{
                  width: '65px',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 604</span>
            </div>
          </div>
        </div>

        {/* 🗺️ Panoramic 30-Juz Interactive Visual Strip */}
        <div style={{
          position: 'relative',
          padding: '16px',
          borderRadius: '16px',
          background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden'
        }}>
          {/* Juz Blocks Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(30, 1fr)',
            gap: '3px',
            height: '42px',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(j => {
              const range = getPageRangeForJuz(j);
              const isCurrent = j === currentJuz;
              const isPast = j < currentJuz;
              const isFort1Khatmah = j === fort1Juz;

              let bgColor = 'rgba(255, 255, 255, 0.05)';
              let borderStyle = '1px solid var(--glass-border)';

              if (isCurrent) {
                bgColor = '#10B981';
                borderStyle = '2px solid #34D399';
              } else if (isPast) {
                bgColor = 'rgba(245, 158, 11, 0.25)';
                borderStyle = '1px solid rgba(245, 158, 11, 0.5)';
              } else if (isFort1Khatmah) {
                bgColor = 'rgba(59, 130, 246, 0.3)';
              }

              return (
                <div
                  key={j}
                  onClick={() => handleJuzChange(j)}
                  title={isRTL ? `الجزء ${j} (ص ${range.startPage} - ${range.endPage})` : `Juz ${j} (Pages ${range.startPage}-${range.endPage})`}
                  style={{
                    height: '100%',
                    borderRadius: '4px',
                    background: bgColor,
                    border: borderStyle,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: isCurrent ? '900' : 'bold',
                    color: isCurrent ? 'white' : (isPast ? '#F59E0B' : 'var(--text-secondary)'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{j}</span>
                </div>
              );
            })}
          </div>

          {/* Interactive Legend for the 5 Fortresses on the Map */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--glass-border)',
            fontSize: '12px'
          }}>
            <div 
              onClick={() => setActiveFortressTab(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: activeFortressTab === 1 ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: activeFortressTab === 1 ? '1px solid #3B82F6' : '1px solid transparent',
                cursor: 'pointer',
                color: '#3B82F6'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3B82F6' }} />
              <strong>{isRTL ? '١. الختمة والحدر:' : '1. Hadr Khatmah:'}</strong>
              <span>{isRTL ? `الجزء ${fort1Juz}` : `Juz ${fort1Juz}`}</span>
            </div>

            <div 
              onClick={() => setActiveFortressTab(2)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: activeFortressTab === 2 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: activeFortressTab === 2 ? '1px solid #8B5CF6' : '1px solid transparent',
                cursor: 'pointer',
                color: '#8B5CF6'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6' }} />
              <strong>{isRTL ? '٢. التحضير:' : '2. Prep:'}</strong>
              <span>{isRTL ? `ص ${currentPage} و ${nextPage}` : `P. ${currentPage}, ${nextPage}`}</span>
            </div>

            <div 
              onClick={() => setActiveFortressTab(3)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: activeFortressTab === 3 ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: activeFortressTab === 3 ? '1px solid #10B981' : '1px solid transparent',
                cursor: 'pointer',
                color: '#10B981'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
              <strong>{isRTL ? '٣. الحفظ الجديد:' : '3. New Mem:'}</strong>
              <span>{isRTL ? `ص ${fort3Page} (${fort3Surah})` : `P. ${fort3Page}`}</span>
            </div>

            <div 
              onClick={() => setActiveFortressTab(4)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: activeFortressTab === 4 ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                border: activeFortressTab === 4 ? '1px solid #EC4899' : '1px solid transparent',
                cursor: 'pointer',
                color: '#EC4899'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EC4899' }} />
              <strong>{isRTL ? '٤. الماضي القريب:' : '4. Near Review:'}</strong>
              <span>{fort4TotalPages > 0 ? (isRTL ? `ص ${fort4Start}-${fort4End}` : `P. ${fort4Start}-${fort4End}`) : (isRTL ? 'صفحة 1' : 'P. 1')}</span>
            </div>

            <div 
              onClick={() => setActiveFortressTab(5)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: activeFortressTab === 5 ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                border: activeFortressTab === 5 ? '1px solid #F59E0B' : '1px solid transparent',
                cursor: 'pointer',
                color: '#F59E0B'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
              <strong>{isRTL ? '٥. الماضي البعيد:' : '5. Far Review:'}</strong>
              <span>{pastAjzaaCount > 0 ? (isRTL ? `الأجزاء ١-${pastAjzaaCount}` : `Juz 1-${pastAjzaaCount}`) : (isRTL ? 'ينشط بعد الجزء 1' : 'Active after Juz 1')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🏰 Five Fortress Interactive Workstations Selector */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 1, title: isRTL ? 'الحصن ١: قراءة الختمة والحدر' : 'Fortress 1: Continuous Reading', color: '#3B82F6', icon: BookOpen, target: isRTL ? `الجزء ${fort1Juz}` : `Juz ${fort1Juz}` },
          { id: 2, title: isRTL ? 'الحصن ٢: التحضير الثلاثي' : 'Fortress 2: Triple Prep', color: '#8B5CF6', icon: Moon, target: isRTL ? `ص ${currentPage} و ${nextPage}` : `P. ${currentPage} & ${nextPage}` },
          { id: 3, title: isRTL ? 'الحصن ٣: الحفظ الجديد (20x/40x)' : 'Fortress 3: New Memorization', color: '#10B981', icon: Sparkles, target: isRTL ? `ص ${fort3Page} (${fort3Surah})` : `P. ${fort3Page}` },
          { id: 4, title: isRTL ? 'الحصن ٤: المراجعة القريبة (آخر 20 ص)' : 'Fortress 4: Near Review', color: '#EC4899', icon: RefreshCw, target: `${fort4TotalPages} ${isRTL ? 'صفحة' : 'Pages'}` },
          { id: 5, title: isRTL ? 'الحصن ٥: المراجعة البعيدة والصلاة' : 'Fortress 5: Distant Review', color: '#F59E0B', icon: ShieldCheck, target: isRTL ? (pastAjzaaCount > 0 ? `الأجزاء 1 إلى ${pastAjzaaCount}` : 'ينشط لاحقاً') : `Juz 1-${pastAjzaaCount}` }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFortressTab === tab.id;
          const isDone = !!completion[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFortressTab(tab.id)}
              style={{
                flex: 1,
                minWidth: '190px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: isActive ? tab.color : 'var(--bg-surface)',
                color: isActive ? 'white' : 'var(--text-primary)',
                border: `1.5px solid ${isActive ? tab.color : (isDone ? 'var(--primary)' : 'var(--glass-border)')}`,
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: isActive ? `0 6px 18px ${tab.color}40` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : `${tab.color}15`,
                  color: isActive ? 'white' : tab.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>

                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFortress(tab.id);
                  }}
                  title={isDone ? (isRTL ? 'تم الإنجاز (اضغط للإلغاء)' : 'Completed') : (isRTL ? 'اضغط لتوثيق الإنجاز' : 'Mark Complete')}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDone ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                    border: `1.5px solid ${isDone ? '#10B981' : (isActive ? 'white' : 'var(--glass-border)')}`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isDone && <Check size={14} strokeWidth={3} />}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', display: 'block' }}>
                  {tab.title}
                </span>
                <span style={{ fontSize: '11.5px', opacity: 0.85 }}>
                  🎯 {tab.target}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 🛠️ ACTIVE FORTRESS WORKSTATION DETAILS */}
      
      {/* 🔵 WORKSTATION 1: الحصن الأول - قراءة الختمة والاستماع بالحدر */}
      {activeFortressTab === 1 && (
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1.5px solid #3B82F6',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.12)', padding: '3px 10px', borderRadius: '8px' }}>
                  {isRTL ? 'الحصن الأول: الختمة الشهرية والذاكرة البصرية' : 'Fortress 1: Monthly Khatmah & Visual Retention'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⏱️ {isRTL ? 'الوقت المقترح: ٢٠ - ٣٠ دقيقة' : 'Estimated Time: 20-30 min'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {isRTL ? `قراءة الجزء ${fort1Juz} كاملاً نظراً بالحدر والتعهد` : `Continuous Reading of Juz ${fort1Juz}`}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isRTL 
                  ? `قراءة الجزء ${fort1Juz} (الصفحات من ${fort1Range.startPage} إلى ${fort1Range.endPage}) نظراً من مصحفك الخاص لتثبيت صورة الصفحات في الذاكرة البصرية وإتمام ختمة كاملة كل شهر.`
                  : `Read the entire Juz ${fort1Juz} (Pages ${fort1Range.startPage} to ${fort1Range.endPage}) with fluent Hadr speed to complete a monthly Khatmah.`}
              </p>
            </div>

            <button
              onClick={() => handleToggleFortress(1)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: completion[1] ? '#10B981' : '#3B82F6',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)'
              }}
            >
              {completion[1] ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>{completion[1] ? (isRTL ? 'تم إنجاز الحصن الأول ✓ (+60 XP)' : 'Fortress 1 Completed ✓') : (isRTL ? 'توثيق قراءة الورد (+60 XP)' : 'Mark Fortress 1 Done')}</span>
            </button>
          </div>

          {/* Hadr Speed Player Box */}
          <div style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={22} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                  {isRTL ? 'الاستماع لصوت قارئ متقن (حدر سريع ⚡)' : 'Listen to authentic Qari (Hadr speed)'}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {isRTL ? 'الشيخ محمود خليل الحصري • مصحف الحدر' : 'Sheikh Al-Husary • Hadr Recitation'}
                </span>
              </div>
            </div>

            {/* Audio Speed Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isRTL ? 'السرعة:' : 'Speed:'}</span>
              {[1.0, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: audioSpeed === spd ? '#3B82F6' : 'var(--bg-surface)',
                    color: audioSpeed === spd ? 'white' : 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {spd}x
                </button>
              ))}

              <button
                onClick={handleToggleAudio}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isPlayingAudio ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlayingAudio ? (isRTL ? 'إيقاف' : 'Pause') : (isRTL ? 'استمع الآن' : 'Listen')}</span>
              </button>

              <audio ref={audioRef} src={getAudioSource()} onEnded={() => setIsPlayingAudio(false)} />
            </div>
          </div>

          {/* Golden Methodology Rule */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px dashed rgba(59, 130, 246, 0.4)',
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            lineHeight: 1.6
          }}>
            💡 <strong>{isRTL ? 'القاعدة الذهبية للحصن الأول:' : 'Golden Rule for Fortress 1:'}</strong>{' '}
            {isRTL 
              ? '«لا يمرّ عليك يوم دون قراءة جزء نظراً. واحرص على القراءة من مصحف واحد ذي طبعة واحدة طوال رحلتك لترتسم أماكن الآيات وبدايات الصفحات في مخيلتك كالصورة الفوتوغرافية.»'
              : 'Never let a day pass without reading your continuous Hadr portion from a single physical Mushaf edition.'}
          </div>
        </div>
      )}

      {/* 🟣 WORKSTATION 2: الحصن الثاني - التحضير الثلاثي (أسبوعي، ليلي، قبلي) */}
      {activeFortressTab === 2 && (
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1.5px solid #8B5CF6',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.12)', padding: '3px 10px', borderRadius: '8px' }}>
                  {isRTL ? 'الحصن الثاني: التحضير يختصر 70% من وقت الحفظ' : 'Fortress 2: Triple Preparation (70% Time Saver)'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⏱️ {isRTL ? 'الوقت: ١٥ - ٢٠ دقيقة' : 'Time: 15-20 min'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {isRTL ? `التحضير لصفحة اليوم (${currentPage}) وصفحة الغد (${nextPage})` : `Preparation for Today (P. ${currentPage}) & Tomorrow (P. ${nextPage})`}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isRTL 
                  ? 'تهيئة الدماغ والأحبال الصوتية واستيعاب معاني الآيات قبل جلسة الحفظ الفعلية لضمان حفظ سلس دون تعثر.'
                  : 'Prepares vocal cords and cognition before memorizing, removing pronunciation barriers.'}
              </p>
            </div>

            <button
              onClick={() => handleToggleFortress(2)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: completion[2] ? '#10B981' : '#8B5CF6',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)'
              }}
            >
              {completion[2] ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>{completion[2] ? (isRTL ? 'تم إنجاز التحضير ✓ (+60 XP)' : 'Preparation Done ✓') : (isRTL ? 'توثيق التحضير (+60 XP)' : 'Mark Prep Done')}</span>
            </button>
          </div>

          {/* 3 Pillars of Preparation Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            
            {/* 1. Weekly Prep */}
            <div style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📅</span>
                <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
                  {isRTL ? '١. التحضير الأسبوعي (يوم الجمعة)' : '1. Weekly Context Prep'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isRTL 
                  ? `الاستماع لكامل سورة ${currentSurah} أو الجزء ${currentJuz} مرة واحدة من قارئ مجود لتشكيل خريطة ذهنية للسياق.`
                  : `Listen to all of Surah ${currentSurah} to form an overarching mental outline.`}
              </p>
            </div>

            {/* 2. Night Prep */}
            <div style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌙</span>
                <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
                  {isRTL ? '٢. التحضير الليلي لصفحة الغد' : '2. Night Prep for Tomorrow'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isRTL 
                  ? `تلاوة صفحة الغد (صفحة ${nextPage} - سورة ${nextSurah}) 15 مرة نظراً بصوت مسموع قبل النوم مباشرة لترسيخها في العقل الباطن أثناء النوم.`
                  : `Read tomorrow's page (${nextPage}) 15 times aloud right before sleep to let subconscious consolidate it.`}
              </p>
            </div>

            {/* 3. Close Prep */}
            <div style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>☀️</span>
                <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
                  {isRTL ? '٣. التحضير القبلي (قبل الحفظ بـ 15 دقيقة)' : '3. Immediate Pre-Prep'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isRTL 
                  ? `قراءة صفحة اليوم (صفحة ${currentPage}) 15 دقيقة قبل الحفظ والاطلاع على معاني غريب الألفاظ وتفسير الآيات.`
                  : `Preview page ${currentPage} 15 minutes before memorizing, reviewing vocabulary and brief tafseer.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 WORKSTATION 3: الحصن الثالث - الحفظ الجديد ومعمل التكرار 20x / 40x */}
      {activeFortressTab === 3 && (
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1.5px solid #10B981',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '3px 10px', borderRadius: '8px' }}>
                  {isRTL ? 'الحصن الثالث: الحفظ الجديد المتين' : 'Fortress 3: Robust New Memorization'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⏱️ {isRTL ? 'الوقت: ٣٠ - ٤٥ دقيقة' : 'Time: 30-45 min'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {isRTL ? `حفظ الصفحة ${fort3Page} من سورة ${fort3Surah}` : `Memorizing Page ${fort3Page} (Surah ${fort3Surah})`}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isRTL 
                  ? 'منهجية التكرار المتصل: تكرار كل آية 20 مرة غيباً، ثم ربط الآيات، ثم تكرار كامل الصفحة 40 مرة لتستقر في الذاكرة كالفاتحة.'
                  : 'The continuous repetition method: 20x per verse, 10x link, and 40x whole page recitation.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {onNavigateToVoiceRecitation && (
                <button
                  onClick={() => onNavigateToVoiceRecitation(fort3Page)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Mic size={16} />
                  <span>{isRTL ? 'التسميع الصوتي الذكي 🎙️' : 'Voice AI Recitation 🎙️'}</span>
                </button>
              )}

              <button
                onClick={() => handleToggleFortress(3)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: completion[3] ? '#10B981' : 'var(--bg-color)',
                  color: completion[3] ? 'white' : 'var(--text-primary)',
                  border: `1.5px solid ${completion[3] ? '#10B981' : 'var(--glass-border)'}`,
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {completion[3] ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span>{completion[3] ? (isRTL ? 'تم الحفظ ✓' : 'Done ✓') : (isRTL ? 'توثيق الحفظ (+60 XP)' : 'Mark Done')}</span>
              </button>
            </div>
          </div>

          {/* 🔢 Interactive Repetition Studio (معمل الـ 20x والـ 40x) */}
          <div style={{
            padding: '24px',
            borderRadius: '18px',
            background: 'var(--bg-color)',
            border: '1.5px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#10B981" />
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  {isRTL ? 'معمل التكرار التفاعلي (التكرار يصنع الرسوخ):' : 'Interactive Repetition Clicker Studio:'}
                </strong>
              </div>

              {/* Step Selectors */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { step: 1, label: isRTL ? 'الآية الأولى (20x)' : 'Verse 1 (20x)', target: 20 },
                  { step: 2, label: isRTL ? 'الآية الثانية (20x)' : 'Verse 2 (20x)', target: 20 },
                  { step: 3, label: isRTL ? 'ربط الآيتين (10x)' : 'Link Both (10x)', target: 10 },
                  { step: 4, label: isRTL ? 'كامل الصفحة (40x)' : 'Whole Page (40x)', target: 40 }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => {
                      setRepStep(s.step);
                      setRepTarget(s.target);
                      setRepCounter(0);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: repStep === s.step ? '#10B981' : 'var(--bg-surface)',
                      color: repStep === s.step ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clicker Counter Display & Big Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              padding: '16px 0'
            }}>
              {/* Progress Ring / Counter */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>
                  {repCounter}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {isRTL ? `من أصل ${repTarget} تكراراً مستهدفاً` : `of ${repTarget} target reps`}
                </span>
              </div>

              {/* Big Tap / Click Button */}
              <button
                onClick={handleIncrementRep}
                style={{
                  padding: '18px 36px',
                  borderRadius: '20px',
                  background: repCounter >= repTarget ? '#059669' : '#10B981',
                  color: 'white',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  transform: 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>{isRTL ? 'اضغط مع كل تكرار (أو انقر هنا) 👆' : 'Tap for each repetition 👆'}</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '4px 10px', borderRadius: '10px', fontSize: '14px' }}>
                  +1
                </span>
              </button>

              {/* Reset */}
              <button
                onClick={() => setRepCounter(0)}
                title={isRTL ? 'إعادة تصفير العداد' : 'Reset counter'}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 WORKSTATION 4: الحصن الرابع - المراجعة القريبة (آخر 20 صفحة) */}
      {activeFortressTab === 4 && (
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1.5px solid #EC4899',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#EC4899', background: 'rgba(236, 72, 153, 0.12)', padding: '3px 10px', borderRadius: '8px' }}>
                  {isRTL ? 'الحصن الرابع: حماية المحفوظ الجديد من التفلت' : 'Fortress 4: Near Review (Shielding the New Memorization)'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⏱️ {isRTL ? 'الوقت: ٢٠ - ٢٥ دقيقة' : 'Time: 20-25 min'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {fort4TotalPages > 0 
                  ? (isRTL ? `مراجعة الصفحات من ${fort4Start} إلى ${fort4End} (${fort4TotalPages} صفحة)` : `Reviewing Pages ${fort4Start} to ${fort4End} (${fort4TotalPages} pages)`)
                  : (isRTL ? 'المراجعة القريبة تبدأ تلقائياً بعد حفظ الصفحة الأولى' : 'Near Review activates after first page')}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isRTL 
                  ? 'المحفوظ الجديد في أول 30 يوماً يكون كالنبتة الغضة؛ تكرار آخر 20 صفحة يومياً ينقله من الذاكرة قصيرة المدى إلى الذاكرة الدائمة المستقرة.'
                  : 'Daily cycling of the last 20 memorized pages to solidify short-term memory into permanent recall.'}
              </p>
            </div>

            <button
              onClick={() => handleToggleFortress(4)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: completion[4] ? '#10B981' : '#EC4899',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.25)'
              }}
            >
              {completion[4] ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>{completion[4] ? (isRTL ? 'تمت المراجعة القريبة ✓' : 'Near Review Done ✓') : (isRTL ? 'توثيق المراجعة (+60 XP)' : 'Mark Near Done')}</span>
            </button>
          </div>

          {/* Visual Mini Page Thumbnails for the 20 Near Pages */}
          {fort4TotalPages > 0 ? (
            <div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                {isRTL ? 'قائمة صفحات الماضي القريب المستهدفة اليوم:' : 'Target Near Past Pages:'}
              </span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
                gap: '8px'
              }}>
                {Array.from({ length: fort4TotalPages }, (_, i) => fort4Start + i).map(p => (
                  <div
                    key={p}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--glass-border)',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{isRTL ? `ص ${p}` : `P. ${p}`}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{getSurahNameForPage(p)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '13px' }}>
              {isRTL ? 'عند حفظك لأول صفحة، ستظهر هنا الصفحات الأخيرة المخصصة للتثبيت اليومي.' : 'Pages will populate here as you memorize.'}
            </div>
          )}
        </div>
      )}

      {/* 🟡 WORKSTATION 5: الحصن الخامس - المراجعة البعيدة وجدول الصلوات */}
      {activeFortressTab === 5 && (
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1.5px solid #F59E0B',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 10px', borderRadius: '8px' }}>
                  {isRTL ? 'الحصن الخامس: معاهدة المحفوظ القديم والصلاة به' : 'Fortress 5: Distant Review & Prayer Integration'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⏱️ {isRTL ? 'الوقت: ٢٠ - ٣٠ دقيقة' : 'Time: 20-30 min'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {pastAjzaaCount > 0 
                  ? (isRTL ? `مراجعة قديم المحفوظ (الأجزاء من ١ إلى ${pastAjzaaCount}) • ورد اليوم: الجزء ${todayDistantJuz}` : `Distant Review (Juz 1 to ${pastAjzaaCount}) • Today: Juz ${todayDistantJuz}`)
                  : (isRTL ? 'ينشط الحصن الخامس بعد إتمامك للجزء الأول' : 'Activates after completing Juz 1')}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isRTL 
                  ? 'تدوير كافة الأجزاء التي أتممتها مسبقاً وتلاوتها في ركعات السنن الرواتب وقيام الليل لضمان عدم نسيان أي سورة إطلاقاً.'
                  : 'Cycles all previously completed Ajzaa and recites them in Sunnah & Qiyam prayers.'}
              </p>
            </div>

            <button
              onClick={() => handleToggleFortress(5)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: completion[5] ? '#10B981' : '#F59E0B',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)'
              }}
            >
              {completion[5] ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>{completion[5] ? (isRTL ? 'تمت المراجعة البعيدة ✓' : 'Distant Review Done ✓') : (isRTL ? 'توثيق المراجعة (+60 XP)' : 'Mark Far Done')}</span>
            </button>
          </div>

          {/* 🕌 Prayer Integration Distribution Table */}
          <div style={{
            padding: '18px',
            borderRadius: '16px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🕌</span>
              <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
                {isRTL ? 'جدول توزيع المراجعة البعيدة على صلوات اليوم:' : 'Daily Prayer Integration Distribution:'}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{isRTL ? '🌅 سنة الفجر والضحى:' : '🌅 Fajr & Duha Sunnah:'}</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{isRTL ? 'صفحتان من المحفوظ القديم' : '2 pages of old review'}</strong>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{isRTL ? '☀️ رواتب الظهر والمغرب:' : '☀️ Dhuhr & Maghrib Sunnah:'}</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{isRTL ? '٤ صفحات من المحفوظ القديم' : '4 pages of old review'}</strong>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{isRTL ? '🌌 قيام الليل والشفع والوتر:' : '🌌 Qiyam & Witr:'}</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{isRTL ? '٦ إلى ٨ صفحات بخشوع' : '6 to 8 pages with khushoo'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
