import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star, Award, CheckCircle2, X, Share2, Shield, Heart } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

// Simple lightweight particle confetti canvas
const ConfettiCanvas = () => {
  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas-overlay');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 4 + 2,
      speedX: Math.random() * 3 - 1.5,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 10 - 5
    }));

    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      id="confetti-canvas-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999
      }}
    />
  );
};

export const CelebrationOverlay = () => {
  const { activeCelebration, closeCelebration } = useNotifications();
  const { lang, isRTL } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!activeCelebration) return null;

  const { title, message, badgeTitle, type, xpBonus = 50 } = activeCelebration;

  const getIcon = () => {
    switch (type) {
      case 'wird':
        return <Shield size={48} color="#10B981" />;
      case 'mindmap':
        return <Sparkles size={48} color="#8B5CF6" />;
      case 'badge':
        return <Award size={48} color="#F59E0B" />;
      default:
        return <Trophy size={48} color="#3B82F6" />;
    }
  };

  const handleShare = () => {
    const text = `🎉 أتممت بفضل الله إنجازاً جديداً في حفظ القرآن الكريم: "${title}" عبر تطبيق الْمَحْفَظَة AI! 📖✨`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <ConfettiCanvas />

        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            background: 'var(--bg-surface)',
            border: '2px solid var(--primary)',
            borderRadius: '28px',
            padding: '36px 28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(16, 185, 129, 0.25)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Close button */}
          <button
            onClick={closeCelebration}
            style={{
              position: 'absolute',
              top: '16px',
              left: isRTL ? '16px' : 'auto',
              right: isRTL ? 'auto' : '16px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          {/* Glowing Animated Icon Container */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
            }}
          >
            {getIcon()}
          </motion.div>

          {/* Celebratory Badge Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontWeight: 'bold',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <Star size={14} fill="var(--primary)" />
            <span>{badgeTitle}</span>
          </div>

          {/* Celebration Title */}
          <h2 style={{
            margin: '0 0 10px 0',
            fontSize: '22px',
            color: 'var(--text-primary)',
            fontWeight: 'bold'
          }}>
            {title}
          </h2>

          {/* Celebration Message */}
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '24px'
          }}>
            {message}
          </p>

          {/* Reward Box */}
          <div style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginBottom: '24px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                {lang === 'ar' ? 'مكافأة الخبرة' : 'XP Reward'}
              </span>
              <strong style={{ fontSize: '18px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={16} /> +{xpBonus} XP
              </strong>
            </div>

            <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }} />

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                {lang === 'ar' ? 'المقام الإيماني' : 'Spiritual Status'}
              </span>
              <strong style={{ fontSize: '15px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart size={15} fill="var(--primary)" /> {lang === 'ar' ? 'ثبات وإتقان' : 'Steadfast'}
              </strong>
            </div>
          </div>

          {/* Inspirational Quranic Verse */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            color: 'var(--text-primary)',
            fontFamily: 'Amiri, serif',
            fontSize: '15px',
            marginBottom: '28px',
            lineHeight: 1.6
          }}>
            ﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Share2 size={16} />
              {copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة الإنجاز' : 'Share')}
            </button>

            <button
              onClick={closeCelebration}
              style={{
                flex: 1.5,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <CheckCircle2 size={18} />
              {lang === 'ar' ? 'متابعة الورد والتقدم 🚀' : 'Continue'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
