import { useQuery } from '@tanstack/react-query';
import { POLL_INTERVAL_MS, queryKeys } from '../api/queryClient.ts';
import { type Room, errorCode, getRoom, isSessionError } from '../api/roomsApi.ts';

export type RoomLoadStatus = 'loading' | 'ready' | 'not-found' | 'unauthorized' | 'error';

const UNAUTHORIZED_CODES = ['NO_SESSION', 'INVALID_TOKEN', 'WRONG_ROOM'];

function getStatus(room: Room | undefined, error: unknown): RoomLoadStatus {
  const code = errorCode(error);
  if (code === 'ROOM_NOT_FOUND') return 'not-found';
  if (code && UNAUTHORIZED_CODES.includes(code)) return 'unauthorized';
  if (room) return 'ready'; // a temporary network error keeps the last known room
  return error ? 'error' : 'loading';
}

/**
 * Loads a room and keeps it up to date: TanStack Query asks the backend again every 3 seconds
 * and stops for good when the person can no longer use the room (expired token, room gone).
 * status: 'loading' | 'ready' | 'not-found' | 'unauthorized' (no or expired token) | 'error'
 * `refresh()` asks the backend right away (e.g. after starting the session) instead of waiting
 * for the next poll.
 */
export function useRoom(code: string) {
  const query = useQuery({
    queryKey: queryKeys.room(code),
    queryFn: () => getRoom(code),
    refetchInterval: ({ state }) => (isSessionError(state.error) ? false : POLL_INTERVAL_MS),
  });

  const status = getStatus(query.data, query.error);
  return {
    code,
    status,
    room: status === 'ready' ? (query.data ?? null) : null,
    refresh: query.refetch,
  };
}
