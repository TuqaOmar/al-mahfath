import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, cpSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = process.cwd();
const browserTest = process.argv.includes('--browser');
const mobileOnly = process.argv.includes('--mobile-only');
const runDir = mkdtempSync(path.join(tmpdir(), 'ma7fath-emulator-run-'));
const emulatorCache = path.join(tmpdir(), 'ma7fath-emulator-cache');
mkdirSync(emulatorCache, { recursive: true });
if (existsSync(path.join(root, '.tools', 'emulators'))) {
  cpSync(path.join(root, '.tools', 'emulators'), emulatorCache, { recursive: true });
}
const config = JSON.parse(readFileSync(path.join(root, 'firebase.emulator.json'), 'utf8'));
const rulesPath = path.join(runDir, 'firestore.rules');
writeFileSync(rulesPath, readFileSync(path.join(root, 'firestore.rules')));
config.firestore.rules = rulesPath;
const storageRulesPath = path.join(runDir, 'storage.rules');
writeFileSync(storageRulesPath, readFileSync(path.join(root, 'storage.rules')));
config.storage.rules = storageRulesPath;
const configPath = path.join(runDir, 'firebase.json');
writeFileSync(configPath, JSON.stringify(config));
const javaRoot = path.join(root, '.tools', 'java');
const javaDir = existsSync(javaRoot) && readdirSync(javaRoot).find(name => name.startsWith('jdk-21'));
const env = {
  ...process.env, NODE_ENV: 'test', MA7FATH_EMULATOR_TEST: '1',
  GCLOUD_PROJECT: 'demo-ma7fath-test', GOOGLE_CLOUD_PROJECT: 'demo-ma7fath-test',
  GCE_METADATA_HOST: '127.0.0.1:9',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_EMULATORS_PATH: emulatorCache,
  // Do not read or reuse a developer's Firebase CLI login/configuration.
  XDG_CONFIG_HOME: path.join(runDir, 'cli-config'),
  MA7FATH_EMULATOR_RESULT: path.join(runDir, 'completed')
};
if (browserTest) env.VITE_MA7FATH_EMULATOR = '1';
if (mobileOnly) env.MA7FATH_MOBILE_LAYOUT_ONLY = '1';
delete env.FIREBASE_SERVICE_ACCOUNT_JSON;
delete env.GOOGLE_APPLICATION_CREDENTIALS;
delete env.FIREBASE_TOKEN;
delete env.DEBUG;
if (javaDir) {
  // The Windows Java launcher fails to load java.dll from some Unicode paths.
  const asciiJavaRoot = path.join(tmpdir(), 'ma7fath-jdk21', javaDir);
  if (!existsSync(path.join(asciiJavaRoot, 'bin', 'java.exe'))) {
    mkdirSync(path.dirname(asciiJavaRoot), { recursive: true });
    cpSync(path.join(javaRoot, javaDir), asciiJavaRoot, { recursive: true });
  }
  env.JAVA_HOME = asciiJavaRoot;
  env.PATH = path.join(asciiJavaRoot, 'bin') + path.delimiter + env.PATH;
}
const standalone = path.join(root, '.tools', 'firebase.exe');
const localCli = path.join(root, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
const cachedCli = path.join(process.env.USERPROFILE || '', '.cache', 'firebase', 'tools', 'lib', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
const cliJs = existsSync(localCli) ? localCli : cachedCli;
const command = existsSync(cliJs) ? process.execPath : standalone;
const testNamePattern = mobileOnly
  ? '--test-name-pattern "emulator configuration fails closed|production server initialization rejects emulator hosts|frontend emulator switch requires local emulator mode|Chrome mobile navigation, theme persistence, and viewport fit|multi-role account can open both home pages and Quran map uses a wide laptop layout"'
  : '';
const args = [
  ...(existsSync(cliJs) ? [cliJs] : []),
  'emulators:exec', '--project', env.GCLOUD_PROJECT, '--config', configPath,
  '--only', browserTest ? 'auth,firestore,storage' : 'auth,firestore', `"${process.execPath}" --test ${testNamePattern} "${path.join(root, 'tests', 'emulator-safety.test.js')}" "${path.join(root, 'tests', browserTest ? 'firebase-browser.test.js' : 'firebase-emulator.test.js')}"`
];
if (!existsSync(command)) throw new Error('Install firebase-tools locally or download .tools/firebase.exe');
const result = spawnSync(command, args, { env, stdio: 'inherit' });
if (result.error) throw result.error;
const completed = existsSync(env.MA7FATH_EMULATOR_RESULT);
rmSync(runDir, { recursive: true, force: true });
if (!completed) console.error('Emulator tests did not finish; CLI exit status alone is not evidence of success.');
process.exit(completed ? (result.status ?? 1) : 1);
