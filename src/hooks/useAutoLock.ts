import { useEffect, useRef } from 'react';

export interface AutoLockOptions {
  idleTimeout?: number;
  /** Lock when the tab becomes hidden (minimize / switch apps). Default false. */
  lockOnHide?: boolean;
}

export function useAutoLock(
  onLock: () => void,
  isLocked: boolean,
  options: AutoLockOptions | number = {}
) {
  // Back-compat: third arg used to be a bare timeout number.
  const opts: AutoLockOptions =
    typeof options === 'number' ? { idleTimeout: options } : options;

  const idleTimeout = opts.idleTimeout ?? 5 * 60 * 1000;
  const lockOnHide = opts.lockOnHide ?? false;
  const timeoutRef = useRef<number>();
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLocked && idleTimeout > 0) {
      timeoutRef.current = window.setTimeout(() => {
        onLockRef.current();
      }, idleTimeout);
    }
  };

  useEffect(() => {
    if (isLocked) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.hidden && lockOnHide) {
        onLockRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, idleTimeout, lockOnHide]);

  return resetTimer;
}
