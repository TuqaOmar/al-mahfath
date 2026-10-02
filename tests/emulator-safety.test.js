import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmulatorEnvironment } from '../server/emulatorSafety.js';
import { spawnSync } from 'node:child_process';
import { resolveFirebaseTarget } from '../src/lib/firebaseEmulatorConfig.js';

const safe = {
  NODE_ENV: 'test', MA7FATH_EMULATOR_TEST: '1', GCLOUD_PROJECT: 'demo-ma7fath-test',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080'
};
test('emulator configuration fails closed outside isolated tests', () => {
  assert.equal(validateEmulatorEnvironment({ NODE_ENV: 'production' }), false);
  assert.equal(validateEmulatorEnvironment(safe), true);
  for (const change of [
    { NODE_ENV: 'production' }, { NODE_ENV: 'development' }, { MA7FATH_EMULATOR_TEST: '' },
    { GCLOUD_PROJECT: 'production-project' }, { FIRESTORE_EMULATOR_HOST: '' },
    { FIREBASE_AUTH_EMULATOR_HOST: 'remote.example:9099' }
  ]) assert.throws(() => validateEmulatorEnvironment({ ...safe, ...change }));
});

test('production server initialization rejects emulator hosts', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./server/middleware/auth.js')"], {
    cwd: process.cwd(), env: { ...process.env, ...safe, NODE_ENV: 'production' }, encoding: 'utf8'
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Firebase emulators require explicit test mode/);
});

test('frontend emulator switch requires local emulator mode and excludes production config', () => {
  const production = { projectId: 'production-project', firestoreDatabaseId: 'named-production-db' };
  const env = { MODE: 'emulator', DEV: true, VITE_MA7FATH_EMULATOR: '1' };
  const target = resolveFirebaseTarget(env, '127.0.0.1', production);
  assert.equal(target.config.projectId, 'demo-ma7fath-test');
  assert.equal(target.config.firestoreDatabaseId, undefined);
  assert.equal(resolveFirebaseTarget({}, '127.0.0.1', production).config, production);
  for (const change of [{ MODE: 'production', DEV: false }, { MODE: 'development' }]) {
    assert.throws(() => resolveFirebaseTarget({ ...env, ...change }, '127.0.0.1', production));
  }
  assert.throws(() => resolveFirebaseTarget(env, 'example.com', production));
});
