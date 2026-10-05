import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Native-feeling Pull-To-Refresh container for mobile & touch interfaces
 * Supports smooth elastic damping, haptic feedback, and visual progress states.
 */
export const PullToRefresh = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 65,
  maxPull = 110,
  id = 'pull-to-refresh-container'
}) => {
  const { lang, isRTL } = useLanguage();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const hasVibratedThreshold = useRef(false);
  const containerRef = useRef(null);
  const refreshLockRef = useRef(false);
  const completionTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(completionTimerRef.current), []);

  // Check if page or container is scrolled to the very top
  const isAtTop = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (windowScrollTop > 3) return false;
    
    if (containerRef.current) {
      const el = containerRef.current;
      return el.scrollTop <= 2;
    }
    return true;
  }, []);

  // Safe haptic feedback helper
  const triggerHaptic = (pattern = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  };

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    if (!isAtTop()) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    startXRef.current = touch.clientX;
    hasVibratedThreshold.current = false;
    setIsPulling(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || isRefreshing || !isPulling) return;
    if (!isAtTop()) {
      if (pullDistance > 0) setPullDistance(0);
      return;
    }

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const currentX = touch.clientX;

    const deltaY = currentY - startYRef.current;
    const deltaX = Math.abs(currentX - startXRef.current);

    // Prevent horizontal swiping (e.g. carousels/tabs) from triggering pull down
    if (deltaX > Math.abs(deltaY) && pullDistance === 0) {
      return;
    }

    if (deltaY > 0) {
      // Elastic log-damped pulling curve
      const damped = Math.min(deltaY * 0.46, maxPull);
      setPullDistance(damped);

      // Give a tactile haptic tick when reaching threshold
      if (damped >= threshold && !hasVibratedThreshold.current) {
        triggerHaptic(18);
        hasVibratedThreshold.current = true;
      } else if (damped < threshold && hasVibratedThreshold.current) {
        hasVibratedThreshold.current = false;
      }

      // Prevent native browser overscroll bounce when user is actively pulling
      if (e.cancelable && damped > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  };

  const executeRefresh = async () => {
    if (refreshLockRef.current || disabled) return;
    refreshLockRef.current = true;
    clearTimeout(completionTimerRef.current);
    setJustCompleted(false);
    setRefreshError('');
    setIsRefreshing(true);
    triggerHaptic([15, 40, 20]);

    try {
      if (typeof onRefresh !== 'function') throw new Error('Refresh is unavailable');
      const result = await onRefresh();
      if (result?.success !== true) throw new Error(result?.message || 'Refresh was not confirmed');
      setJustCompleted(true);
      triggerHaptic(25);
      completionTimerRef.current = setTimeout(() => {
        setJustCompleted(false);
      }, 1200);
    } catch (err) {
      console.error('Error during pull to refresh:', err);
      setJustCompleted(false);
      setRefreshError(lang === 'ar'
        ? 'تعذر تحديث ملف الحساب. بقيت آخر بيانات مؤكدة.'
        : 'Account profile refresh failed. The last confirmed data was kept.');
    } finally {
      refreshLockRef.current = false;
      setIsRefreshing(false);
      setPullDistance(0);
      hasVibratedThreshold.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      executeRefresh();
    } else {
      setPullDistance(0);
      hasVibratedThreshold.current = false;
    }
  };

  // Compute visual offset & rotation
  const isPastThreshold = pullDistance >= threshold;
  const currentHeight = isRefreshing || justCompleted || refreshError ? 54 : pullDistance;
  const rotationAngle = Math.min((pullDistance / threshold) * 360, 360);

  if (disabled) return <div id={id}>{children}</div>;

  return (
    <div
      id={id}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        touchAction: pullDistance > 0 ? 'none' : 'pan-y'
      }}
    >
      {/* Pull To Refresh Dynamic Header Indicator */}
      <div
        id="pull-to-refresh-indicator"
        style={{
          height: `${currentHeight}px`,
          maxHeight: `${maxPull}px`,
          overflow: 'hidden',
          transition: isPulling ? 'none' : 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          pointerEvents: refreshError ? 'auto' : 'none',
          boxSizing: 'border-box'
        }}
      >
        {(pullDistance > 12 || isRefreshing || justCompleted || refreshError) && (
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '24px',
              background: 'var(--bg-surface)',
              border: `1.5px solid ${isPastThreshold || isRefreshing || justCompleted ? 'var(--primary)' : 'var(--glass-border)'}`,
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: isPastThreshold || isRefreshing || justCompleted ? 'var(--primary)' : 'var(--text-secondary)',
              transform: `scale(${Math.min(0.85 + (pullDistance / threshold) * 0.15, 1.05)})`,
              transition: 'transform 0.15s ease, border-color 0.2s ease, color 0.2s ease',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            {refreshError ? (
              <>
                <AlertCircle size={16} color="#EF4444" />
                <span role="alert" data-testid="pull-refresh-error">{refreshError}</span>
                <button type="button" data-testid="pull-refresh-retry" onClick={executeRefresh}>
                  {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </>
            ) : justCompleted ? (
              <>
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
                <span data-testid="pull-refresh-success">{lang === 'ar' ? 'تم تحديث ملف الحساب من Firestore' : 'Account profile refreshed from Firestore'}</span>
              </>
            ) : isRefreshing ? (
              <>
                <RefreshCw
                  size={16}
                  color="var(--primary)"
                  style={{
                    animation: 'spin 0.75s linear infinite'
                  }}
                />
                <span>{lang === 'ar' ? 'جاري قراءة ملف الحساب من Firestore...' : 'Reading the account profile from Firestore...'}</span>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isPastThreshold ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <RefreshCw
                    size={14}
                    color={isPastThreshold ? 'var(--primary)' : 'var(--text-secondary)'}
                    style={{
                      transform: `rotate(${rotationAngle}deg)`,
                      transition: isPulling ? 'none' : 'transform 0.2s ease'
                    }}
                  />
                </div>
                <span>
                  {isPastThreshold
                    ? (lang === 'ar' ? 'أفلت لتحديث ملف الحساب' : 'Release to refresh account profile')
                    : (lang === 'ar' ? 'اسحب للأسفل لتحديث ملف الحساب...' : 'Pull down to refresh account profile...')}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          transform: `translateY(${pullDistance > 0 && !isRefreshing ? pullDistance * 0.15 : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
