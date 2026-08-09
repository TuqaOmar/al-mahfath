import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_welcome',
    title: 'مرحباً بك في منصة الْمَحْفَظَة AI 🎉',
    message: 'تم إعداد حسابك وخطتك الذكية بنجاح. استعن بالله وابدأ رحلة الحفظ والتثبيت.',
    type: 'system',
    category: 'نظام',
    timestamp: 'الآن',
    read: false,
    icon: '👋'
  },
  {
    id: 'notif_streak_init',
    title: 'بداية السلسلة اليومية ⚡',
    message: 'حافظ على ورودك اليومي للحفاظ على شارة التتابع والتقدم المستمر.',
    type: 'badge',
    category: 'إنجاز',
    timestamp: 'منذ ساعة',
    read: false,
    icon: '🔥'
  }
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('ma7fath_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [activeCelebration, setActiveCelebration] = useState(null);
  const [toast, setToast] = useState(null);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('ma7fath_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const triggerCelebration = ({ title, message, badgeTitle, type = 'wird', xpBonus = 50, categoryName }) => {
    setActiveCelebration({
      title,
      message,
      badgeTitle: badgeTitle || (type === 'wird' ? 'فارس الحصون' : 'بطل الخرائط الذهنية'),
      type,
      xpBonus,
      categoryName
    });

    // Play synthesized celebratory fanfare tone
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 alegre arpeggio
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.12);
        osc.stop(audioCtx.currentTime + index * 0.12 + 0.35);
      });
    } catch (err) {
      console.log('Audio ctx error:', err);
    }
  };

  const notifyAndCelebrate = ({
    title,
    message,
    type = 'achievement', // 'wird' | 'mindmap' | 'badge' | 'achievement'
    icon = '🏆',
    xpBonus = 50,
    badgeTitle,
    shouldCelebrate = true
  }) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      category: type === 'wird' ? 'ورد الحفظ' : (type === 'mindmap' ? 'خريطة ذهنية' : 'إنجاز'),
      timestamp: 'الآن',
      read: false,
      icon,
      xpBonus
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Set brief toast notification
    setToast({ title, message, icon });
    setTimeout(() => {
      setToast(null);
    }, 4500);

    if (shouldCelebrate) {
      triggerCelebration({
        title,
        message,
        badgeTitle,
        type,
        xpBonus,
        categoryName: newNotif.category
      });
    }
  };

  const closeCelebration = () => {
    setActiveCelebration(null);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      notifyAndCelebrate,
      activeCelebration,
      closeCelebration,
      triggerCelebration,
      toast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
