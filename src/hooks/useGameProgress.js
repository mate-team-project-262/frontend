import { useEffect, useState } from 'react';
import { getProgress } from '../api/roomsApi.js';

const POLL_INTERVAL_MS = 3000;

/**
 * Voting progress of the whole room (GET /rooms/{code}/progress), asked again every 3 seconds
 * while `enabled`. Temporary errors keep the last known progress.
 *
 * @returns {import('../api/roomsApi.js').GameProgress | null}
 */
export function useGameProgress(code, enabled) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let isActive = true;
    let timer;

    const poll = async () => {
      try {
        const next = await getProgress(code);
        if (isActive) setProgress(next);
      } catch {
        // keep the last progress; the room page itself reports a lost room
      }
      if (isActive) timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [code, enabled]);

  return progress;
}
