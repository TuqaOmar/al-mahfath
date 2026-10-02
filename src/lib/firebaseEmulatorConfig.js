// This switch is only for an explicitly selected local test build.
export function resolveFirebaseTarget(env, hostname, productionConfig) {
  if (env.VITE_MA7FATH_EMULATOR !== '1') return { emulator: false, config: productionConfig };
  if (env.MODE !== 'emulator' || env.DEV !== true || !['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Firebase frontend emulators require an explicit local emulator development build');
  }
  return { emulator: true, config: {
    apiKey: 'demo-key', projectId: 'demo-ma7fath-test', appId: 'demo-ma7fath-test-app',
    authDomain: 'localhost', storageBucket: 'demo-ma7fath-test.appspot.com'
  } };
}
