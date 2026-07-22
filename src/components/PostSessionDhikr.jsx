import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CheckCircle2, RotateCcw, Sparkles, Award, Volume2, VolumeX } from 'lucide-react';

const dhikrList = [
  { id: 'istighfar', title: 'استغفار التلاوة', text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ', target: 33 },
  { id: 'tasbeeh', title: 'التسبيح والتحميد', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ', target: 33 },
  { id: 'salawat', title: 'الصلاة على النبي ﷺ', text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ', target: 10 },
  { id: 'dua', title: 'دعاء ختم الورد', text: 'اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً', target: 1 }
];

export const PostSessionDhikr = () => {
  const [activeDhikrIdx, setActiveDhikrIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [completedDhikrs, setCompletedDhikrs] = useState({});

  const currentDhikr = dhikrList[activeDhikrIdx];

  const handleIncrement = () => {
    if (count + 1 >= currentDhikr.target) {
      setCount(currentDhikr.target);
      setCompletedDhikrs({ ...completedDhikrs, [currentDhikr.id]: true });
    } else {
      setCount(count + 1);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleSelectDhikr = (index) => {
    setActiveDhikrIdx(index);
    setCount(0);
  };

  const isCurrentCompleted = count >= currentDhikr.target || completedDhikrs[currentDhikr.id];

  return (
    <div style={{
      padding: '32px',
      borderRadius: '24px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-soft)',
      textAlign: 'center',
      maxWidth: '650px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles size={22} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>
          مسبحة التدبر وأذكار ما بعد التلاوة
        </h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0' }}>
        اجعل خاتمة وردك معطرة بالاستغفار والذكر والصلاة على النبي ﷺ.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
        {dhikrList.map((item, idx) => {
          const isDone = completedDhikrs[item.id];
          const isSelected = activeDhikrIdx === idx;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectDhikr(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                background: isSelected ? 'var(--primary-light)' : 'var(--bg-color)',
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isDone && <CheckCircle2 size={14} color="#10B981" />}
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Dhikr Card & Counter */}
      <div style={{
        padding: '28px',
        borderRadius: '20px',
        background: 'var(--bg-color)',
        border: '1px solid var(--glass-border)',
        marginBottom: '24px'
      }}>
        <p style={{
          fontSize: '22px',
          fontFamily: 'serif',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          margin: '0 0 20px 0'
        }}>
          « {currentDhikr.text} »
        </p>

        {/* Counter Button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleIncrement}
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: isCurrentCompleted 
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
              : 'linear-gradient(135deg, var(--primary) 0%, #047857 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
            transition: 'background 0.3s ease'
          }}
        >
          <span style={{ fontSize: '36px', fontWeight: 'bold', lineHeight: 1 }}>
            {count}
          </span>
          <span style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
            من {currentDhikr.target}
          </span>
        </motion.button>

        {isCurrentCompleted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', color: '#10B981', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Award size={18} /> تم إتمام هذا الذكر بحمد الله!
          </motion.div>
        )}
      </div>

      {/* Reset Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RotateCcw size={14} /> إعادة العداد
        </button>
      </div>

    </div>
  );
};
