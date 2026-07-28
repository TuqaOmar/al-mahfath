import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipForward, SkipBack, UserCheck, Sparkles, Repeat } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const recitersList = [
  { id: 'ar.alafasy', name: 'مشاري بن راشد العفاسي', sub: 'تلاوة خاشعة' },
  { id: 'ar.husary', name: 'محمود خليل الحصري', sub: 'المعلم والمصحف المرتل' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي', sub: 'المنشاوي المرتل' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد', sub: 'عبد الباسط المرتل' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', sub: 'إمام الحرم المكي' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', sub: 'إمام الحرم المكي' }
];

export const QuranAudioPlayer = ({ surahNumber = 1, startAyah = 1, endAyah = 7 }) => {
  const { t, isRTL } = useLanguage();
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [currentAyah, setCurrentAyah] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [repeatCount, setRepeatCount] = useState(1); // 1, 3, 5, 10, 'infinite'
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isChangingTrackRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Construct audio URL based on AlQuran Cloud CDN
  useEffect(() => {
    const url = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${currentAyah}.mp3`;
    setAudioUrl(url);
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
          .catch(e => console.log('Audio playback waiting:', e));
      }
    }
  }, [selectedReciter, currentAyah]);

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
        .catch(e => console.log(e));
    }
  };

  const handleEnded = () => {
    if (repeatCount === 'infinite') {
      setCurrentRepeat(prev => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
    } else if (typeof repeatCount === 'number' && repeatCount > 1 && currentRepeat < repeatCount) {
      setCurrentRepeat(prev => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
    } else {
      setCurrentRepeat(1);
      if (currentAyah < endAyah) {
        isChangingTrackRef.current = true;
        setIsPlaying(true);
        isPlayingRef.current = true;
        setCurrentAyah(prev => prev + 1);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
        isChangingTrackRef.current = false;
        setCurrentAyah(startAyah);
      }
    }
  };

  return (
    <div style={{
      padding: '24px',
      borderRadius: '20px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-soft)',
      maxWidth: '750px',
      margin: '0 auto'
    }}>
      {/* Audio element */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
          isChangingTrackRef.current = false;
        }}
        onPause={() => {
          if (!isChangingTrackRef.current) {
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Volume2 size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>
              {t('audio_player_title')}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              مصدر صوتي معتمد 100% (EveryAyah & AlQuran Cloud CDN)
            </span>
          </div>
        </div>

        {/* Reciter Selector */}
        <select
          value={selectedReciter}
          onChange={(e) => setSelectedReciter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid var(--primary)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontWeight: 'bold',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer'
          }}
        >
          {recitersList.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.sub})</option>
          ))}
        </select>
      </div>

      {/* Player Bar */}
      <div style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--bg-color)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => {
              setCurrentAyah(prev => Math.max(startAyah, prev - 1));
              setCurrentRepeat(1);
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title={t('audio_ayah_prev')}
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={togglePlay}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginRight: isRTL ? '0' : '-2px' }} />}
          </button>

          <button 
            onClick={() => {
              setCurrentAyah(prev => Math.min(endAyah, prev + 1));
              setCurrentRepeat(1);
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title={t('audio_ayah_next')}
          >
            <SkipBack size={20} />
          </button>

          {/* Repeat Selector Button */}
          <button
            onClick={() => {
              const options = [1, 3, 5, 10, 'infinite'];
              const idx = options.indexOf(repeatCount);
              const nextOpt = options[(idx + 1) % options.length];
              setRepeatCount(nextOpt);
              setCurrentRepeat(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: `1px solid ${repeatCount !== 1 ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: repeatCount !== 1 ? 'var(--primary-light)' : 'transparent',
              color: repeatCount !== 1 ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Repeat size={14} />
            <span>
              {repeatCount === 'infinite' ? '∞' : `${repeatCount}x`}
            </span>
          </button>
        </div>

        <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>
            الآية {currentAyah} من {endAyah}
            {repeatCount !== 1 && ` (تكرار ${currentRepeat}/${repeatCount === 'infinite' ? '∞' : repeatCount})`}
          </span>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
            القارئ: {recitersList.find(r => r.id === selectedReciter)?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

