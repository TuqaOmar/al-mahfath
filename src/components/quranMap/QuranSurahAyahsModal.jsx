import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  Mic, 
  Square, 
  BookOpen, 
  Play, 
  Pause, 
  Flame, 
  Award, 
  Clock, 
  FileText, 
  Check, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useRecitationRecorder } from '../../hooks/useRecitationRecorder';
import { makeAyahKey } from '../../lib/portfolioService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const QuranSurahAyahsModal = ({ 
  surah, 
  portfolio, 
  onUpdateAyah, 
  onBulkUpdateSurah, 
  onClose 
}) => {
  const { user, updateUserData } = useAuth();
  const { notifyAndCelebrate } = useNotifications();

  const [ayahsList, setAyahsList] = useState([]);
  const [loadingAyahs, setLoadingAyahs] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, memorized, learning, review, unmemorized
  const [activeAyahTafsir, setActiveAyahTafsir] = useState(null); // ayah number
  const [tafsirContent, setTafsirContent] = useState({}); // { [globalNum]: text }
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  
  // Audio playback
  const [playingAyahNum, setPlayingAyahNum] = useState(null);
  const audioRef = useRef(null);

  // Notes editing state
  const [editingNotesAyah, setEditingNotesAyah] = useState(null);
  const [tempNote, setTempNote] = useState('');

  // AI Recitation state per ayah
  const [recitingAyah, setRecitingAyah] = useState(null); // ayah object
  const {
    isRecording: isAiRecording,
    isAnalyzing: isAiAnalyzing,
    duration: aiDuration,
    error: aiMicError,
    analysisResult: aiAnalysisResult,
    startRecording: startAiRecording,
    stopAndAnalyze: stopAiAndAnalyze,
    cancelRecording: cancelAiRecording,
    clearResult: clearAiResult
  } = useRecitationRecorder();

  // Load Ayahs of this Surah from Al-Quran Cloud
  useEffect(() => {
    let isMounted = true;
    setLoadingAyahs(true);

    fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/quran-uthmani`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.code === 200 && data.data?.ayahs) {
          setAyahsList(data.data.ayahs);
        }
      })
      .catch(err => {
        console.error('Error fetching surah ayahs:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingAyahs(false);
      });

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [surah.number]);

  // Handle Play/Pause Audio for an Ayah
  const togglePlayAyah = (ayah) => {
    if (playingAyahNum === ayah.number) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAyahNum(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Authentic Sheikh Alafasy audio URL by global Ayah number
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;
    const newAudio = new Audio(audioUrl);
    audioRef.current = newAudio;
    setPlayingAyahNum(ayah.number);

    newAudio.play().catch(e => {
      console.warn('Audio play prevented:', e);
      setPlayingAyahNum(null);
    });

    newAudio.onended = () => {
      setPlayingAyahNum(null);
    };
  };

  // Fetch Tafsir for an Ayah
  const toggleTafsir = async (ayah) => {
    if (activeAyahTafsir === ayah.numberInSurah) {
      setActiveAyahTafsir(null);
      return;
    }

    setActiveAyahTafsir(ayah.numberInSurah);
    if (!tafsirContent[ayah.number]) {
      setLoadingTafsir(true);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/ar.muyassar`);
        const data = await res.json();
        if (data.code === 200 && data.data?.text) {
          setTafsirContent(prev => ({ ...prev, [ayah.number]: data.data.text }));
        }
      } catch (e) {
        console.error('Failed to load tafsir:', e);
      } finally {
        setLoadingTafsir(false);
      }
    }
  };

  // Start AI Recitation for an Ayah
  const handleStartRecitation = async (ayah) => {
    if (playingAyahNum) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAyahNum(null);
    }
    setRecitingAyah(ayah);
    clearAiResult();
    await startAiRecording();
  };

  // Stop AI Recitation and evaluate
  const handleStopRecitation = async (ayah) => {
    if (!ayah) return;
    const res = await stopAiAndAnalyze(ayah.text);
    if (res) {
      const accuracy = Number(res.accuracy) || 0;
      let newStatus = accuracy >= 85 ? 'memorized' : (accuracy >= 65 ? 'learning' : 'review');
      
      // Update in personal portfolio
      onUpdateAyah(surah.number, ayah.numberInSurah, {
        status: newStatus,
        recitationScore: accuracy,
        repetitionCount: (portfolio[makeAyahKey(surah.number, ayah.numberInSurah)]?.repetitionCount || 0) + 1,
        lastReviewed: 'اليوم'
      });

      if (accuracy >= 85) {
        notifyAndCelebrate({
          title: `إتقان ممتاز للآية ${ayah.numberInSurah}! 🟢`,
          message: `ما شاء الله! حققت نسبة إتقان ${accuracy}% في تلاوة سورة ${surah.cleanName} الآية ${ayah.numberInSurah}.`,
          type: 'achievement',
          xpBonus: 30,
          badgeTitle: 'تسميع ذكي'
        });
      }
    }
  };

  // Change Ayah Status directly
  const handleChangeStatus = (ayahNumInSurah, newStatus) => {
    const key = makeAyahKey(surah.number, ayahNumInSurah);
    const existing = portfolio[key] || {};
    
    let defaultScore = 0;
    if (newStatus === 'memorized') defaultScore = 95;
    else if (newStatus === 'learning') defaultScore = 70;
    else if (newStatus === 'review') defaultScore = 55;

    onUpdateAyah(surah.number, ayahNumInSurah, {
      status: newStatus,
      recitationScore: existing.recitationScore || defaultScore,
      lastReviewed: newStatus !== 'unmemorized' ? 'اليوم' : 'لم يراجع',
      repetitionCount: existing.repetitionCount || (newStatus === 'memorized' ? 40 : (newStatus === 'learning' ? 20 : 0))
    });

    if (newStatus === 'memorized' && existing.status !== 'memorized') {
      notifyAndCelebrate({
        title: `تم حفظ الآية ${ayahNumInSurah} من سورة ${surah.cleanName}! 🎉`,
        message: 'تم تحديث محفظتك الشخصية ومستوى إتقانك للقرآن بنجاح.',
        type: 'achievement',
        xpBonus: 15
      });
    }
  };

  // Change repetition count (+1, +5, -1)
  const handleAdjustRepetition = (ayahNumInSurah, delta) => {
    const key = makeAyahKey(surah.number, ayahNumInSurah);
    const existing = portfolio[key] || {};
    const currentRep = Number(existing.repetitionCount) || 0;
    const nextRep = Math.max(0, currentRep + delta);

    let status = existing.status || 'learning';
    if (nextRep >= 40 && status !== 'memorized') {
      status = 'memorized';
    } else if (nextRep > 0 && (!status || status === 'unmemorized')) {
      status = 'learning';
    }

    onUpdateAyah(surah.number, ayahNumInSurah, {
      repetitionCount: nextRep,
      status,
      lastReviewed: 'اليوم'
    });
  };

  // Save Note
  const handleSaveNote = (ayahNumInSurah) => {
    onUpdateAyah(surah.number, ayahNumInSurah, {
      notes: tempNote
    });
    setEditingNotesAyah(null);
    setTempNote('');
  };

  // Bulk complete full Surah
  const handleMarkSurahComplete = () => {
    const ayahsData = [];
    for (let a = 1; a <= surah.numberOfAyahs; a++) {
      ayahsData.push({
        ayahNumber: a,
        status: 'memorized',
        recitationScore: 98,
        repetitionCount: 40,
        lastReviewed: 'اليوم'
      });
    }
    onBulkUpdateSurah(surah.number, ayahsData);
    notifyAndCelebrate({
      title: `🎉 هنيئاً لك إتمام سورة ${surah.cleanName}!`,
      message: `تم تثبيت كامل سورة ${surah.cleanName} (${surah.numberOfAyahs} آية) في محفظتك الشخصية بنجاح!`,
      type: 'achievement',
      xpBonus: 150,
      badgeTitle: `حافظ سورة ${surah.cleanName}`
    });
  };

  // Calculate current Surah memorization stats from portfolio
  let memorizedAyahsCount = 0;
  let learningAyahsCount = 0;
  let reviewAyahsCount = 0;

  for (let a = 1; a <= surah.numberOfAyahs; a++) {
    const st = portfolio[makeAyahKey(surah.number, a)]?.status;
    if (st === 'memorized') memorizedAyahsCount++;
    else if (st === 'learning') learningAyahsCount++;
    else if (st === 'review') reviewAyahsCount++;
  }

  const completionPercent = Math.round((memorizedAyahsCount / surah.numberOfAyahs) * 100);

  // Filter ayahs for display
  const displayedAyahs = ayahsList.filter(a => {
    const key = makeAyahKey(surah.number, a.numberInSurah);
    const itemStatus = portfolio[key]?.status || 'unmemorized';
    if (filterStatus === 'all') return true;
    return itemStatus === filterStatus;
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      direction: 'rtl'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                {surah.number}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    سورة {surah.cleanName}
                  </h2>
                  <span style={{
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: surah.revelationType === 'مكية' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: surah.revelationType === 'مكية' ? '#3B82F6' : '#10B981',
                    fontWeight: 600
                  }}>
                    {surah.revelationType}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    الجزء {surah.juz} • الصفحة {surah.startPage}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  إجمالي الآيات: {surah.numberOfAyahs} آية • المحفظة الشخصية: {memorizedAyahsCount} آية متقنة ({completionPercent}%)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>مستوى الإتقان في المحفظة:</span>
                <strong style={{ color: completionPercent === 100 ? '#10B981' : 'var(--primary)' }}>
                  {completionPercent}% ({memorizedAyahsCount}/{surah.numberOfAyahs} آية)
                </strong>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--bg-color)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <div style={{
                  width: `${completionPercent}%`,
                  height: '100%',
                  background: completionPercent === 100 ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #F59E0B, #10B981)',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <button
              onClick={handleMarkSurahComplete}
              style={{
                padding: '9px 16px',
                borderRadius: '12px',
                background: completionPercent === 100 ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary)',
                color: completionPercent === 100 ? 'var(--primary)' : 'white',
                border: '1px solid var(--primary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={16} />
              {completionPercent === 100 ? 'السورة مكتملة بالكامل ✨' : 'تحديد كامل السورة كمحفوظة (100%)'}
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: `الكل (${surah.numberOfAyahs})` },
              { id: 'memorized', label: `🟢 متقنة (${memorizedAyahsCount})` },
              { id: 'learning', label: `🟡 قيد الحفظ (${learningAyahsCount})` },
              { id: 'review', label: `🔴 مراجعة (${reviewAyahsCount})` },
              { id: 'unmemorized', label: `⚪ غير محفوظة (${surah.numberOfAyahs - memorizedAyahsCount - learningAyahsCount - reviewAyahsCount})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${filterStatus === f.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: filterStatus === f.id ? 'var(--primary-light)' : 'var(--bg-color)',
                  color: filterStatus === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Recitation Active Floating Banner */}
        {recitingAyah && (
          <div style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#EF4444',
                animation: 'pulse 1s infinite'
              }} />
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>
                  {isAiAnalyzing ? 'جاري التحليل الصوتي الذكي للآية...' : `جاري الاستماع للآية ${recitingAyah.numberInSurah} (${aiDuration} ثانية)`}
                </strong>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>
                  اقرأ الآية بوضوح وحدر لتسجيل نسبة الدقة والإتقان في محفظتك الشخصية
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {isAiRecording && (
                <button
                  onClick={() => handleStopRecitation(recitingAyah)}
                  disabled={isAiAnalyzing}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#10B981',
                    border: 'none',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Square size={14} /> إنهاء والتحليل
                </button>
              )}

              <button
                onClick={() => {
                  cancelAiRecording();
                  setRecitingAyah(null);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* AI Recitation Analysis & Exact Mistakes Result Card */}
        {aiAnalysisResult && (
          <div style={{
            margin: '16px 20px',
            padding: '20px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: `1.5px solid ${aiAnalysisResult.accuracy >= 85 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(220, 38, 38, 0.4)'}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: aiAnalysisResult.accuracy >= 90 ? '#10B981' : (aiAnalysisResult.accuracy >= 75 ? '#F59E0B' : '#EF4444'),
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}>
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{aiAnalysisResult.accuracy}%</span>
                  <span style={{ fontSize: '9px', opacity: 0.9 }}>الدقة</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {aiAnalysisResult.ratingIcon || '🎯'} {aiAnalysisResult.rating || 'نتيجة التسميع الذكي'}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    تم تقييم التلاوة ومطابقتها مع رسم المصحف الشريف وحفظ النتيجة في محفظتك 💾
                  </span>
                </div>
              </div>
              <button
                onClick={clearAiResult}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                title="إغلاق التقرير"
              >
                <X size={20} />
              </button>
            </div>

            {/* Exact Mistakes Section */}
            {aiAnalysisResult.mistakes && aiAnalysisResult.mistakes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '13px', fontWeight: 800 }}>
                  <AlertCircle size={16} />
                  <span>مواضع الأخطاء والتصويب بالتحديد ({aiAnalysisResult.mistakes.length} موضع):</span>
                </div>

                {aiAnalysisResult.mistakes.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-color)',
                      border: '1px solid rgba(220, 38, 38, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        خطأ {mIdx + 1}: {m.typeLabel || 'تنبيه'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                        <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: 'bold' }}>❌ ما نطقته أنت:</div>
                        <div style={{ fontSize: '16px', fontFamily: 'serif', fontWeight: 700, color: '#B91C1C' }}>
                          {m.spoken ? `« ${m.spoken} »` : '« لم تُنطق (نسيان) »'}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--primary-light)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--primary, #10B981)', fontWeight: 'bold' }}>✅ الصواب في القرآن:</div>
                        <div style={{ fontSize: '16px', fontFamily: 'serif', fontWeight: 800, color: 'var(--primary, #10B981)' }}>
                          « {m.expected} »
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '6px' }}>
                      💡 {m.message}
                      {m.correctionTip && <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>🎯 {m.correctionTip}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                borderRight: '4px solid var(--primary, #10B981)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} style={{ color: 'var(--primary, #10B981)' }} />
                <span>ما شاء الله! تلاوة خالية من أي أخطاء أو لحن جلي. الآية مثبتة بإتقان تام.</span>
              </div>
            )}

            {aiAnalysisResult.transcribedText && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                ما التقطه الميكروفون: <span style={{ color: 'var(--primary)' }}>"{aiAnalysisResult.transcribedText}"</span>
              </div>
            )}
          </div>
        )}

        {/* Ayahs Scrollable List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loadingAyahs ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>جاري تحميل آيات سورة {surah.cleanName} برسم المصحف العثماني...</p>
            </div>
          ) : displayedAyahs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>لا توجد آيات مطابقة لهذا التصنيف.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Basmalah for surahs other than Al-Fatiha and At-Tawbah */}
              {surah.number !== 1 && surah.number !== 9 && filterStatus === 'all' && (
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  fontFamily: 'serif',
                  fontSize: '22px',
                  color: 'var(--primary)',
                  borderBottom: '1px dashed var(--glass-border)'
                }}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
              )}

              {displayedAyahs.map((ayah) => {
                const ayahKey = makeAyahKey(surah.number, ayah.numberInSurah);
                const portfolioItem = portfolio[ayahKey] || {};
                const status = portfolioItem.status || 'unmemorized';
                const score = portfolioItem.recitationScore || 0;
                const reps = portfolioItem.repetitionCount || 0;
                const isPlayingThis = playingAyahNum === ayah.number;
                const isTafsirOpen = activeAyahTafsir === ayah.numberInSurah;
                const hasNotes = Boolean(portfolioItem.notes);

                // Determine border and color based on personal portfolio status
                let statusBadgeBg = 'rgba(148, 163, 184, 0.15)';
                let statusBadgeColor = '#94A3B8';
                let statusBadgeLabel = '⚪ غير محفوظة';

                if (status === 'memorized') {
                  statusBadgeBg = 'rgba(16, 185, 129, 0.15)';
                  statusBadgeColor = '#10B981';
                  statusBadgeLabel = '🟢 متقنة (100%)';
                } else if (status === 'learning') {
                  statusBadgeBg = 'rgba(245, 158, 11, 0.15)';
                  statusBadgeColor = '#F59E0B';
                  statusBadgeLabel = '🟡 قيد الحفظ والتكرار';
                } else if (status === 'review') {
                  statusBadgeBg = 'rgba(239, 68, 68, 0.15)';
                  statusBadgeColor = '#EF4444';
                  statusBadgeLabel = '🔴 بحاجة لمراجعة';
                }

                return (
                  <div
                    key={ayah.number}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '16px',
                      background: 'var(--bg-color)',
                      border: `1px solid ${status === 'memorized' ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-border)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'border 0.2s ease'
                    }}
                  >
                    {/* Top Row: Ayah Number, Portfolio Status Chip, Repetition Tracker */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Islamic Ayah Medallion */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          border: '1px solid var(--primary)'
                        }}>
                          {ayah.numberInSurah}
                        </div>

                        {/* Status Chip */}
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: statusBadgeBg,
                          color: statusBadgeColor,
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {statusBadgeLabel}
                        </span>

                        {score > 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            إتقان التسميع: <strong style={{ color: statusBadgeColor }}>{score}%</strong>
                          </span>
                        )}
                      </div>

                      {/* Repetition Counter (Fortress Method 20x / 40x) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          تكرار الحفظ:
                        </span>
                        <strong style={{ fontSize: '13px', color: reps >= 40 ? '#10B981' : (reps >= 20 ? '#F59E0B' : 'var(--text-primary)') }}>
                          {reps}/40x
                        </strong>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleAdjustRepetition(ayah.numberInSurah, 1)}
                            title="إضافة تكرار واحد (+1)"
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'var(--primary-light)',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            +1
                          </button>

                          <button
                            onClick={() => handleAdjustRepetition(ayah.numberInSurah, 5)}
                            title="إضافة 5 تكرارات (+5)"
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'var(--primary-light)',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            +5
                          </button>

                          {reps > 0 && (
                            <button
                              onClick={() => handleAdjustRepetition(ayah.numberInSurah, -1)}
                              title="تقليل تكرار (-1)"
                              style={{
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              -1
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ayah Text in Uthmani Calligraphy */}
                    <div style={{
                      fontSize: '20px',
                      lineHeight: '2.2',
                      fontFamily: 'serif',
                      color: 'var(--text-primary)',
                      textAlign: 'justify',
                      padding: '4px 0'
                    }}>
                      {ayah.text}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        margin: '0 6px',
                        verticalAlign: 'middle'
                      }}>
                        {ayah.numberInSurah}
                      </span>
                    </div>

                    {/* Tafsir Expandable Section */}
                    {isTafsirOpen && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'var(--primary-light)',
                        border: '1px solid var(--primary)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--primary)', fontWeight: 'bold' }}>
                          <BookOpen size={14} /> التفسير الميسر:
                        </div>
                        {loadingTafsir && !tafsirContent[ayah.number] ? (
                          <span>جاري تحميل التفسير...</span>
                        ) : (
                          <span>{tafsirContent[ayah.number] || 'لم يتم العثور على تفسير.'}</span>
                        )}
                      </div>
                    )}

                    {/* Notes Section */}
                    {editingNotesAyah === ayah.numberInSurah ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="اكتب ملاحظة أو وقفة تدبرية لهذه الآية في محفظتك..."
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--primary)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                          }}
                        />
                        <button
                          onClick={() => handleSaveNote(ayah.numberInSurah)}
                          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingNotesAyah(null)}
                          style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      hasNotes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          📝 <strong>ملاحظتك في المحفظة:</strong> {portfolioItem.notes}
                        </div>
                      )
                    )}

                    {/* Bottom Controls Row: Status Switcher, Audio, AI Recitation, Tafsir, Note */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      paddingTop: '8px',
                      borderTop: '1px dashed var(--glass-border)'
                    }}>
                      {/* Status Selector Buttons */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleChangeStatus(ayah.numberInSurah, 'memorized')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: status === 'memorized' ? '1px solid #10B981' : '1px solid var(--glass-border)',
                            background: status === 'memorized' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface)',
                            color: status === 'memorized' ? '#10B981' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          🟢 متقنة
                        </button>

                        <button
                          onClick={() => handleChangeStatus(ayah.numberInSurah, 'learning')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: status === 'learning' ? '1px solid #F59E0B' : '1px solid var(--glass-border)',
                            background: status === 'learning' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-surface)',
                            color: status === 'learning' ? '#F59E0B' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          🟡 قيد الحفظ
                        </button>

                        <button
                          onClick={() => handleChangeStatus(ayah.numberInSurah, 'review')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: status === 'review' ? '1px solid #EF4444' : '1px solid var(--glass-border)',
                            background: status === 'review' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)',
                            color: status === 'review' ? '#EF4444' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          🔴 مراجعة
                        </button>

                        <button
                          onClick={() => handleChangeStatus(ayah.numberInSurah, 'unmemorized')}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: status === 'unmemorized' ? 'rgba(148, 163, 184, 0.2)' : 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          ⚪ مسح
                        </button>
                      </div>

                      {/* Interactive Action Icons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Audio Listen */}
                        <button
                          onClick={() => togglePlayAyah(ayah)}
                          title={isPlayingThis ? 'إيقاف التلاوة' : 'استماع لتلاوة الشيخ العفاسي'}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isPlayingThis ? 'var(--primary)' : 'var(--bg-surface)',
                            color: isPlayingThis ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isPlayingThis ? <Pause size={14} /> : <Volume2 size={14} />}
                          <span style={{ fontSize: '11px' }}>{isPlayingThis ? 'إيقاف' : 'استماع'}</span>
                        </button>

                        {/* AI Recitation */}
                        <button
                          onClick={() => handleStartRecitation(ayah)}
                          title="تسميع صوتي مباشر بالذكاء الاصطناعي"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                            color: '#3B82F6',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Mic size={14} />
                          <span style={{ fontSize: '11px' }}>تسميع ذكي 🎙️</span>
                        </button>

                        {/* Tafsir Button */}
                        <button
                          onClick={() => toggleTafsir(ayah)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isTafsirOpen ? 'var(--primary-light)' : 'var(--bg-surface)',
                            color: isTafsirOpen ? 'var(--primary)' : 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <BookOpen size={13} />
                          <span>التفسير</span>
                        </button>

                        {/* Add / Edit Note */}
                        <button
                          onClick={() => {
                            setEditingNotesAyah(ayah.numberInSurah);
                            setTempNote(portfolioItem.notes || '');
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText size={13} />
                          <span>ملاحظة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--glass-border)',
          background: 'var(--bg-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: 'var(--text-primary)' }}>نصيحة الحفظ:</strong> طبق قاعدة التكرار 20 مرة للآية و40 مرة للربط لتثبيت الحفظ في الذاكرة الدائمة.
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: '10px',
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            إغلاق وعودة للخريطة 🗺️
          </button>
        </div>

      </div>
    </div>
  );
};
