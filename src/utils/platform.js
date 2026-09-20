import { Capacitor } from '@capacitor/core';

/**
 * Checks if the app is running in a native mobile container (Capacitor Android/iOS)
 * or as an installed standalone PWA on mobile.
 */
export const isNativeMobile = () => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

export const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

export const isMobileEnvironment = () => {
  return isNativeMobile() || isStandalonePWA();
};

export const getPlatform = () => {
  return Capacitor.getPlatform(); // 'android', 'ios', or 'web'
};
