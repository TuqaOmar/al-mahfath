import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  Zap, 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingLiveDemo = ({ onDemoLogin }) => {
  const { isRTL } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [demoMode, setDemoMode] = useState('correct'); // 'correct' | 'mistake_demo'
  const [isSimulating, setIsSimulating] = useState(false);

  const sampleAyah = [
    { text: 'بِسْمِ', correct: true },
    { text: 'اللَّهِ', correct: true },
    { text: 'الرَّحْمَٰنِ', correct: true },
    { text: 'الرَّحِيمِ', correct: true },
    { text: '۝١', correct: true, isVerseEnd: true },
    { text: 'الْحَمْدُ', correct: true },
    { text: 'لِلَّهِ', correct: true },
    { text: 'رَبِّ', correct: true },
    { text: 'الْعَالَمِينَ', correct: true },
    { text: '۝٢', correct: true, isVerseEnd: true },
    { text: 'الرَّحْمَٰنِ', correct: true },
    { text: 'الرَّحِيمِ', correct: true },
    { text: '۝٣', correct: true, isVerseEnd: true },
    { text: 'مَالِكِ', correct: true },
    { text: 'يَوْمِ', correct: true },
    { text: 'الدِّينِ', correct: true },
    { text: '۝٤', correct: true, isVerseEnd: true }
  ];

  const handleSimulateRecitation = (mode = 'correct') => {
    setDemoMode(mode);
    setIsSimulating(true);
    setActiveWordIdx(0);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < sampleAyah.length) {
        setActiveWordIdx(idx);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 600);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setActiveWordIdx(-1);
  };

  return (
    <section style={{
      padding: '80px 0',
      background: 'radial-gradient(100% 60% at 50% 50%, var(--primary-light) 0%, var(--bg-surface) 90%)',
      borderTop: '1px solid var(--glass-border)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="badge-modern" style={{ marginBottom: '12px' }}>
            <Zap size={14} />
            <span>{isRTL ? 'تجربة تفاعلية حية بدون تسجيل' : 'Live Interactive Demo (No Signup)'}</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            {isRTL ? 'جرّب محرك التسميع الذكي' : 'Try the Smart Recitation Engine'}{' '}
            <span className="text-gradient">{isRTL ? 'الآن مباشرة' : 'Live Right Now'}</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {isRTL 
              ? 'شاهد كيف يستمع الذكاء الاصطناعي لتلاوتك ويقوم بالتظليل اللحظي للكلمات واكتشاف أي خطأ في الحفظ.'
              : 'See how AI listens to your recitation, highlights words in real-time, and detects any memorization slips.'}
          </p>
        </div>

        {/* Live Interactive Board */}
        <div style={{
          maxWidth: '850px',
          margin: '0 auto',
          padding: '32px',
          borderRadius: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--primary-border)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Header Controls of Widget */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--glass-border)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Volume2 size={18} />
              </div>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                  {isRTL ? 'سورة الفاتحة (الآيات ١ - ٤)' : 'Surah Al-Fatihah (Verses 1 - 4)'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {isRTL ? 'رواية حفص عن عاصم • محاكاة صوتية حية' : 'Hafs Narration • Live Voice AI Simulation'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSimulateRecitation('correct')}
                disabled={isSimulating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSimulating && demoMode === 'correct' ? 'var(--primary-hover)' : 'var(--primary)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSimulating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px var(--primary-glow)'
                }}
              >
                <Play size={14} />
                <span>
                  {isSimulating && demoMode === 'correct' 
                    ? (isRTL ? 'جاري التسميع...' : 'Reciting...') 
                    : (isRTL ? 'تسميع صحيح 100%' : '100% Accurate Demo')}
                </span>
              </button>

              <button
                onClick={() => handleSimulateRecitation('mistake_demo')}
                disabled={isSimulating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: 'var(--secondary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSimulating ? 'not-allowed' : 'pointer'
                }}
              >
                <AlertCircle size={14} />
                <span>{isRTL ? 'تجربة كشف خطأ ⚠️' : 'Detect Mistake Demo ⚠️'}</span>
              </button>

              <button
                onClick={handleReset}
                title={isRTL ? 'إعادة ضبط' : 'Reset'}
                style={{
                  padding: '8px',
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

          {/* Ayah Text Render Box */}
          <div style={{
            padding: '32px 20px',
            margin: '24px 0',
            borderRadius: '16px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            textAlign: 'center',
            direction: 'rtl'
          }}>
            <div style={{
              fontSize: 'clamp(20px, 3.2vw, 30px)',
              lineHeight: 2.2,
              fontFamily: 'serif',
              fontWeight: 700,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px'
            }}>
              {sampleAyah.map((word, idx) => {
                const isPassed = activeWordIdx >= idx;
                const isCurrent = activeWordIdx === idx;
                const isMistakeWord = demoMode === 'mistake_demo' && idx === 8; // "العالمين"

                let wordBg = 'transparent';
                let wordColor = 'var(--text-primary)';
                let borderStyle = 'none';

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
                    {word.text}
                  </motion.span>
                );
              })}
            </div>
          </div>

          {/* Real-time AI Feedback Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '12px',
            background: isSimulating 
              ? (demoMode === 'mistake_demo' && activeWordIdx >= 8 ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-light)')
              : 'var(--bg-color)',
            border: `1px solid ${
              isSimulating 
                ? (demoMode === 'mistake_demo' && activeWordIdx >= 8 ? 'rgba(239, 68, 68, 0.3)' : 'var(--primary-border)')
                : 'var(--glass-border)'
            }`,
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isSimulating ? '#10B981' : '#94A3B8',
                boxShadow: isSimulating ? '0 0 10px #10B981' : 'none'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {!isSimulating && activeWordIdx === -1 && (isRTL ? 'اضغط على أحد أزرار التسميع أعلاه للبدء التجريبي.' : 'Click a recitation button above to test.')}
                {isSimulating && (
                  demoMode === 'mistake_demo' && activeWordIdx >= 8 
                    ? (isRTL ? '⚠️ تنبيه AI: تم رصد اختلاف في الكلمة الأخيرة (تنبيه تصحيحي)' : '⚠️ Voice AI Alert: Pronunciation discrepancy detected')
                    : (isRTL ? '🎙️ جاري الاستماع للتلاوة والمطابقة اللحظية مع النص القرآني...' : '🎙️ Live AI phoneme matching with the Holy Quran...')
                )}
                {!isSimulating && activeWordIdx >= sampleAyah.length - 1 && (isRTL ? '✅ اكتمل التسميع بنجاح! دقة التعرف 99.4%.' : '✅ Recitation complete! 99.4% AI accuracy.')}
              </span>
            </div>

            <button
              onClick={onDemoLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>{isRTL ? 'فتح التسميع الكامل بالمنصة' : 'Launch Full Quran Recitation'}</span>
              {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
