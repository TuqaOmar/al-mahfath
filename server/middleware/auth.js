import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { isAdmin } from '../accessControl.js';
import { validateEmulatorEnvironment } from '../emulatorSafety.js';
import { readFileSync } from 'node:fs';

dotenv.config();
const emulatorTest = validateEmulatorEnvironment();
const firebaseConfig = JSON.parse(readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf8'));

if (!getApps().length) {
  try {
    let credential;
    if (emulatorTest) {
      initializeApp({ projectId: process.env.GCLOUD_PROJECT });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = applicationDefault();
    } else {
      console.warn('⚠️ No Firebase Admin credentials found. Protected API authentication requires credentials or the Firebase Auth emulator.');
    }
    if (!emulatorTest) initializeApp({
      ...(credential ? { credential } : {}),
      projectId: process.env.GCLOUD_PROJECT || firebaseConfig.projectId
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export const db = getFirestore(emulatorTest ? '(default)' :
  (process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)'));

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
  }

  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase token:', error.message);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }

  try {
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ success: false, message: 'Forbidden: User profile not found' });
    }

    const profile = userDoc.data() || {};
    req.user = {
      ...decodedToken,
      role: profile.role || null,
      roles: profile.roles || {},
      profile
    };
    next();
  } catch (error) {
    console.error('Error loading Firebase authorization profile:', error.message);
    return res.status(503).json({ success: false, message: 'Authorization service unavailable' });
  }
};

export const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }
  return requireAuth(req, res, next);
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.uid) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Authentication required before authorization' });
  }
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin privileges required' });
  }
  next();
};
