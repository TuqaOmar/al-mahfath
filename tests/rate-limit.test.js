import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../server/middleware/rateLimit.js';

function call(middleware, req) {
  let status = 200; let nextCalled = false; const headers = {};
  const res = { status(code) { status = code; return this; }, json() { return this; }, set(k, v) { headers[k] = v; } };
  middleware(req, res, () => { nextCalled = true; });
  return { status, nextCalled, headers };
}

test('rate limit blocks a user after max requests and keeps users separate', () => {
  const limit = rateLimit({ windowMs: 60_000, max: 3, name: 't' });
  for (let i = 0; i < 3; i++) assert.equal(call(limit, { user: { uid: 'a' } }).nextCalled, true);
  const blocked = call(limit, { user: { uid: 'a' } });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.nextCalled, false);
  assert.ok(Number(blocked.headers['Retry-After']) > 0);
  assert.equal(call(limit, { user: { uid: 'b' } }).nextCalled, true);
  assert.equal(call(limit, { ip: '1.2.3.4' }).nextCalled, true);
});
