import { useEffect, useRef } from 'react';

/**
 * App-style back button for the web, the installed PWA, and the Capacitor
 * Android hardware back (which calls WebView goBack).
 *
 * Anything that should be undone by "back" (an open sheet, menu or dialog, or
 * being on a tab other than home) registers itself while it is active. We keep
 * one extra history entry on top while at least one handler is registered;
 * pressing back consumes that entry and runs the newest handler instead of
 * leaving the page. The URL never changes.
 */
const handlers = [];
let armed = false;

const arm = () => {
  if (armed || typeof window === 'undefined') return;
  // Keep the router's own state (idx/key) so React Router sees no navigation.
  window.history.pushState({ ...(window.history.state || {}), ma7fathBack: true }, '');
  armed = true;
};

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (!armed) return;
    armed = false;
    const top = handlers[handlers.length - 1];
    if (top) {
      top.onBack();
      // Re-arm once React has removed the handler that just ran.
      setTimeout(() => { if (handlers.length) arm(); }, 0);
    } else {
      // Everything was closed from the UI; our spare entry is stale, so let
      // this back press continue to the previous page instead of doing nothing.
      window.history.back();
    }
  });
}

export const useBackHandler = (active, onBack) => {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return undefined;
    const entry = { onBack: () => onBackRef.current?.() };
    handlers.push(entry);
    arm();
    return () => {
      const index = handlers.indexOf(entry);
      if (index !== -1) handlers.splice(index, 1);
    };
  }, [active]);
};
