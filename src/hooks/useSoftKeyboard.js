import { useEffect, useState } from 'react';

const NON_TEXT_INPUTS = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'];

const isTextField = (el) => {
  if (!el || !el.tagName) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && !NON_TEXT_INPUTS.includes((el.type || 'text').toLowerCase());
};

/**
 * True while the on-screen keyboard is (very likely) open on a touch device.
 * On touch devices the keyboard is up exactly while a text field has focus
 * (viewport height is not used: rotation would look like a keyboard).
 * Also scrolls the focused field into view if the keyboard covers it.
 */
export const useSoftKeyboard = (enabled = true) => {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    if (!coarse) return undefined;

    let revealTimer;
    const onFocusIn = (event) => {
      if (!isTextField(event.target)) return;
      setFocused(true);
      clearTimeout(revealTimer);
      // Wait for the keyboard animation, then bring the field into view if it is covered.
      revealTimer = setTimeout(() => {
        const rect = event.target.getBoundingClientRect?.();
        const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
        if (rect && (rect.bottom > visibleHeight - 12 || rect.top < 0)) {
          event.target.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        }
      }, 320);
    };
    const onFocusOut = () => {
      // The next focused element (if any) arrives in a following focusin.
      setTimeout(() => setFocused(isTextField(document.activeElement)), 0);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      clearTimeout(revealTimer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [enabled]);

  return focused;
};
