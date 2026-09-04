import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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

const DEFAULT_REMINDER_SETTINGS = {
  enabled: true,
  time: '20:30', // 8:30 PM default
  title: 'حان موعد جلسة المراجعة اليومية 📖',
  message: 'تثبيت المحفوظ سر إتقان القرآن الكريم. خُصص لك هذا الوقت لإنجاز ورد المراجعة والحصون الخمسة.',
  focusArea: 'five_fortresses', // 'five_fortresses' | 'near_review' | 'old_review' | 'hadr_reading'
  soundEnabled: true,
  browserPushEnabled: false,
  lastTriggeredDate: null,
  snoozeUntil: null
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('ma7fath_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [reminderSettings, setReminderSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ma7fath_daily_reminder');
      return saved ? { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(saved) } : DEFAULT_REMINDER_SETTINGS;
    } catch {
      return DEFAULT_REMINDER_SETTINGS;
    }
  });

  const [activeCelebration, setActiveCelebration] = useState(null);
  const [activeReminderAlert, setActiveReminderAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const reminderCheckRef = useRef(null);

  // Save notifications to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('ma7fath_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  // Save reminder settings to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('ma7fath_daily_reminder', JSON.stringify(reminderSettings));
    } catch (e) {
      console.error('Failed to save reminder settings', e);
    }
  }, [reminderSettings]);

  // Update reminder settings
  const updateReminderSettings = (newSettings) => {
    setReminderSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Play gentle Islamic chime tone using Web Audio API
  const playReminderChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 soothing major chime
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.18);
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime + index * 0.18);
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + index * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.18 + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.18);
        osc.stop(audioCtx.currentTime + index * 0.18 + 0.65);
      });
    } catch (err) {
      console.log('Audio chime error:', err);
    }
  };

  // Request browser push notification permission
  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const isGranted = permission === 'granted';
      updateReminderSettings({ browserPushEnabled: isGranted });
      return isGranted;
    } catch (err) {
      console.error('Push notification permission error', err);
      return false;
    }
  };

  // Trigger the review reminder alert
  const triggerReviewReminder = (customMsg = null, isTest = false) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Focus Area Labels
    const focusLabels = {
      five_fortresses: 'خطة الحصون الخمسة اليومية 🛡️',
      near_review: 'المراجعة القريبة (آخر 20 صفحة) ⚡',
      old_review: 'مراجعة الماضي البعيد 📚',
      hadr_reading: 'ورد قراءة الحدر والتحضير 📖'
    };

    const focusTitle = focusLabels[reminderSettings.focusArea] || 'جلسة المراجعة اليومية 📖';

    // Play tone if sound enabled
    if (reminderSettings.soundEnabled) {
      playReminderChime();
    }

    // Fire browser native notification if permitted
    if ('Notification' in window && Notification.permission === 'granted' && reminderSettings.browserPushEnabled) {
      try {
        new Notification('الْمَحْفَظَة AI — تذكير المراجعة اليومية', {
          body: customMsg || `${focusTitle}: حان وقت تثبيت حفظك والوفاء بوردك اليومي المبارك!`,
          icon: '/favicon.ico',
          dir: 'rtl',
          lang: 'ar'
        });
      } catch (e) {
        console.warn('Native notification dispatch failed', e);
      }
    }

    // Set simulated in-app push alert popup
    setActiveReminderAlert({
      id: `alert_${Date.now()}`,
      title: reminderSettings.title || 'حان موعد جلسة المراجعة اليومية 📖',
      message: customMsg || reminderSettings.message || 'تثبيت المحفوظ سر إتقان القرآن الكريم. خُصص لك هذا الوقت لإنجاز ورد المراجعة والحصون الخمسة.',
      focusLabel: focusTitle,
      focusArea: reminderSettings.focusArea,
      scheduledTime: reminderSettings.time,
      isTest,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });

    // Add to notification list
    const newNotif = {
      id: `reminder_notif_${Date.now()}`,
      title: '⏰ تذكير: موعد جلسة المراجعة',
      message: `حان وقت جلسة: ${focusTitle}. تم تفعيل التنبيه لضمان استمرار وردك وتثبيت حفظك.`,
      type: 'reminder',
      category: 'تذكير المراجعة',
      timestamp: 'الآن',
      read: false,
      icon: '⏰'
    };

    setNotifications(prev => [newNotif, ...prev.filter(n => n.type !== 'reminder').slice(0, 20)]);

    // Update last triggered date if not a manual test
    if (!isTest) {
      updateReminderSettings({ lastTriggeredDate: todayStr, snoozeUntil: null });
    }
  };

  // Test push notification immediately
  const testReminderNow = () => {
    triggerReviewReminder('تجربة الإشعار اليومي: تم تفعيل تنبيه جلسة المراجعة بنجاح! 🔔', true);
  };

  // Dismiss in-app reminder alert
  const dismissReminderAlert = () => {
    setActiveReminderAlert(null);
  };

  // Snooze reminder for N minutes
  const snoozeReminder = (minutes = 15) => {
    const snoozeTime = Date.now() + minutes * 60 * 1000;
    updateReminderSettings({ snoozeUntil: snoozeTime });
    setActiveReminderAlert(null);
    setToast({
      title: `تم تأجيل التذكير ⏳`,
      message: `سنذكرك مرة أخرى بعد ${minutes} دقيقة من الآن بإذن الله.`,
      icon: '⏰'
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Schedule timer checker every 20 seconds
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkScheduledTime = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      // Check if snoozed
      if (reminderSettings.snoozeUntil) {
        if (Date.now() >= reminderSettings.snoozeUntil) {
          triggerReviewReminder('انتهى وقت التأجيل: حان وقت بدء جلسة المراجعة الآن ⚡', false);
          return;
        }
      }

      // Check scheduled daily time
      if (
        currentTimeStr === reminderSettings.time &&
        reminderSettings.lastTriggeredDate !== todayStr &&
        !activeReminderAlert
      ) {
        triggerReviewReminder(null, false);
      }
    };

    reminderCheckRef.current = setInterval(checkScheduledTime, 20000);
    // Initial check
    checkScheduledTime();

    return () => {
      if (reminderCheckRef.current) clearInterval(reminderCheckRef.current);
    };
  }, [reminderSettings.enabled, reminderSettings.time, reminderSettings.lastTriggeredDate, reminderSettings.snoozeUntil, activeReminderAlert]);

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
      toast,
      reminderSettings,
      updateReminderSettings,
      testReminderNow,
      triggerReviewReminder,
      activeReminderAlert,
      dismissReminderAlert,
      snoozeReminder,
      requestBrowserPermission
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
