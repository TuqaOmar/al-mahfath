import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  Shield, 
  Play, 
  CheckCircle, 
  X, 
  Sparkles, 
  Volume2, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  Flame
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export const ReviewReminderAlert = ({ onNavigateToReview }) => {
  const { 
    activeReminderAlert, 
    dismissReminderAlert, 
    snoozeReminder, 
    notifyAndCelebrate,
    reminderSettings
  } = useNotifications();
  const { isRTL, lang } = useLanguage();

  if (!activeReminderAlert) return null;

  const handleStartReview = () => {
    dismissReminderAlert();
    if (onNavigateToReview) {
      onNavigateToReview('five-fortresses');
    }
  };

  const handleMarkAsDone = () => {
    dismissReminderAlert();
    notifyAndCelebrate({
      title: 'إنجاز جلسة المراجعة اليومية 🌟',
      message: 'بارك الله في همتك! تم تسجيل إنجاز جلسة المراجعة اليومية بنجاح ورفع مستوى إتقانك.',
      type: 'wird',
      icon: '🛡️',
      xpBonus: 60,
      badgeTitle: 'حارس المحفوظ'
    });
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        width: '92%',
        maxWidth: '520px',
        pointerEvents: 'auto'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.92 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
            border: '2px solid #10B981',
            borderRadius: '24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45), 0 0 30px rgba(16, 185, 129, 0.3)',
            padding: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Islamic pattern background effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Bell size={24} className="animate-bounce" />
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  border: '2px solid #0F172A'
                }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'white' }}>
                    {activeReminderAlert.title}
                  </h3>
                  {activeReminderAlert.isTest && (
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      تجربة الإشعار 🔔
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', color: '#94A3B8', fontSize: '12.5px' }}>
                  <Clock size={13} color="#34D399" />
                  <span>الموعد المجدول: <strong style={{ color: '#34D399' }}>{activeReminderAlert.scheduledTime || '20:30'}</strong></span>
                  <span>•</span>
                  <span>{activeReminderAlert.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={dismissReminderAlert}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Shield size={16} color="#34D399" />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#34D399' }}>
                {activeReminderAlert.focusLabel || 'جلسة تثبيت المحفوظ والمراجعة اليومية'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#E2E8F0', lineHeight: 1.6 }}>
              {activeReminderAlert.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleStartReview}
              style={{
                flex: '1 1 180px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Play size={16} fill="white" />
              بدء جلسة المراجعة الآن 🚀
            </button>

            <button
              onClick={() => snoozeReminder(15)}
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#E2E8F0',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <RotateCcw size={15} />
              تأجيل 15 دقيقة ⏳
            </button>

            <button
              onClick={handleMarkAsDone}
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#34D399',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)'}
            >
              <CheckCircle size={15} />
              أتممت الورد ✅
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
