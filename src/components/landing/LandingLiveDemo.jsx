import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RotateCcw, 
  Mic, 
  Square,
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  Zap, 
  ArrowLeft,
  ArrowRight,
  Radio,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRecitationRecorder } from '../../hooks/useRecitationRecorder';

const PRESET_VERSES = [
  {
    id: 'fatihah-1-4',
    title: 'سورة الفاتحة (الآيات ١ - ٤)',
    titleEn: 'Al-Fatihah (Verses 1 - 4)',
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ'
  },
  {
    id: 'fatihah-2',
    title: 'الآية ٢ من الفاتحة (الحمد لله رب العالمين)',
    titleEn: 'Al-Fatihah (Verse 2)',
    text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'
  },
  {
    id: 'ikhlas',
    title: 'سورة الإخلاص كاملة',
    titleEn: 'Surah Al-Ikhlas (Full)',
    text: 'قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'
  },
  {
    id: 'kursi',
    title: 'مطلع آية الكرسي',
    titleEn: 'Ayat Al-Kursi (Intro)',
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ'
  }
];

export const LandingLiveDemo = ({ onDemoLogin }) => {
  const { isRTL } = useLanguage();
  const [selectedVerseId, setSelectedVerseId] = useState('fatihah-1-4');
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [demoMode, setDemoMode] = useState('correct'); // 'correct' | 'mistake_demo' | 'live'
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedWordInfo, setSelectedWordInfo] = useState(null);

  const currentVerse = useMemo(() => {
    return PRESET_VERSES.find(v => v.id === selectedVerseId) || PRESET_VERSES[0];
  }, [selectedVerseId]);

  const verseWords = useMemo(() => {
    return currentVerse.text.trim().split(/\s+/);
  }, [currentVerse]);

  const {
    isRecording,
    isAnalyzing,
    duration,
    error: micError,
    analysisResult,
    startRecording,
    stopAndAnalyze,
    cancelRecording,
    clearResult
  } = useRecitationRecorder();

  const handleSimulateRecitation = (mode = 'correct') => {
    clearResult();
    setDemoMode(mode);
    setIsSimulating(true);
    setActiveWordIdx(0);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < verseWords.length) {
        setActiveWordIdx(idx);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 550);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setActiveWordIdx(-1);
    clearResult();
    cancelRecording();
    setSelectedWordInfo(null);
  };

  const handleStartMicRecitation = async () => {
    setIsSimulating(false);
    setActiveWordIdx(-1);
    setDemoMode('live');
    setSelectedWordInfo(null);
    await startRecording();
  };

  const handleStopMicAndAnalyze = async () => {
    await stopAndAnalyze(currentVerse.text);
  };

  // Format recording timer (e.g. 00:04)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section 
      id="live-recitation-demo"
      style={{
        padding: '80px 0',
        background: 'radial-gradient(100% 60% at 50% 50%, var(--primary-light) 0%, var(--bg-surface) 90%)',
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <div className="container">
        
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="badge-modern" style={{ marginBottom: '12px' }}>
            <Zap size={14} />
            <span>{isRTL ? 'محرك التسميع الذكي المتطور (AI Quran Recitation)' : 'Live AI Quran Recitation Engine'}</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            {isRTL ? 'جرّب محرك التسميع الذكي' : 'Try the Smart Recitation Engine'}{' '}
            <span className="text-gradient">{isRTL ? 'الآن بصوتك مباشرة' : 'Live with Your Voice'}</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto'
          }}>
            {isRTL 
              ? 'سجّل تلاوتك الآن بالميكروفون، وسيقوم الذكاء الاصطناعي بتحليل الصوت ومطابقة كل كلمة وتشكيل مع الآيات الكريمة بدقة وفورية.'
              : 'Record your recitation now via microphone. AI transcribes your voice, checks every word and diacritic, and provides instant feedback.'}
          </p>
        </div>

        {/* Live Interactive Board */}
        <div style={{
          maxWidth: '880px',
          margin: '0 auto',
          padding: '28px',
          borderRadius: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--primary-border)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Header Controls: Verse Selection & Primary Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--glass-border)',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Volume2 size={20} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                  {isRTL ? 'اختر النص القرآني للتسميع:' : 'Choose verse to recite:'}
                </label>
                <select
                  value={selectedVerseId}
                  onChange={(e) => {
                    setSelectedVerseId(e.target.value);
                    handleReset();
                  }}
                  disabled={isRecording || isAnalyzing || isSimulating}
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-color)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {PRESET_VERSES.map(v => (
                    <option key={v.id} value={v.id}>
                      {isRTL ? v.title : v.titleEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Live Mic Button */}
              {!isRecording ? (
                <button
                  id="start-live-recitation-btn"
                  onClick={handleStartMicRecitation}
                  disabled={isAnalyzing || isSimulating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: isAnalyzing || isSimulating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Mic size={16} />
                  <span>{isRTL ? 'سجّل تلاوتك الآن (ميكروفون)' : 'Recite with Mic (Live)'}</span>
                </button>
              ) : (
                <button
                  id="stop-live-recitation-btn"
                  onClick={handleStopMicAndAnalyze}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                    animation: 'pulse 1.5s infinite'
                  }}
                >
                  <Square size={15} fill="white" />
                  <span>{isRTL ? `إيقاف وتحليل (${formatTime(duration)})` : `Stop & Analyze (${formatTime(duration)})`}</span>
                </button>
              )}

              {/* Quick 1-Click Simulation Demo */}
              <button
                id="simulate-correct-recitation-btn"
                onClick={() => handleSimulateRecitation('correct')}
                disabled={isRecording || isAnalyzing || isSimulating}
                title={isRTL ? 'تجربة سريعة بدون ميكروفون' : 'Quick demo without mic'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 13px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: isSimulating && demoMode === 'correct' ? 'var(--primary-light)' : 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isRecording || isAnalyzing || isSimulating ? 'not-allowed' : 'pointer'
                }}
              >
                <Play size={13} />
                <span>{isRTL ? 'محاكاة صحيحة' : 'Demo 100%'}</span>
              </button>

              <button
                id="simulate-mistake-recitation-btn"
                onClick={() => handleSimulateRecitation('mistake_demo')}
                disabled={isRecording || isAnalyzing || isSimulating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 13px',
                  borderRadius: '10px',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: 'var(--secondary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isRecording || isAnalyzing || isSimulating ? 'not-allowed' : 'pointer'
                }}
              >
                <AlertCircle size={13} />
                <span>{isRTL ? 'تجربة كشف خطأ ⚠️' : 'Mistake Demo ⚠️'}</span>
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                title={isRTL ? 'إعادة ضبط' : 'Reset'}
                style={{
                  padding: '9px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Microphone Recording Banner / Visualizer */}
          {isRecording && (
            <div style={{
              margin: '20px 0 0 0',
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  boxShadow: '0 0 10px #EF4444',
                  animation: 'pulse 1s infinite'
                }} />
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                    {isRTL ? '🎙️ الميكروفون يستمع لتلاوتك الآن...' : '🎙️ Microphone listening to recitation...'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {isRTL ? 'اتلُ الآية بوضوح وتؤدة، ثم اضغط إيقاف وتحليل عند الانتهاء.' : 'Recite clearly at your own pace, then click stop to analyze.'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '18px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#10B981',
                  background: 'var(--bg-surface)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  {formatTime(duration)}
                </span>
                <button
                  onClick={handleStopMicAndAnalyze}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#10B981',
                    border: 'none',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {isRTL ? 'تم، حلل التلاوة' : 'Done, Analyze'}
                </button>
              </div>
            </div>
          )}

          {/* Analyzing Spinner */}
          {isAnalyzing && (
            <div style={{
              margin: '20px 0 0 0',
              padding: '24px',
              borderRadius: '14px',
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                <Loader2 size={24} className="animate-spin text-emerald-600" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isRTL ? 'جاري استخراج وتحليل الصوت عبر نموذج Whisper القرآني...' : 'Analyzing audio with Quranic Whisper Model...'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isRTL ? 'نقوم الآن بمطابقة مخارج الحروف والكلمات وحركات التشكيل مع المصحف الشريف.' : 'Matching phonemes, words, and diacritics with the Holy Quran.'}
              </p>
            </div>
          )}

          {/* Mic Error Message */}
          {micError && (
            <div style={{
              margin: '20px 0 0 0',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} />
              <span>{micError}</span>
            </div>
          )}

          {/* Live AI Analysis Summary Card (If result present) */}
          {analysisResult && (
            <div style={{
              margin: '20px 0',
              padding: '16px 20px',
              borderRadius: '16px',
              background: analysisResult.accuracy >= 80 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(217, 119, 6, 0.08)',
              border: `1px solid ${analysisResult.accuracy >= 80 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: analysisResult.accuracy >= 80 ? '#10B981' : '#D97706',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{analysisResult.accuracy}%</span>
                  <span style={{ fontSize: '9px', opacity: 0.9 }}>{isRTL ? 'دقة' : 'Acc'}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {analysisResult.accuracy >= 90 
                        ? (isRTL ? 'ما شاء الله! تلاوة متقنة ومطابقة' : 'Excellent recitation accuracy!')
                        : (isRTL ? 'تلاوة مقبولة مع بعض الملاحظات' : 'Recitation recorded with feedback')}
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      Whisper Large v3 Turbo
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {isRTL ? 'ما التقطه المودل:' : 'Transcribed:'}{' '}
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{analysisResult.transcribedText || '—'}"
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary, #10B981)', fontWeight: 700 }}>
                  ✓ {analysisResult.stats?.correctCount || 0} {isRTL ? 'صحيحة' : 'correct'}
                </span>
                {analysisResult.stats?.diacriticCount > 0 && (
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.15)', color: '#D97706', fontWeight: 700 }}>
                    ~ {analysisResult.stats.diacriticCount} {isRTL ? 'تشكيل' : 'diacritic'}
                  </span>
                )}
                {analysisResult.stats?.errorCount > 0 && (
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#DC2626', fontWeight: 700 }}>
                    ✕ {analysisResult.stats.errorCount} {isRTL ? 'خطأ' : 'error'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ayah Text Display with Interactive Word Highlight */}
          <div style={{
            padding: '32px 20px',
            margin: '20px 0',
            borderRadius: '18px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            textAlign: 'center',
            direction: 'rtl'
          }}>
            <div style={{
              fontSize: 'clamp(20px, 3.4vw, 32px)',
              lineHeight: 2.3,
              fontFamily: 'serif',
              fontWeight: 700,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px'
            }}>
              {/* If we have live analysis results, render using analysisResult.results */}
              {analysisResult && analysisResult.results ? (
                analysisResult.results.map((item, idx) => {
                  let wordBg = 'transparent';
                  let wordColor = 'var(--text-primary)';
                  let borderStyle = '1px solid transparent';
                  let statusBadge = '';

                  if (item.status === 'correct') {
                    wordBg = 'var(--primary-light)';
                    wordColor = 'var(--primary, #10B981)';
                    borderStyle = '1px solid rgba(16, 185, 129, 0.3)';
                    statusBadge = '✓';
                  } else if (item.status === 'diacritic_error') {
                    wordBg = 'rgba(245, 158, 11, 0.15)';
                    wordColor = '#D97706';
                    borderStyle = '1px solid rgba(245, 158, 11, 0.4)';
                    statusBadge = '~';
                  } else if (item.status === 'word_error' || item.status === 'missing_word') {
                    wordBg = 'rgba(239, 68, 68, 0.15)';
                    wordColor = '#DC2626';
                    borderStyle = '1px solid rgba(239, 68, 68, 0.4)';
                    statusBadge = '✕';
                  }

                  return (
                    <motion.span
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedWordInfo(item)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: wordBg,
                        color: wordColor,
                        border: borderStyle,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative'
                      }}
                      title={item.message}
                    >
                      <span>{item.expected || item.spoken}</span>
                      {statusBadge && (
                        <span style={{ fontSize: '11px', fontWeight: 900, opacity: 0.8 }}>
                          {statusBadge}
                        </span>
                      )}
                    </motion.span>
                  );
                })
              ) : (
                /* Fallback: render verseWords with simulation highlights */
                verseWords.map((word, idx) => {
                  const isPassed = activeWordIdx >= idx;
                  const isCurrent = activeWordIdx === idx;
                  const isMistakeWord = demoMode === 'mistake_demo' && idx === 3;

                  let wordBg = 'transparent';
                  let wordColor = 'var(--text-primary)';
                  let borderStyle = '1px solid transparent';

                  if (isCurrent) {
                    wordBg = 'var(--primary-light)';
                    wordColor = 'var(--primary)';
                    borderStyle = '1px solid var(--primary-border)';
                  } else if (isPassed) {
                    if (isMistakeWord) {
                      wordBg = 'rgba(239, 68, 68, 0.15)';
                      wordColor = '#EF4444';
                      borderStyle = '1px solid rgba(239, 68, 68, 0.3)';
                    } else {
                      wordColor = 'var(--primary)';
                      wordBg = 'rgba(16, 185, 129, 0.08)';
                    }
                  }

                  return (
                    <motion.span
                      key={idx}
                      animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: wordBg,
                        color: wordColor,
                        border: borderStyle,
                        transition: 'all 0.2s ease',
                        display: 'inline-block'
                      }}
                    >
                      {word}
                    </motion.span>
                  );
                })
              )}
            </div>

            {/* Hint to click words */}
            {analysisResult && (
              <p style={{ margin: '14px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                💡 {isRTL ? 'اضغط على أي كلمة لعرض مقارنتها الدقيقة بين المصحف وما تم نطقه.' : 'Click any word to inspect the exact pronunciation comparison.'}
              </p>
            )}
          </div>

          {/* Selected Word Inspector Modal / Card */}
          <AnimatePresence>
            {selectedWordInfo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  marginBottom: '16px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--primary-border)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    {isRTL ? 'تفاصيل الكلمة:' : 'Word Details:'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary, #10B981)', fontFamily: 'serif' }}>
                      {isRTL ? 'في المصحف:' : 'Quran:'} {selectedWordInfo.expected || '—'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>↔</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'serif' }}>
                      {isRTL ? 'ما سُمِع:' : 'Heard:'} {selectedWordInfo.spoken || '—'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: selectedWordInfo.status === 'correct' ? 'var(--primary-light)' : 'rgba(239, 68, 68, 0.15)',
                    color: selectedWordInfo.status === 'correct' ? 'var(--primary, #10B981)' : '#DC2626',
                    fontWeight: 700
                  }}>
                    {selectedWordInfo.message}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedWordInfo(null)}
                  style={{
                    fontSize: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  ✕ {isRTL ? 'إغلاق' : 'Close'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time AI Status Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '14px',
            background: isRecording
              ? 'rgba(16, 185, 129, 0.08)'
              : (isSimulating ? 'var(--primary-light)' : 'var(--bg-color)'),
            border: `1px solid ${
              isRecording
                ? 'rgba(16, 185, 129, 0.3)'
                : (isSimulating ? 'var(--primary-border)' : 'var(--glass-border)')
            }`,
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isRecording || isSimulating ? '#10B981' : '#94A3B8',
                boxShadow: isRecording || isSimulating ? '0 0 10px #10B981' : 'none'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {!isRecording && !isSimulating && !analysisResult && (
                  isRTL ? 'اضغط "سجّل تلاوتك الآن" للتسميع بصوتك أو اختر محاكاة سريعة.' : 'Click "Recite with Mic" to test your voice or try a quick simulation.'
                )}
                {isRecording && (
                  isRTL ? '🎙️ يستمع نموذج التسميع لصوتك وتلاوتك الآن...' : '🎙️ Recitation AI is listening to your voice...'
                )}
                {isSimulating && (
                  demoMode === 'mistake_demo' && activeWordIdx >= 3 
                    ? (isRTL ? '⚠️ تنبيه AI: تم رصد اختلاف في الكلمة (تنبيه تصحيحي)' : '⚠️ Voice AI Alert: Pronunciation discrepancy detected')
                    : (isRTL ? '🎙️ مطابقة فورية للحفظ والتشكيل مع النص القرآني...' : '🎙️ Live AI phoneme matching with the Holy Quran...')
                )}
                {!isSimulating && !isRecording && analysisResult && (
                  isRTL 
                    ? `✅ اكتمل فحص التسميع بنجاح! دقة المطابقة ${analysisResult.accuracy}%.` 
                    : `✅ Recitation evaluated! Accuracy: ${analysisResult.accuracy}%.`
                )}
              </span>
            </div>

            <button
              onClick={onDemoLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <span>{isRTL ? 'فتح جلسات التسميع الكاملة في المنصة' : 'Launch Full Quran Recitation'}</span>
              {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
