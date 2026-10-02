import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

let db;
let isMockDb = false;

// 1. Initialize Firebase Admin
if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    initializeApp({ credential: cert(serviceAccount) });
    db = getFirestore();
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
    db = getFirestore();
  } else {
    console.warn('⚠️ No Firebase Admin credentials found. Running in MOCK mode for dry-run.');
    isMockDb = true;
    db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false }),
          set: async () => {},
          update: async () => {}
        })
      })
    };
  }
} else {
  db = getFirestore();
}

// 2. Load Local Data
const dbJsonPath = path.join(ROOT_DIR, 'server', 'db.json');
const safarJsonPath = path.join(ROOT_DIR, 'server', 'safar_data.json');

const localDb = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
const safarData = JSON.parse(fs.readFileSync(safarJsonPath, 'utf8'));

// Parse CLI Args
const isDryRun = process.argv.includes('--dry-run');

console.log(`Starting Migration... (DRY_RUN: ${isDryRun})`);

async function migrateUsers() {
  console.log('\n--- Migrating Users ---');
  let migratedCount = 0;
  
  // Create a map to merge Users from DB and Safar
  const usersMap = new Map();

  // Load from SQLite (db.json)
  if (localDb.users) {
    for (const u of localDb.users) {
      if (!u.uid) continue;
      usersMap.set(u.uid, {
        uid: u.uid,
        email: u.email,
        name: u.name,
        photoURL: u.photoURL,
        role: u.role || 'student', // Fallback
        xp: u.xp || 0,
        level: u.level || 1,
        streak: u.streak || 0,
        hasCompletedWizard: Boolean(u.hasCompletedWizard),
        preferences: u.preferences ? (typeof u.preferences === 'string' ? JSON.parse(u.preferences) : u.preferences) : {}
      });
    }
  }

  // Load teachers from Safar
  if (safarData.teachers) {
    for (const t of safarData.teachers) {
      if (usersMap.has(t.uid)) {
        usersMap.get(t.uid).role = 'teacher';
        if (t.name) usersMap.get(t.uid).name = t.name;
      } else {
        usersMap.set(t.uid, { uid: t.uid, role: 'teacher', name: t.name, email: t.email || '' });
      }
    }
  }

  for (const [uid, userData] of usersMap) {
    if (isDryRun) {
      console.log(`[DRY-RUN] Would write user: ${uid} (Role: ${userData.role})`);
      migratedCount++;
      continue;
    }

    const userRef = db.collection('users').doc(uid);
    const existingDoc = await userRef.get();

    // Conflict Resolution: Firestore data wins if it already exists, 
    // but we merge missing stats/roles from local DB.
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      const updates = {};
      if (!existingData.role && userData.role) updates.role = userData.role;
      if (!existingData.xp && userData.xp) updates.xp = userData.xp;
      
      if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
        console.log(`[MERGED] User: ${uid}`);
        migratedCount++;
      } else {
        console.log(`[SKIPPED] User: ${uid} (Already up to date)`);
      }
    } else {
      await userRef.set(userData);
      console.log(`[CREATED] User: ${uid}`);
      migratedCount++;
    }
  }
  console.log(`Finished migrating ${migratedCount} users.`);
}

async function migrateGroups() {
  console.log('\n--- Migrating Groups ---');
  let migratedCount = 0;
  
  if (!safarData.groups) return;

  for (const g of safarData.groups) {
    const groupId = g.id;
    const groupData = {
      name: g.name,
      code: g.code,
      teacherId: g.teacherId,
      targetLevel: g.targetLevel || 'mubtadi',
      schedule: g.schedule || {},
      status: 'active'
    };

    if (isDryRun) {
      console.log(`[DRY-RUN] Would write group: ${groupId} (Code: ${groupData.code})`);
      migratedCount++;
      continue;
    }

    const groupRef = db.collection('groups').doc(groupId);
    const existingDoc = await groupRef.get();

    // Conflict Resolution: If group exists in Firestore, keep it. Only write if missing.
    if (existingDoc.exists) {
      console.log(`[SKIPPED] Group: ${groupId} (Already exists)`);
    } else {
      await groupRef.set(groupData);
      console.log(`[CREATED] Group: ${groupId}`);
      migratedCount++;
    }
  }
  console.log(`Finished migrating ${migratedCount} groups.`);
}

async function run() {
  try {
    await migrateUsers();
    await migrateGroups();
    console.log('\nMigration script completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
