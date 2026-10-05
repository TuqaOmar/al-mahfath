import { db } from './middleware/auth.js';
import { planRef } from './privateUserData.js';
import { ammanDateKey, activityNow } from './quranActivityStreak.js';

const completionKeys = ['khatmah', 'preparation', 'newMemorization', 'nearRevision', 'farRevision'];

export function profilePreferences(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return {}; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function confirmedProfile(data, uid) {
  const user = { ...data, uid, preferences: profilePreferences(data.preferences),
    hasCompletedWizard: Boolean(data.hasCompletedWizard), memorizedPages: null,
    memorizedPagesCount: null, totalJuz: null, memoryScore: null, verifiedMemorizedPages: null,
    verifiedMemorizationSource: 'unavailable_no_page_approval_workflow' };
  delete user.passwordHash;
  delete user.salt;
  return user;
}

export async function persistProfilePatch(uid, updates) {
  const ref = db.doc(`users/${uid}`);
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw Object.assign(new Error('المستخدم غير موجود'), { status: 404 });
    const previous = snapshot.data();
    const patch = { ...updates };
    if (Object.hasOwn(patch, 'preferences')) {
      patch.preferences = { ...profilePreferences(previous.preferences), ...patch.preferences };
    }
    tx.update(ref, patch);
    return confirmedProfile({ ...previous, ...patch }, uid);
  });
}

// Plan and dashboard completion projection commit together. These are personal
// checklist entries: no teacher approval, Quran activity, XP or rewards are added.
export async function persistFortressPlan(uid, incoming) {
  if (Object.hasOwn(incoming, 'completionStatus') && (!incoming.completionStatus ||
      typeof incoming.completionStatus !== 'object' || Array.isArray(incoming.completionStatus) ||
      Object.entries(incoming.completionStatus).some(([key, value]) => !completionKeys.includes(key) || typeof value !== 'boolean'))) {
    throw Object.assign(new Error('Invalid fortress completion status'), { status: 400 });
  }
  const now = activityNow();
  const today = ammanDateKey(now);
  const ref = planRef(uid);
  const userRef = db.doc(`users/${uid}`);
  return db.runTransaction(async tx => {
    const [saved, profile] = await Promise.all([tx.get(ref), tx.get(userRef)]);
    if (!profile.exists) throw Object.assign(new Error('المستخدم غير موجود'), { status: 404 });
    const previous = saved.data() || {};
    const storedDay = previous.completionDate || (previous.updatedAt ? ammanDateKey(previous.updatedAt) : null);
    const status = incoming.completionStatus || (storedDay === today ? previous.completionStatus : {}) || {};
    const completionStatus = Object.fromEntries(completionKeys.map(key => [key, status[key] === true]));
    const { persistenceStatus, uid: ignoredUid, ...planFields } = incoming;
    const plan = { ...previous, ...planFields, userId: uid, completionStatus,
      completionDate: today, updatedAt: now.toISOString() };
    delete plan.persistenceStatus;
    const preferences = { ...profilePreferences(profile.data().preferences), fortressesDate: today,
      fortressesToday: Object.fromEntries(completionKeys.map((key, index) => [index + 1, completionStatus[key]])) };
    tx.set(ref, plan);
    tx.update(userRef, { preferences });
    return { plan, user: confirmedProfile({ ...profile.data(), preferences }, uid) };
  });
}
