export function validateEmulatorEnvironment(env = process.env) {
  const hosts = [env.FIREBASE_AUTH_EMULATOR_HOST, env.FIRESTORE_EMULATOR_HOST];
  if (!hosts.some(Boolean)) return false;
  if (env.NODE_ENV !== 'test' || env.MA7FATH_EMULATOR_TEST !== '1' ||
      !/^demo-[a-z0-9-]+$/.test(env.GCLOUD_PROJECT || '') ||
      hosts.some(host => !/^(127\.0\.0\.1|localhost):\d+$/.test(host || ''))) {
    throw new Error('Firebase emulators require explicit test mode, a demo project, and both loopback hosts');
  }
  return true;
}
