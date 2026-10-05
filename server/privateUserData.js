import { db } from './middleware/auth.js';
import { randomUUID } from 'node:crypto';

// Identity always comes from requireAuth; optional legacy hints may only match it.
export function ownsRequestedIdentity(req, res) {
  const hints = [req.params?.uid, req.query?.uid, req.query?.userId,
    req.body?.uid, req.body?.userId, req.body?.plan?.uid, req.body?.plan?.userId];
  if (hints.some(value => value !== undefined && value !== req.user.uid)) {
    res.status(403).json({ success: false, message: 'Cannot access another user’s private data' });
    return false;
  }
  return true;
}

export const chatRef = uid => db.doc(`users/${uid}/private_ai_chat/current`);
export const planRef = uid => db.doc(`users/${uid}/five_fortresses_plans/current`);

export async function appendChat(uid, message, reply) {
  const ref = chatRef(uid);
  const pairId = randomUUID();
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    const history = [...(snapshot.data()?.history || []),
      { id: `${pairId}-user`, sender: 'user', text: message, userId: uid },
      { id: `${pairId}-ai`, sender: 'ai', text: reply, userId: uid }].slice(-100);
    tx.set(ref, { userId: uid, history, updatedAt: new Date().toISOString() });
    return history;
  });
}
