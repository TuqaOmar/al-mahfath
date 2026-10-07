import { getMessaging } from 'firebase-admin/messaging';
import { db } from './middleware/auth.js';

// Tokens live in their own server-only collection (doc id = token) so they never
// leak through publicUser() and a device that switches accounts moves to the new uid.
const tokens = () => db.collection('pushTokens');
const DEAD_TOKEN = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

export async function registerPushToken(uid, token, userAgent = '') {
  if (typeof token !== 'string' || token.length < 20 || token.length > 1500 || token.includes('/')) {
    throw Object.assign(new Error('رمز الإشعارات غير صالح'), { status: 400 });
  }
  await tokens().doc(token).set({ uid, userAgent: String(userAgent).slice(0, 300), updatedAt: new Date().toISOString() });
}

// Never throws: a failed push must not fail the action that triggered it.
export async function sendPush(uid, { title, body, url = '/dashboard', tag = 'almahfath' }) {
  try {
    const snapshot = await tokens().where('uid', '==', uid).get();
    if (snapshot.empty) return 0;
    const list = snapshot.docs.map(doc => doc.id);
    const result = await getMessaging().sendEachForMulticast({
      tokens: list,
      notification: { title, body: String(body || '').slice(0, 300) },
      data: { url, tag },
      webpush: { headers: { Urgency: 'high' } }
    });
    const dead = result.responses.map((response, i) => !response.success && DEAD_TOKEN.has(response.error?.code) ? list[i] : null).filter(Boolean);
    if (dead.length) await Promise.all(dead.map(token => tokens().doc(token).delete()));
    return result.successCount;
  } catch (error) {
    console.warn('Push send failed:', error.message);
    return 0;
  }
}
