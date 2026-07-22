import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipForward, SkipBack, UserCheck, Sparkles } from 'lucide-react';

const recitersList = [
  { id: 'ar.alafasy', name: 'مشاري بن راشد العفاسي', sub: 'تلاوة خاشعة' },
  { id: 'ar.husary', name: 'محمود خليل الحصري', sub: 'المعلم والمصحف المرتل' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي', sub: 'المنشاوي المرتل' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد', sub: 'عبد الباسط المرتل' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', sub: 'إمام الحرم المكي' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', sub: 'إمام الحرم المكي' }
];

export const QuranAudioPlayer = ({ surahNumber = 1, startAyah = 1, endAyah = 7 }) => {
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [currentAyah, setCurrentAyah] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef(null);

  // Construct audio URL based on EveryAyah / AlQuran Cloud CDN
  // Format: https://cdn.islamic.network/quran/audio/128/{reciter_id}/{global_ayah_index}.mp3
  useEffect(() => {
    // For Surah Al-Fatiha (Ayah 1..7) as default live demo
    // AlQuran Cloud Ayah Audio CDN URL
    const url = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${currentAyah}.mp3`;
    setAudioUrl(url);
    if (isPlaying && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(e => console.log('Audio playback waiting:', e));
    }
  }, [selectedReciter, currentAyah]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
    }
  };

  const handleEnded = () => {
    if (currentAyah < endAyah) {
      setCurrentAyah(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentAyah(startAyah);
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Volume2 size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>مشغل الاستماع والتسميع الصوتي (Live Audio API)</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>مصدر صوتي معتمد 100% (EveryAyah & AlQuran Cloud CDN)</span>
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
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setCurrentAyah(prev => Math.max(startAyah, prev - 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="الآية السابقة"
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
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginRight: '-2px' }} />}
          </button>

          <button 
            onClick={() => setCurrentAyah(prev => Math.min(endAyah, prev + 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="الآية التالية"
          >
            <SkipBack size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>
            الآية {currentAyah} من {endAyah}
          </span>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
            القارئ: {recitersList.find(r => r.id === selectedReciter)?.name}
          </span>
        </div>
      </div>
    </div>
  );
};
