import { useEffect, useRef } from 'react';
import { useBackHandler } from './useBackHandler';

/**
 * Closes an open dialog or menu with Escape and with the phone/browser back button.
 * `onClose` may change every render; the latest one is used.
 */
export const useDialogDismiss = (active, onClose) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useBackHandler(active, () => onCloseRef.current());

  useEffect(() => {
    if (!active) return undefined;
    const handleEscape = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [active]);
};
