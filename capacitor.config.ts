import { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Read the correct .env file based on the VITE_APP_ENV variable
// Note: We use process.env.VITE_APP_ENV to check if we are building for dev or prod
const envName = process.env.VITE_APP_ENV || 'development';
dotenv.config({ path: resolve(__dirname, `.env.${envName}`) });

const isDev = envName === 'development';

const config: CapacitorConfig = {
  appId: isDev ? 'com.almahfath.app.dev' : 'com.almahfath.app',
  appName: isDev ? 'محفظ AI (Dev)' : 'محفظ AI',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
