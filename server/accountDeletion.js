import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';

const firebaseConfig = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));

// Deletes everything that belongs to one account, then the Firebase Auth user.
// Runs with Admin privileges because Firestore rules (correctly) forbid a user
// from deleting their own profile document from the client.
// Order matters: data first, Auth last, so a failure leaves the user able to retry.
export async function deleteAccountData(db, uid, { auth = getAuth(), storage = null } = {}) {
  if (typeof uid !== 'string' || !uid || uid.includes('/')) throw Object.assign(new Error('Invalid user id'), { status: 400 });
  const summary = { posts: 0, comments: 0, likes: 0, groupsDeactivated: 0, avatars: 0 };

  // 1. Community: own posts (with their comments/likes), own comments and likes elsewhere.
  const posts = await db.collection('community_posts').where('authorId', '==', uid).get();
  for (const post of posts.docs) { await db.recursiveDelete(post.ref); summary.posts++; }

  // Per-post scan (collection-scope queries only) so no collection-group index is needed.
  const remaining = await db.collection('community_posts').get();
  for (const post of remaining.docs) {
    const [comments, like] = await Promise.all([
      post.ref.collection('comments').where('authorId', '==', uid).get(),
      post.ref.collection('likes').doc(uid).get()
    ]);
    if (comments.empty && !like.exists) continue;
    await db.runTransaction(async tx => {
      const fresh = await tx.get(post.ref);
      comments.docs.forEach(comment => tx.delete(comment.ref));
      if (like.exists) tx.delete(like.ref);
      if (fresh.exists) tx.update(post.ref, {
        commentsCount: Math.max(0, Number(fresh.data().commentsCount || 0) - comments.size),
        likes: Math.max(0, Number(fresh.data().likes || 0) - (like.exists ? 1 : 0))
      });
    });
    summary.comments += comments.size;
    summary.likes += like.exists ? 1 : 0;
  }

  // 2. Groups this account taught are closed (students keep their own records).
  const groups = await db.collection('groups').where('teacherId', '==', uid).get();
  for (const group of groups.docs) { await group.ref.update({ active: false }); summary.groupsDeactivated++; }

  // 3. Membership, enrollment request and the profile with every subcollection
  //    (recitations, ayah progress, AI chat, notes, notifications, plans).
  await db.doc(`memberships/${uid}`).delete();
  await db.doc(`enrollmentRequests/${uid}`).delete();
  await db.recursiveDelete(db.doc(`users/${uid}`));

  // 4. Uploaded avatars. firebase-admin/storage is loaded lazily: its
  // @google-cloud/storage dependency is optional, and a missing copy must not
  // stop the whole server from starting. In emulator tests, never reach the
  // production bucket unless a Storage emulator is configured.
  try {
    const emulatorWithoutStorage = process.env.MA7FATH_EMULATOR_TEST === '1' && !process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    if (!storage && emulatorWithoutStorage) throw new Error('storage cleanup skipped in emulator test');
    const { getStorage } = storage ? {} : await import('firebase-admin/storage');
    const bucket = (storage || getStorage()).bucket(firebaseConfig.storageBucket);
    const [files] = await bucket.getFiles({ prefix: `avatars/${uid}/` });
    await Promise.all(files.map(file => file.delete()));
    summary.avatars = files.length;
  } catch (error) {
    console.warn('[accountDeletion] avatar cleanup notice:', error.message);
  }

  // 5. Finally the sign-in account itself (no recent-login popup needed).
  await auth.deleteUser(uid);
  return summary;
}
