import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { fetchWithAuth } from '../lib/api';
import { requestFcmToken } from '../lib/firebase';

const NotificationContext = createContext();

// YYYY-MM-DD in the device's local time, matching the local reminder time (toISOString would use UTC).
const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
  const { user } = useAuth();
  const { lang } = useLanguage();
  // Read through a ref so long-lived callbacks/timers always use the current language.
  const langRef = useRef(lang);
  langRef.current = lang;
  const L = (arText, enText) => (langRef.current === 'en' ? enText : arText);
  const [notifications, setNotifications] = useState([]);

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
  const toastTimeoutRef = useRef(null);

  const showToast = (toastData, duration = 3000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const formatted = typeof toastData === 'string'
      ? { title: toastData, message: '', icon: toastData.includes('🔇') ? '🔇' : '🔊' }
      : toastData;
    setToast(formatted);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  };

  const refreshNotifications = useCallback(async () => {
    if (!user?.uid) { setNotifications([]); return false; }
    try {
      const response = await fetchWithAuth('/api/notifications');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || L('تعذر تحميل الإشعارات', 'Could not load notifications'));
      setNotifications(previous => [
        ...(data.notifications || []).map(item => ({ ...item, source: 'server' })),
        ...previous.filter(item => item.source !== 'server')
      ]);
      return true;
    } catch (error) {
      console.error('Failed to load notifications', error);
      return false;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) { setNotifications([]); return; }
    refreshNotifications();
  }, [user?.uid, refreshNotifications]);

  // Re-register this device for server push on every sign-in (tokens rotate; never prompts here).
  useEffect(() => {
    if (user?.uid && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      requestFcmToken(user.uid);
    }
  }, [user?.uid]);

  // Save reminder settings to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('ma7fath_daily_reminder', JSON.stringify(reminderSettings));
    } catch (e) {
      console.error('Failed to save reminder settings', e);
    }
  }, [reminderSettings]);

  // Sync actual browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' && !reminderSettings.browserPushEnabled) {
        updateReminderSettings({ browserPushEnabled: true });
      } else if (Notification.permission === 'denied' && reminderSettings.browserPushEnabled) {
        updateReminderSettings({ browserPushEnabled: false });
      }
    }
  }, []);

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

  // Dispatch Native Notification (compatible with desktop browsers & mobile Android via Service Worker)
  const dispatchNativeNotification = (title, bodyText) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options = {
      body: bodyText,
      icon: '/pwa-192x192.png',
      badge: '/favicon.svg',
      dir: 'rtl',
      lang: 'ar',
      tag: 'daily-quran-reminder',
      renotify: true,
      data: { url: '/dashboard' }
    };

    // Haptic vibration feedback on supported mobile devices
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([250, 100, 250]);
      } catch (e) {
        // ignore
      }
    }

    // Try service worker first (crucial for Chrome on Android & PWA mode)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && reg.showNotification) {
            reg.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        })
        .catch(() => {
          try {
            new Notification(title, options);
          } catch (e) {
            console.warn('Native notification fallback failed', e);
          }
        });
    } else {
      try {
        new Notification(title, options);
      } catch (e) {
        console.warn('Native notification dispatch failed', e);
      }
    }
  };

  // Request browser push notification permission
  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setToast({
        title: L('إشعارات المتصفح غير مدعومة', 'Browser notifications not supported'),
        message: L('متصفحك الحالي لا يدعم إشعارات النظام الخارجية. التنبيهات الصوتية والداخلية تعمل بنجاح.', 'Your browser does not support system notifications. In-app and sound alerts still work.'),
        icon: 'ℹ️'
      });
      setTimeout(() => setToast(null), 4500);
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const isGranted = permission === 'granted';
      updateReminderSettings({ browserPushEnabled: isGranted });

      if (isGranted) {
        if (user?.uid) requestFcmToken(user.uid);
        setToast({
          title: L('تم تفعيل إشعارات المتصفح بنجاح! 🔔', 'Browser notifications enabled! 🔔'),
          message: L('ستصلك التنبيهات على جهازك ومكتملة بالصوت.', 'You will get alerts on your device with sound.'),
          icon: '✅'
        });
        dispatchNativeNotification(
          L('الْمَحْفَظَة AI — تفعيل التنبيهات بنجاح', 'Ma7fath AI — notifications enabled'),
          L('تم تفعيل إشعارات وتذكير المراجعة اليومية على جهازك المبارك بنجاح.', 'Daily review reminders are now enabled on your device.')
        );
      } else if (permission === 'denied') {
        setToast({
          title: L('تم حظر إذن الإشعارات', 'Notification permission blocked'),
          message: L('يرجى السماح بالإشعارات من إعدادات المتصفح أو أيقونة القفل بجانب شريط الرابط.', 'Please allow notifications from browser settings or the lock icon next to the address bar.'),
          icon: '⚠️'
        });
      }
      setTimeout(() => setToast(null), 4500);
      return isGranted;
    } catch (err) {
      console.error('Push notification permission error', err);
      return false;
    }
  };

  // Trigger the review reminder alert
  const triggerReviewReminder = (customMsg = null, isTest = false) => {
    const todayStr = localDateKey();

    // Focus Area Labels
    const focusLabels = {
      five_fortresses: L('خطة الحصون الخمسة اليومية 🛡️', 'Daily Five Fortresses plan 🛡️'),
      near_review: L('المراجعة القريبة (آخر 20 صفحة) ⚡', 'Near review (last 20 pages) ⚡'),
      old_review: L('مراجعة الماضي البعيد 📚', 'Far review 📚'),
      hadr_reading: L('ورد قراءة الحدر والتحضير 📖', 'Fast reading and preparation 📖')
    };

    const focusTitle = focusLabels[reminderSettings.focusArea] || L('جلسة المراجعة اليومية 📖', 'Daily review session 📖');
    // Default texts are stored in Arabic; show them translated, keep anything the user customised.
    const reminderTitle = reminderSettings.title && reminderSettings.title !== DEFAULT_REMINDER_SETTINGS.title ? reminderSettings.title : L('حان موعد جلسة المراجعة اليومية 📖', 'Time for your daily review session 📖');
    const reminderMessage = reminderSettings.message && reminderSettings.message !== DEFAULT_REMINDER_SETTINGS.message ? reminderSettings.message : L('تثبيت المحفوظ سر إتقان القرآن الكريم. خُصص لك هذا الوقت لإنجاز ورد المراجعة والحصون الخمسة.', 'Steady review is the secret of mastering the Quran. This time is set aside for your review and Five Fortresses.');

    // Play tone if sound enabled
    if (reminderSettings.soundEnabled) {
      playReminderChime();
    }

    // Fire browser native notification if permitted (Laptop / Android / PWA)
    if (reminderSettings.browserPushEnabled) {
      dispatchNativeNotification(
        L('الْمَحْفَظَة AI — تذكير المراجعة اليومية', 'Ma7fath AI — daily review reminder'),
        customMsg || (langRef.current === 'en' ? `${focusTitle}: time to strengthen your memorization and complete today\'s portion!` : `${focusTitle}: حان وقت تثبيت حفظك والوفاء بوردك اليومي المبارك!`)
      );
    }

    // Set simulated in-app push alert popup
    setActiveReminderAlert({
      id: `alert_${Date.now()}`,
      title: reminderTitle,
      message: customMsg || reminderMessage,
      focusLabel: focusTitle,
      focusArea: reminderSettings.focusArea,
      scheduledTime: reminderSettings.time,
      isTest,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });

    // Add to notification list
    const newNotif = {
      id: `reminder_notif_${Date.now()}`,
      title: L('⏰ تذكير: موعد جلسة المراجعة', '⏰ Reminder: review session'),
      message: langRef.current === 'en' ? `Time for: ${focusTitle}. Keep your portion going and your memorization firm.` : `حان وقت جلسة: ${focusTitle}. تم تفعيل التنبيه لضمان استمرار وردك وتثبيت حفظك.`,
      type: 'reminder',
      category: L('تذكير المراجعة', 'Review reminder'),
      timestamp: L('الآن', 'Now'),
      read: false,
      icon: '⏰',
      source: 'local-reminder'
    };

    setNotifications(prev => [newNotif, ...prev.filter(n => n.type !== 'reminder').slice(0, 20)]);

    // Update last triggered date if not a manual test
    if (!isTest) {
      updateReminderSettings({ lastTriggeredDate: todayStr, snoozeUntil: null });
    }
  };

  // Test push notification immediately
  const testReminderNow = () => {
    triggerReviewReminder(L('تجربة الإشعار اليومي: تم تفعيل تنبيه جلسة المراجعة بنجاح! 🔔', 'Test notification: your daily review reminder works! 🔔'), true);
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
      title: L('تم تأجيل التذكير ⏳', 'Reminder snoozed ⏳'),
      message: langRef.current === 'en' ? `We will remind you again in ${minutes} minutes.` : `سنذكرك مرة أخرى بعد ${minutes} دقيقة من الآن بإذن الله.`,
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
      const todayStr = localDateKey(now);

      // Check if snoozed
      if (reminderSettings.snoozeUntil) {
        if (Date.now() >= reminderSettings.snoozeUntil) {
          triggerReviewReminder(L('انتهى وقت التأجيل: حان وقت بدء جلسة المراجعة الآن ⚡', 'Snooze over: time to start your review session ⚡'), false);
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

  const markAsRead = async (id) => {
    const target = notifications.find(item => item.id === id);
    if (!target) return false;
    if (target.source === 'server') {
      const response = await fetchWithAuth(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
      if (!response.ok) return false;
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    return true;
  };

  // Local notifications (reminders, achievements) live only in this tab, so the server is
  // called only when server notifications are affected; a failed call changes nothing.
  const hasServerNotifications = (predicate = () => true) =>
    notifications.some(item => item.source === 'server' && predicate(item));

  const markAllAsRead = async () => {
    if (hasServerNotifications(item => !item.read)) {
      try {
        const response = await fetchWithAuth('/api/notifications/read-all', { method: 'POST' });
        if (!response.ok) return false;
      } catch {
        return false;
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    return true;
  };

  const deleteNotification = async (id) => {
    const target = notifications.find(item => item.id === id);
    if (target?.source === 'server') {
      const response = await fetchWithAuth(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) return false;
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    return true;
  };

  const clearAll = async () => {
    if (hasServerNotifications()) {
      try {
        const response = await fetchWithAuth('/api/notifications', { method: 'DELETE' });
        if (!response.ok) return false;
      } catch {
        return false;
      }
    }
    setNotifications([]);
    return true;
  };

  const triggerCelebration = ({ title, message, badgeTitle, type = 'wird', xpBonus = 50, categoryName }) => {
    setActiveCelebration({
      title,
      message,
      badgeTitle: badgeTitle || (type === 'wird' ? L('فارس الحصون', 'Fortress Knight') : L('بطل الخرائط الذهنية', 'Mind-map Champion')),
      type,
      xpBonus,
      categoryName
    });

    // Play synthesized celebratory fanfare tone only if soundEnabled is true
    if (reminderSettings.soundEnabled) {
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
      category: type === 'wird' ? L('ورد الحفظ', 'Memorization portion') : (type === 'mindmap' ? L('خريطة ذهنية', 'Mind map') : L('إنجاز', 'Achievement')),
      timestamp: L('الآن', 'Now'),
      read: false,
      icon,
      xpBonus,
      source: 'local-achievement'
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Set brief toast notification with auto-timeout
    showToast({ title, message, icon }, 4500);

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

  const soundEnabled = !!reminderSettings.soundEnabled;
  const toggleSound = () => {
    const nextState = !soundEnabled;
    updateReminderSettings({ soundEnabled: nextState });
    showToast({
      title: nextState ? L('تم تفعيل الصوت', 'Sound on') : L('تم كتم الصوت', 'Sound muted'),
      message: nextState ? L('أصوات النغمات والتنبيهات التفاعلية قيد التشغيل', 'Tones and interactive sounds are on') : L('تم كتم جميع النغمات والأصوات التفاعلية', 'All tones and interactive sounds are muted'),
      icon: nextState ? '🔊' : '🔇'
    }, 2800);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      refreshNotifications,
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
      showToast,
      dismissToast,
      reminderSettings,
      updateReminderSettings,
      soundEnabled,
      toggleSound,
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
