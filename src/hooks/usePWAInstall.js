import { useState, useEffect } from 'react';

// Chrome fires `beforeinstallprompt` once, early — usually while the visitor is
// still on the landing page, before any install button has mounted. Capture it
// at module load (main.jsx imports this file first) and share it with every
// button, so the prompt isn't lost when the user moves between screens.
let deferredPrompt = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach(listener => listener());

if (typeof window !== 'undefined') {
  installed =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

export function usePWAInstall() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender(count => count + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';

  const install = async () => {
    if (!deferredPrompt) return false;
    const promptEvent = deferredPrompt;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') installed = true;
    notify();
    return outcome === 'accepted';
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled: installed,
    isIOS: /iphone|ipad|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    install,
  };
}
