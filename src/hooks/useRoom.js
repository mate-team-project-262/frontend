import { useCallback, useEffect, useState } from 'react';
import { getRoom, subscribeToRoom } from '../api/roomsApi.js';

const SESSION_ERROR_CODES = ['NO_SESSION', 'INVALID_TOKEN', 'WRONG_ROOM'];

function getFailureStatus(error) {
  if (error.code === 'ROOM_NOT_FOUND') return 'not-found';
  if (SESSION_ERROR_CODES.includes(error.code)) return 'unauthorized';
  return 'error';
}

/**
 * Loads a room and keeps it up to date (the API polls the backend every few seconds).
 * status: 'loading' | 'ready' | 'not-found' | 'unauthorized' (no or expired token) | 'error'
 * `refresh()` asks the backend right away (e.g. after starting the session) instead of waiting
 * for the next poll.
 */
export function useRoom(code) {
  const [state, setState] = useState({ code, status: 'loading', room: null });

  const refresh = useCallback(
    () =>
      getRoom(code)
        .then((room) => setState({ code, status: 'ready', room }))
        .catch(() => {
          // The regular polling reports lasting problems; a failed extra request changes nothing.
        }),
    [code],
  );

  useEffect(() => {
    let isActive = true;
    const update = (next) => isActive && setState({ code, ...next });
    const fail = (error) => update({ status: getFailureStatus(error), room: null });

    getRoom(code)
      .then((room) => update({ status: 'ready', room }))
      .catch(fail);
    const unsubscribe = subscribeToRoom(code, (room) => update({ status: 'ready', room }), fail);

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [code]);

  // Ignore data that belongs to a previous room code.
  return state.code === code ? { ...state, refresh } : { code, status: 'loading', room: null, refresh };
}
