import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccountData } from '../server/accountDeletion.js';

// Minimal in-memory Firestore: documents keyed by full path.
function fakeDb(seed) {
  const docs = new Map(Object.entries(seed));
  const snap = (path) => ({
    id: path.split('/').pop(), exists: docs.has(path), ref: docRef(path),
    data: () => docs.get(path)
  });
  const query = (coll, filter) => ({
    get: async () => {
      const depth = coll.split('/').length + 1;
      const list = [...docs.keys()]
        .filter(p => p.startsWith(coll + '/') && p.split('/').length === depth)
        .filter(p => !filter || docs.get(p)[filter.field] === filter.value)
        .map(snap);
      return { docs: list, empty: !list.length, size: list.length };
    }
  });
  function collRef(coll) {
    return { ...query(coll), where: (field, _op, value) => query(coll, { field, value }), doc: id => docRef(`${coll}/${id}`) };
  }
  function docRef(path) {
    const parts = path.split('/');
    return {
      path,
      get parent() { return { parent: parts.length > 2 ? docRef(parts.slice(0, -2).join('/')) : null }; },
      collection: name => collRef(`${path}/${name}`),
      get: async () => snap(path),
      delete: async () => { docs.delete(path); },
      update: async patch => { docs.set(path, { ...docs.get(path), ...patch }); }
    };
  }
  return {
    docs,
    collection: collRef,
    doc: docRef,
    recursiveDelete: async ref => { for (const p of [...docs.keys()]) if (p === ref.path || p.startsWith(ref.path + '/')) docs.delete(p); },
    runTransaction: async fn => fn({
      get: ref => ref.get(),
      delete: ref => docs.delete(ref.path),
      update: (ref, patch) => docs.set(ref.path, { ...docs.get(ref.path), ...patch })
    })
  };
}

test('account deletion removes all of the user data, keeps other users, then deletes Auth', async () => {
  const db = fakeDb({
    'users/u1': { name: 'Student', email: 's@example.com' },
    'users/u1/recitation_sessions/r1': { accuracy: 90 },
    'users/u1/private_ai_chat/c1': { text: 'hi' },
    'users/u2': { name: 'Other' },
    'community_posts/p1': { authorId: 'u1', likes: 0, commentsCount: 1 },
    'community_posts/p1/comments/x': { authorId: 'u2' },
    'community_posts/p2': { authorId: 'u2', likes: 2, commentsCount: 2 },
    'community_posts/p2/comments/a': { authorId: 'u1' },
    'community_posts/p2/comments/b': { authorId: 'u2' },
    'community_posts/p2/likes/u1': { userId: 'u1' },
    'community_posts/p2/likes/u2': { userId: 'u2' },
    'groups/g1': { teacherId: 'u1', name: 'Halaqa' },
    'memberships/u1': { uid: 'u1', status: 'active' },
    'enrollmentRequests/u1': { status: 'pending' }
  });
  const deletedAuth = [];
  const deletedFiles = [];
  const storage = { bucket: () => ({ getFiles: async () => [[{ delete: async () => deletedFiles.push('a.png') }]] }) };

  const summary = await deleteAccountData(db, 'u1', { auth: { deleteUser: async uid => deletedAuth.push(uid) }, storage });

  for (const path of ['users/u1', 'users/u1/recitation_sessions/r1', 'users/u1/private_ai_chat/c1', 'community_posts/p1',
    'community_posts/p1/comments/x', 'community_posts/p2/comments/a', 'community_posts/p2/likes/u1', 'memberships/u1', 'enrollmentRequests/u1']) {
    assert.equal(db.docs.has(path), false, `${path} should be deleted`);
  }
  assert.ok(db.docs.has('users/u2'));
  assert.ok(db.docs.has('community_posts/p2/comments/b'));
  assert.deepEqual(db.docs.get('community_posts/p2'), { authorId: 'u2', likes: 1, commentsCount: 1 });
  assert.equal(db.docs.get('groups/g1').active, false);
  assert.deepEqual(deletedAuth, ['u1']);
  assert.deepEqual(deletedFiles, ['a.png']);
  assert.deepEqual(summary, { posts: 1, comments: 1, likes: 1, groupsDeactivated: 1, avatars: 1 });
});

test('account deletion rejects an invalid uid before touching data', async () => {
  const db = fakeDb({ 'users/u1': { name: 'x' } });
  await assert.rejects(() => deleteAccountData(db, '../users', { auth: { deleteUser: async () => {} } }), /Invalid user id/);
  assert.ok(db.docs.has('users/u1'));
});
