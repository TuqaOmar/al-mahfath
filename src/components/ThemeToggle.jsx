import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const ThemeToggle = ({ variant = 'pill', size = 'medium', className = '', touchTarget = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t, isRTL } = useLanguage();
  const pillHeight = size === 'small' ? (touchTarget ? 44 : 28) : 32;
  const knobOffset = (pillHeight - (size === 'small' ? 22 : 26)) / 2;

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isDark ? t('theme_light') || 'تفعيل الوضع النهار' : t('theme_dark') || 'تفعيل الوضع الليلة'}
        aria-pressed={isDark}
        title={isDark ? t('theme_light') || 'الوضع النهاري' : t('theme_dark') || 'الوضع الليلة'}
        className={className}
        style={{
          position: 'relative',
          width: size === 'small' ? '54px' : '64px',
          height: `${pillHeight}px`,
          borderRadius: '20px',
          border: '1px solid var(--glass-border, #ECE6EA)',
          background: isDark 
            ? 'linear-gradient(135deg, #1F1220 0%, #2D1B2A 100%)' 
            : 'linear-gradient(135deg, #EEF8F6 0%, #DDF1ED 100%)',
          cursor: 'pointer',
          padding: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
          boxShadow: isDark 
            ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 0 12px rgba(55, 125, 113, 0.2)' 
            : 'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 12px rgba(227, 154, 45, 0.25)',
          transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
          outline: 'none'
        }}
      >
        {/* Sun Icon Background */}
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '50%',
          opacity: isDark ? 0.4 : 1, 
          transition: 'opacity 0.3s ease',
          zIndex: 1
        }}>
          <Sun size={size === 'small' ? 14 : 16} color="#E39A2D" />
        </span>

        {/* Moon Icon Background */}
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '50%',
          opacity: isDark ? 1 : 0.4, 
          transition: 'opacity 0.3s ease',
          zIndex: 1
        }}>
          <Moon size={size === 'small' ? 14 : 16} color="#377D71" />
        </span>

        {/* Sliding Knob */}
        <motion.div
          layout
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
          style={{
            position: 'absolute',
            top: `${knobOffset}px`,
            bottom: `${knobOffset}px`,
            left: isDark ? (size === 'small' ? '29px' : '35px') : '3px',
            width: size === 'small' ? '22px' : '26px',
            height: size === 'small' ? '22px' : '26px',
            borderRadius: '50%',
            background: isDark 
              ? 'linear-gradient(135deg, #377D71 0%, #2F6B61 100%)' 
              : 'linear-gradient(135deg, #E39A2D 0%, #C27F17 100%)',
            boxShadow: isDark 
              ? '0 2px 8px rgba(55, 125, 113, 0.5)' 
              : '0 2px 8px rgba(227, 154, 45, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ rotate: -90, scale: 0.2, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isDark ? (
                <Moon size={size === 'small' ? 12 : 14} color="#FFFFFF" />
              ) : (
                <Sun size={size === 'small' ? 12 : 14} color="#FFFFFF" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </button>
    );
  }

  // Circular Icon Button Variant with Smooth Rotation & Pulse
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      aria-label={isDark ? t('theme_light') || 'الوضع النهاري' : t('theme_dark') || 'الوضع الليلة'}
      aria-pressed={isDark}
      title={isDark ? t('theme_light') || 'الوضع النهاري' : t('theme_dark') || 'الوضع الليلة'}
      className={`flex-center ${className}`}
      style={{
        width: size === 'small' ? '36px' : '40px',
        height: size === 'small' ? '36px' : '40px',
        borderRadius: '50%',
        cursor: 'pointer',
        background: isDark 
          ? 'linear-gradient(135deg, #2D1B2A 0%, #1F1220 100%)' 
          : 'linear-gradient(135deg, #EEF8F6 0%, #DDF1ED 100%)',
        border: '1px solid var(--glass-border, #ECE6EA)',
        boxShadow: isDark 
          ? '0 2px 8px rgba(0,0,0,0.3)' 
          : '0 2px 8px rgba(55, 125, 113, 0.2)',
        transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'sun-icon' : 'moon-icon'}
          initial={{ rotate: -180, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 180, scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'backOut' }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark ? (
            <Sun size={size === 'small' ? 18 : 20} color="#E39A2D" />
          ) : (
            <Moon size={size === 'small' ? 18 : 20} color="#377D71" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};
