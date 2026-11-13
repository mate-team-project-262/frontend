import { QueryClient } from '@tanstack/react-query';

/** The backend has no WebSocket, so live data is asked again every ~3 seconds (as it asks). */
export const POLL_INTERVAL_MS = 3000;

/** One cache key per backend resource of a room. */
export const queryKeys = {
  room: (code: string) => ['room', code] as const,
  deck: (code: string) => ['room', code, 'deck'] as const,
  progress: (code: string) => ['room', code, 'progress'] as const,
  results: (code: string) => ['room', code, 'results'] as const,
  /** the signed-in account (or null for a guest) */
  me: ['me'] as const,
  /** the account's finished sessions, newest first */
  history: (page: number, size: number) => ['account', 'history', page, size] as const,
  /** the whole list of sessions, loaded page by page */
  historyList: (size: number) => ['account', 'history', 'list', size] as const,
  sessionDetails: (sessionId: number) => ['account', 'session', sessionId] as const,
  movieIdentity: ['account', 'movie-identity'] as const,
};

/**
 * Shared settings:
 *  - no automatic retries: each hook decides what is worth asking again;
 *  - no refetch when the window gets focus: the polled resources refresh themselves anyway;
 *  - nothing is kept after the page that used it is closed (gcTime 0): room data belongs to one
 *    person's pass, so after leaving / joining again it must come from the backend, never the cache.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 },
    },
  });
