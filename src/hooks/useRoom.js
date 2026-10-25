import { useCallback, useEffect, useState } from 'react';
import { getRoom, subscribeToRoom } from '../api/roomsApi.js';

/**
 * Loads a room and keeps it up to date.
 * status: 'loading' | 'ready' | 'not-found' | 'error'
 * `refresh()` loads the room again (e.g. right after the user joined it).
 */
export function useRoom(code) {
  const [state, setState] = useState({ code, status: 'loading', room: null });
  const [reloadCount, setReloadCount] = useState(0);

  const refresh = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    let isActive = true;
    const update = (next) => isActive && setState({ code, ...next });

    getRoom(code)
      .then((room) =>
        update(room ? { status: 'ready', room } : { status: 'not-found', room: null }),
      )
      .catch(() => update({ status: 'error', room: null }));

    const unsubscribe = subscribeToRoom(code, (room) =>
      update(room ? { status: 'ready', room } : { status: 'not-found', room: null }),
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [code, reloadCount]);

  // Ignore data that belongs to a previous room code.
  const current = state.code === code ? state : { code, status: 'loading', room: null };
  return { ...current, refresh };
}
