import test from 'node:test';
import assert from 'node:assert/strict';

process.env.VERCEL = '1';
const { default: app } = await import('../server/index.js');

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('protected teacher, admin, and recitation reads reject anonymous callers', async () => {
  await withServer(async baseUrl => {
    const paths = [
      '/api/teacher/teacher-1/dashboard',
      '/api/teacher/teacher-1/students',
      '/api/teacher/teacher-1/student/student-1',
      '/api/admin/users',
      '/api/recitation/history?pageNumber=2',
      '/api/recitation/page-stats/2'
    ];

    for (const path of paths) {
      const response = await fetch(baseUrl + path);
      assert.equal(response.status, 401, path);
    }
  });
});

test('public recitation analysis cannot auto-save without authentication', async () => {
  await withServer(async baseUrl => {
    const payload = {
      expectedText: 'قل هو الله أحد',
      spokenText: 'قل هو الله أحد',
      pageNumber: 604,
      surahNumber: 112,
      ayahNumber: 6222,
      autoSave: true
    };
    const response = await fetch(baseUrl + '/api/ai/recitation-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(response.status, 401);
  });
});

test('public recitation analysis remains available when no save is requested', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(baseUrl + '/api/ai/recitation-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedText: 'قل هو الله أحد',
        spokenText: 'قل هو الله أحد',
        autoSave: false
        , pageNumber: 604, surahNumber: 112, ayahNumber: 6222
      })
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.accuracy, 100);
    assert.equal(data.savedSession, null);
  });
});

test('legacy JSON authentication is retired in normal runtime, regardless of asserted identity', async () => {
  await withServer(async baseUrl => {
    for (const route of ['signup', 'login', 'google', 'demo', 'admin']) {
      const response = await fetch(`${baseUrl}/api/auth/${route}`, { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: 'admin_123', email: 'admin@ma7fath.ai', role: 'admin' }) });
      assert.equal(response.status, 410);
      const data = await response.json();
      assert.equal(data.success, false);
      assert.equal(data.user, undefined);
      assert.equal(data.token, undefined);
    }
  });
});
