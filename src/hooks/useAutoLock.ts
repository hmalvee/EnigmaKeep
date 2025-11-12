import { useEffect, useRef } from 'react';

export function useAutoLock(onLock: () => void, isLocked: boolean, timeout: number = 5 * 60 * 1000) {
  const timeoutRef = useRef<number>();

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLocked) {
      timeoutRef.current = window.setTimeout(() => {
        onLock();
      }, timeout);
    }
  };

  useEffect(() => {
    if (isLocked) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onLock();
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
  }, [isLocked, onLock]);

  return resetTimer;
}
