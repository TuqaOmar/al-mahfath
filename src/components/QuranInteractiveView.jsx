import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Mic, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from 'lucide-react';

const recitersList = [
  { id: 'ar.alafasy', name: 'مشاري بن راشد العفاسي', sub: 'تلاوة خاشعة' },
  { id: 'ar.husary', name: 'محمود خليل الحصري', sub: 'المعلم والمصحف المرتل' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي', sub: 'المنشاوي المرتل' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد', sub: 'عبد الباسط المرتل' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', sub: 'إمام الحرم المكي' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', sub: 'إمام الحرم المكي' }
];

export const QuranInteractiveView = () => {
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [pageNumber, setPageNumber] = useState(2); // Default to Page 2 (Start of Al-Baqarah)
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surahName, setSurahName] = useState('البقرة');
  const [activeAyahNum, setActiveAyahNum] = useState(8); // Global ayah number for active audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1); // 1x, 3x, 5x
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [isUserReciting, setIsUserReciting] = useState(false);
  const [recitedAyahs, setRecitedAyahs] = useState({});
  const [activeTafsir, setActiveTafsir] = useState('');
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const audioRef = useRef(null);

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

  // Load Quran Page from API dynamically
  useEffect(() => {
    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 200 && data.data) {
          setAyahs(data.data.ayahs);
          if (data.data.ayahs.length > 0) {
            // Find main surah name of the page
            setSurahName(data.data.ayahs[0].surah.name);
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

  // Audio URL format for AlQuran Cloud API (using global ayah number)
  const currentAudioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${activeAyahNum}.mp3`;

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(e => console.log(e));
    }
  }, [activeAyahNum, selectedReciter]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
    }
  };

  const handleAyahClick = (ayahNum) => {
    setActiveAyahNum(ayahNum);
    setCurrentRepeat(1);
    setIsPlaying(true);
  };

  const handleAudioEnded = () => {
    if (repeatCount > 0 && currentRepeat < repeatCount) {
      // Repeat the same verse
      setCurrentRepeat(prev => prev + 1);
      audioRef.current.play();
    } else {
      // Move to next verse on the page
      setCurrentRepeat(1);
      const currentIndex = ayahs.findIndex(a => a.number === activeAyahNum);
      if (currentIndex !== -1 && currentIndex < ayahs.length - 1) {
        setActiveAyahNum(ayahs[currentIndex + 1].number);
      } else {
        setIsPlaying(false);
        if (ayahs.length > 0) {
          setActiveAyahNum(ayahs[0].number);
        }
      }
    }
  };

  const toggleUserRecitation = () => {
    setIsUserReciting(!isUserReciting);
    if (!isUserReciting) {
      setIsPlaying(false);
    }
  };

  const markAyahRecited = (num) => {
    setRecitedAyahs(prev => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Control Bar */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-soft)'
      }}>
        {/* Page Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>رقم الصفحة للورد (1-604):</span>
            <input
              type="number"
              min="1"
              max="604"
              value={pageNumber}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 604) setPageNumber(val);
              }}
              style={{
                display: 'block',
                marginTop: '2px',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '14px',
                width: '80px',
                outline: 'none',
                fontFamily: 'var(--font-body)'
              }}
            />
          </div>
        </div>

        {/* Reciter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Volume2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>اختر القارئ المفضل للورد:</span>
            <select
              value={selectedReciter}
              onChange={(e) => setSelectedReciter(e.target.value)}
              style={{
                display: 'block',
                marginTop: '2px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer'
              }}
            >
              {recitersList.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Previous Ayah */}
          <button 
            onClick={() => {
              const currentIndex = ayahs.findIndex(a => a.number === activeAyahNum);
              if (currentIndex > 0) {
                setActiveAyahNum(ayahs[currentIndex - 1].number);
                setIsPlaying(true);
              }
            }}
            style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
            title="الآية السابقة"
          >
            <SkipForward size={18} />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: isPlaying ? '#EF4444' : 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginRight: '-2px' }} />}
            {isPlaying ? 'إيقاف الاستماع' : 'استمع للورد'}
          </button>

          {/* Next Ayah */}
          <button 
            onClick={() => {
              const currentIndex = ayahs.findIndex(a => a.number === activeAyahNum);
              if (currentIndex !== -1 && currentIndex < ayahs.length - 1) {
                setActiveAyahNum(ayahs[currentIndex + 1].number);
                setIsPlaying(true);
              }
            }}
            style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
            title="الآية التالية"
          >
            <SkipBack size={18} />
          </button>

          {/* Repetition Loop Control Button */}
          <button
            onClick={() => setRepeatCount(prev => prev === 1 ? 3 : (prev === 3 ? 5 : 1))}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: `1px solid ${repeatCount > 1 ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: repeatCount > 1 ? 'var(--primary-light)' : 'var(--bg-color)',
              color: repeatCount > 1 ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="تكرار الآية للتثبيت"
          >
            <Repeat size={16} />
            <span>تكرار: {repeatCount}x</span>
          </button>

        </div>
      </div>

      {/* Interactive Synchronized Verses Display Box */}
      <div style={{
        padding: '36px',
        borderRadius: '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            💡 انقر على أي آية للاستماع إليها مباشرة أو البدء بتكرارها:
          </span>
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>
            {surahName} (صفحة {pageNumber})
          </span>
        </div>

        {/* Verses List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>جاري تحميل آيات الصفحة من المصحف الشريف...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ayahs.map((ayah) => {
              const isActive = activeAyahNum === ayah.number;
              const isRecited = recitedAyahs[ayah.number];

              return (
                <div
                  key={ayah.number}
                  onClick={() => handleAyahClick(ayah.number)}
                  style={{
                    padding: '20px 24px',
                    borderRadius: '16px',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' 
                      : 'var(--bg-color)',
                    border: `2px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: isActive ? '0 4px 16px rgba(16, 185, 129, 0.15)' : 'none'
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

                  {/* Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isActive && isPlaying && (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--primary)', color: 'white', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <Sparkles size={12} /> يجري الاستماع
                      </span>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); markAyahRecited(ayah.number); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: isRecited ? '#10B981' : 'var(--text-secondary)'
                      }}
                      title="تحديد كـ تم التسميع"
                    >
                      <CheckCircle2 size={22} fill={isRecited ? '#10B981' : 'none'} color={isRecited ? 'white' : 'currentColor'} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
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

      {/* Recitation Recording Mode Button */}
      <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justify: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary)' }}>وضع التسميع الصوتي والمتابعة بالذكاء الاصطناعي 🎤</h4>
          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>اقرأ الورد وسيتم تظليل الآية التي تتلوها تلقائياً بتقنية التعرف الصوتي.</span>
        </div>
        <button
          onClick={toggleUserRecitation}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: isUserReciting ? '#EF4444' : 'var(--primary)',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Mic size={18} />
          {isUserReciting ? 'إيقاف التسجيل' : 'بدء التسميع الشخصي'}
        </button>
      </div>

    </div>
  );
};
