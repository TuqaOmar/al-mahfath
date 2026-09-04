import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
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
