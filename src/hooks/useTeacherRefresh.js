import { useEffect } from 'react';

// Re-check server scope on return to the tab and while a teacher view stays
// open. Every load must clear stale data on errors; refresh is not authorization.
export function useTeacherRefresh(load, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const refresh = () => { if (!document.hidden) load(); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [load, enabled]);
}
