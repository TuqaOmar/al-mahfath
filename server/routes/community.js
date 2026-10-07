import express from 'express';
import { randomUUID } from 'node:crypto';
import { db, requireAuth } from '../middleware/auth.js';
import { hasRole } from '../accessControl.js';
import { registerPushToken, sendPush } from '../pushNotifications.js';

const router = express.Router();
const fail = (status, message) => Object.assign(new Error(message), { status });
const route = handler => async (req, res) => {
  try { await handler(req, res); }
  catch (error) {
    console.error('Community API error:', error);
    res.status(error.status || 503).json({ success: false, message: error.message || 'تعذر الوصول إلى المجتمع' });
  }
};
const cleanText = (value, max, label) => {
  const text = String(value || '').trim();
  if (!text || text.length > max) throw fail(400, `${label} غير صالح`);
  return text;
};

async function profile(uid) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) throw fail(404, 'حساب المستخدم غير موجود');
  return snap.data();
}

async function serializePost(snapshot, viewerId, viewerProfile) {
  const data = snapshot.data();
  const [comments, like] = await Promise.all([
    snapshot.ref.collection('comments').orderBy('createdAt', 'asc').get(),
    snapshot.ref.collection('likes').doc(viewerId).get()
  ]);
  return {
    id: snapshot.id, ...data,
    answers: comments.docs.map(doc => ({ id: doc.id, ...doc.data(), canDelete: doc.data().authorId === viewerId || hasRole(viewerProfile, 'admin') })),
    isLiked: like.exists,
    canEdit: data.authorId === viewerId || hasRole(viewerProfile, 'admin')
  };
}

router.get('/community/posts', requireAuth, route(async (req, res) => {
  const snapshot = await db.collection('community_posts').orderBy('createdAt', 'desc').limit(100).get();
  const posts = await Promise.all(snapshot.docs.map(post => serializePost(post, req.user.uid, req.user.profile)));
  res.json({ success: true, posts, source: 'firestore' });
}));

router.post('/community/posts', requireAuth, route(async (req, res) => {
  const content = cleanText(req.body.content, 4000, 'نص المنشور');
  const category = cleanText(req.body.category || 'تدبر', 80, 'التصنيف');
  const authorProfile = await profile(req.user.uid);
  const isAnonymous = Boolean(req.body.isAnonymous);
  const ref = db.collection('community_posts').doc();
  const post = {
    authorId: req.user.uid,
    author: isAnonymous ? 'هوية مخفية' : (authorProfile.name || 'مستخدم'),
    avatar: isAnonymous ? null : (authorProfile.photoURL || null),
    isAnonymous,
    category, content, likes: 0, commentsCount: 0,
    createdAt: new Date().toISOString(), updatedAt: null
  };
  await ref.create(post);
  res.status(201).json({ success: true, post: await serializePost(await ref.get(), req.user.uid, req.user.profile) });
}));

router.put('/community/posts/:id', requireAuth, route(async (req, res) => {
  const ref = db.doc(`community_posts/${req.params.id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw fail(404, 'المنشور غير موجود');
  if (snapshot.data().authorId !== req.user.uid && !hasRole(req.user.profile, 'admin')) throw fail(403, 'لا تملك تعديل هذا المنشور');
  const updates = { content: cleanText(req.body.content, 4000, 'نص المنشور'), updatedAt: new Date().toISOString() };
  if (req.body.category != null) updates.category = cleanText(req.body.category, 80, 'التصنيف');
  await ref.update(updates);
  res.json({ success: true, post: await serializePost(await ref.get(), req.user.uid, req.user.profile) });
}));

router.delete('/community/posts/:id', requireAuth, route(async (req, res) => {
  const ref = db.doc(`community_posts/${req.params.id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw fail(404, 'المنشور غير موجود');
  if (snapshot.data().authorId !== req.user.uid && !hasRole(req.user.profile, 'admin')) throw fail(403, 'لا تملك حذف هذا المنشور');
  const [comments, likes, notifications] = await Promise.all([
    ref.collection('comments').get(), ref.collection('likes').get(),
    // Post notifications only go to the author; a collectionGroup query here needs an index that does not exist.
    db.collection(`users/${snapshot.data().authorId}/notifications`).where('postId', '==', ref.id).get()
  ]);
  const batch = db.batch();
  comments.docs.forEach(doc => batch.delete(doc.ref));
  likes.docs.forEach(doc => batch.delete(doc.ref));
  notifications.docs.forEach(doc => batch.delete(doc.ref));
  batch.delete(ref);
  await batch.commit();
  res.json({ success: true, id: ref.id });
}));

router.post('/community/posts/:id/like', requireAuth, route(async (req, res) => {
  const postRef = db.doc(`community_posts/${req.params.id}`);
  const likeRef = postRef.collection('likes').doc(req.user.uid);
  const result = await db.runTransaction(async tx => {
    const [post, like] = await tx.getAll(postRef, likeRef);
    if (!post.exists) throw fail(404, 'المنشور غير موجود');
    const liked = !like.exists;
    const likes = Math.max(0, Number(post.data().likes || 0) + (liked ? 1 : -1));
    tx.update(postRef, { likes });
    if (liked) tx.create(likeRef, { userId: req.user.uid, createdAt: new Date().toISOString() });
    else tx.delete(likeRef);
    if (post.data().authorId !== req.user.uid) {
      const notificationRef = db.doc(`users/${post.data().authorId}/notifications/like_${postRef.id}_${req.user.uid}`);
      if (liked) tx.set(notificationRef, { recipientId: post.data().authorId, actorId: req.user.uid,
        type: 'community_like', title: 'إعجاب جديد بمنشورك', message: 'أعجب مستخدم بمنشورك في المجتمع.',
        postId: postRef.id, read: false, createdAt: new Date().toISOString() });
      else tx.delete(notificationRef);
    }
    return { liked, likes, authorId: post.data().authorId };
  });
  const { authorId, ...state } = result;
  if (state.liked && authorId !== req.user.uid) {
    await sendPush(authorId, { title: 'إعجاب جديد بمنشورك', body: 'أعجب مستخدم بمنشورك في المجتمع.', tag: `like_${postRef.id}` });
  }
  res.json({ success: true, ...state });
}));

router.post('/community/posts/:id/comments', requireAuth, route(async (req, res) => {
  const text = cleanText(req.body.text, 1500, 'التعليق');
  const postRef = db.doc(`community_posts/${req.params.id}`);
  const authorProfile = await profile(req.user.uid);
  const commentRef = postRef.collection('comments').doc(randomUUID());
  const createdAt = new Date().toISOString();
  const postAuthorId = await db.runTransaction(async tx => {
    const post = await tx.get(postRef);
    if (!post.exists) throw fail(404, 'المنشور غير موجود');
    tx.create(commentRef, { authorId: req.user.uid, author: authorProfile.name || 'مستخدم', avatar: authorProfile.photoURL || null, text, createdAt });
    tx.update(postRef, { commentsCount: Number(post.data().commentsCount || 0) + 1 });
    if (post.data().authorId !== req.user.uid) {
      tx.create(db.doc(`users/${post.data().authorId}/notifications/comment_${commentRef.id}`), {
        recipientId: post.data().authorId, actorId: req.user.uid, type: 'community_comment',
        title: 'تعليق جديد على منشورك', message: `${authorProfile.name || 'مستخدم'} علّق على منشورك.`,
        postId: postRef.id, commentId: commentRef.id, read: false, createdAt
      });
    }
    return post.data().authorId;
  });
  if (postAuthorId !== req.user.uid) {
    await sendPush(postAuthorId, { title: 'تعليق جديد على منشورك', body: `${authorProfile.name || 'مستخدم'}: ${text}`, tag: `comment_${postRef.id}` });
  }
  const post = await serializePost(await postRef.get(), req.user.uid, req.user.profile);
  res.status(201).json({ success: true, post });
}));

router.delete('/community/posts/:id/comments/:commentId', requireAuth, route(async (req, res) => {
  const postRef = db.doc(`community_posts/${req.params.id}`);
  const commentRef = postRef.collection('comments').doc(req.params.commentId);
  await db.runTransaction(async tx => {
    const [post, comment] = await tx.getAll(postRef, commentRef);
    if (!post.exists || !comment.exists) throw fail(404, 'التعليق غير موجود');
    if (comment.data().authorId !== req.user.uid && !hasRole(req.user.profile, 'admin')) throw fail(403, 'لا تملك حذف هذا التعليق');
    tx.delete(commentRef);
    tx.update(postRef, { commentsCount: Math.max(0, Number(post.data().commentsCount || 0) - 1) });
    tx.delete(db.doc(`users/${post.data().authorId}/notifications/comment_${commentRef.id}`));
  });
  res.json({ success: true, post: await serializePost(await postRef.get(), req.user.uid, req.user.profile) });
}));

router.get('/notifications', requireAuth, route(async (req, res) => {
  const snapshot = await db.collection(`users/${req.user.uid}/notifications`).orderBy('createdAt', 'desc').limit(100).get();
  res.json({ success: true, notifications: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
}));

router.post('/notifications/register-token', requireAuth, route(async (req, res) => {
  await registerPushToken(req.user.uid, req.body?.token, req.get('user-agent'));
  res.json({ success: true });
}));

router.patch('/notifications/:id/read', requireAuth, route(async (req, res) => {
  const ref = db.doc(`users/${req.user.uid}/notifications/${req.params.id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw fail(404, 'الإشعار غير موجود');
  await ref.update({ read: true, readAt: new Date().toISOString() });
  res.json({ success: true, id: ref.id });
}));

router.post('/notifications/read-all', requireAuth, route(async (req, res) => {
  const snapshot = await db.collection(`users/${req.user.uid}/notifications`).where('read', '==', false).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.update(doc.ref, { read: true, readAt: new Date().toISOString() }));
  await batch.commit();
  res.json({ success: true, count: snapshot.size });
}));

router.delete('/notifications/:id', requireAuth, route(async (req, res) => {
  const ref = db.doc(`users/${req.user.uid}/notifications/${req.params.id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw fail(404, 'الإشعار غير موجود');
  await ref.delete();
  res.json({ success: true, id: ref.id });
}));

router.delete('/notifications', requireAuth, route(async (req, res) => {
  const snapshot = await db.collection(`users/${req.user.uid}/notifications`).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  res.json({ success: true, count: snapshot.size });
}));

export default router;
