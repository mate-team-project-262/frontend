import { useEffect, useState } from 'react';
import { getRoom, subscribeToRoom } from '../api/roomsApi.js';

/**
 * Loads a room and keeps it up to date.
 * status: 'loading' | 'ready' | 'not-found' | 'error'
 */
export function useRoom(code) {
  const [state, setState] = useState({ code, status: 'loading', room: null });

  useEffect(() => {
    let isActive = true;
    const update = (next) => isActive && setState({ code, ...next });

    getRoom(code)
      .then((room) => update(room ? { status: 'ready', room } : { status: 'not-found', room: null }))
      .catch(() => update({ status: 'error', room: null }));

    const unsubscribe = subscribeToRoom(code, (room) => update({ status: 'ready', room }));

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [code]);

  // Ignore data that belongs to a previous room code.
  return state.code === code ? state : { code, status: 'loading', room: null };
}
