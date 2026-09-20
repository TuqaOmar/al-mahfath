import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Firebase Cloud Messaging (FCM) Instance
let messagingInstance = null;

export async function getFcmMessaging() {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined') {
      messagingInstance = getMessaging(app);
    }
  } catch (err) {
    console.warn('FCM not supported in this browser context:', err?.message);
  }
  return messagingInstance;
}

// Request FCM Token for background push notifications
export async function requestFcmToken(userId = null) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return null;
    }

    const msg = await getFcmMessaging();
    if (!msg) {
      console.log('Messaging not available on this browser');
      return null;
    }

    let swReg = null;
    if ('serviceWorker' in navigator) {
      try {
        swReg = await navigator.serviceWorker.ready;
      } catch (e) {
        console.warn('Service worker ready check warning:', e);
      }
    }

    const token = await getToken(msg, {
      serviceWorkerRegistration: swReg || undefined
    });

    if (token) {
      console.log('Firebase Cloud Messaging (FCM) Token obtained:', token.substring(0, 15) + '...');
      localStorage.setItem('almahfath_fcm_token', token);

      // Save token to Firestore if user is present
      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { fcmToken: token, fcmUpdatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.log('Firestore token sync note:', e?.message);
        }
      }

      // Also register token with local server
      try {
        await fetch('/api/notifications/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userId })
        });
      } catch (e) {
        // Backend sync optional
      }

      return token;
    }
  } catch (error) {
    console.warn('Failed to get FCM token:', error);
  }
  return null;
}

// Foreground message listener
export async function onForegroundMessage(callback) {
  try {
    const msg = await getFcmMessaging();
    if (msg) {
      return onMessage(msg, (payload) => {
        console.log('[FCM] Foreground message received:', payload);
        if (callback) callback(payload);
      });
    }
  } catch (e) {
    console.warn('FCM onForegroundMessage error:', e);
  }
  return () => {};
}

// Ensure user has at least anonymous auth for Firestore security rules
onAuthStateChanged(auth, (currentUser) => {
  if (!currentUser) {
    signInAnonymously(auth).catch((err) => {
      console.warn('Anonymous auth note (can use offline/public):', err?.message);
    });
  }
});

// Validate Firestore connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'health'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firebase Firestore test connection offline mode.');
    }
  }
}
testConnection();
