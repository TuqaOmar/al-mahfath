import { requestFcmToken, onForegroundMessage } from '../lib/firebase';

class NotificationManager {
  constructor() {
    this.permissionGranted = false;
    this.isSupported = 'Notification' in window;
    
    if (this.isSupported) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  // 1. طلب الصلاحية من المستخدم
  async requestPermission(userId = null) {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this environment.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (this.permissionGranted) {
        // إذا وافق، نحاول جلب توكن FCM للإشعارات السحابية (Push Notifications)
        const token = await requestFcmToken(userId);
        if (token) {
          console.log('FCM Push Notifications Enabled!');
        }
        return true;
      } else {
        console.warn('User denied notification permissions.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // 2. إرسال إشعار محلي فوري (Local Notification)
  sendLocalNotification(title, options = {}) {
    if (!this.isSupported || !this.permissionGranted) {
      console.warn('Cannot send notification: Permission denied or not supported.');
      return;
    }

    const defaultOptions = {
      icon: '/vite.svg', // مسار أيقونة التطبيق
      badge: '/vite.svg',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar-SA',
    };

    try {
      // نستخدم ServiceWorkerRegistration إذا توفرت لإشعارات أقوى، أو Notification العادية
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, { ...defaultOptions, ...options });
        }).catch(() => {
          new Notification(title, { ...defaultOptions, ...options });
        });
      } else {
        new Notification(title, { ...defaultOptions, ...options });
      }
    } catch (e) {
      console.error('Failed to send notification', e);
    }
  }

  // 3. جدولة إشعار (محاكاة محلية للمتصفح - في التطبيق الحقيقي للموبايل نستخدم Local Notifications Plugin)
  scheduleNotification(title, options, delayInMs) {
    if (!this.isSupported || !this.permissionGranted) return;
    
    // جدولة بسيطة طالما الـ Tab مفتوح (في الـ PWA)
    setTimeout(() => {
      this.sendLocalNotification(title, options);
    }, delayInMs);
  }

  // 4. الاستماع للإشعارات القادمة من السيرفر (Push Notifications) أثناء فتح التطبيق
  listenToForeground() {
    onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        this.sendLocalNotification(title, { body });
      }
    });
  }
}

export const notificationManager = new NotificationManager();
