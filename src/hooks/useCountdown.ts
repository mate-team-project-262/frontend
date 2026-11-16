import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds left until something is allowed again (e.g. "Resend email"). `start(60)` begins the
 * count; it stops by itself at 0.
 */
export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const start = useCallback((seconds: number) => setSecondsLeft(Math.max(0, seconds)), []);

  return { secondsLeft, start };
}

/** 75 -> "1:15", 9 -> "0:09". */
export const formatCountdown = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
