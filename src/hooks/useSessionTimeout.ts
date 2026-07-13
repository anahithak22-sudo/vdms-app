import { useCallback, useEffect, useRef, useState } from 'react';
import { APP } from '@/constants/app';

interface UseSessionTimeoutOptions {
  enabled: boolean;
  onExpire: () => void;
}

interface SessionTimeoutState {
  showWarning: boolean;
  secondsRemaining: number;
  extend: () => void;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

/**
 * Tracks user inactivity and enforces the frozen policy (D-06):
 * automatic logout after 30 minutes of inactivity, with a warning shown
 * 5 minutes before expiry and the option to extend the session.
 */
export function useSessionTimeout({
  enabled,
  onExpire,
}: UseSessionTimeoutOptions): SessionTimeoutState {
  const timeoutMs = APP.sessionTimeoutMinutes * 60_000;
  const warningMs = APP.sessionWarningMinutes * 60_000;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(APP.sessionWarningMinutes * 60);

  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdown = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (expireTimer.current) clearTimeout(expireTimer.current);
    if (countdown.current) clearInterval(countdown.current);
    warnTimer.current = null;
    expireTimer.current = null;
    countdown.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setSecondsRemaining(Math.floor(warningMs / 1000));
    countdown.current = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  }, [warningMs]);

  const schedule = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, timeoutMs - warningMs);

    expireTimer.current = setTimeout(() => {
      clearTimers();
      setShowWarning(false);
      onExpire();
    }, timeoutMs);
  }, [clearTimers, onExpire, startCountdown, timeoutMs, warningMs]);

  const extend = useCallback(() => {
    schedule();
  }, [schedule]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    schedule();

    const onActivity = () => {
      // Ignore activity while the warning is up: the user must explicitly extend.
      if (!showWarning) schedule();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      clearTimers();
    };
    // showWarning intentionally excluded: handled via the guard inside onActivity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, schedule, clearTimers]);

  return { showWarning, secondsRemaining, extend };
}
