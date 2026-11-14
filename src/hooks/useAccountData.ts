import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient.ts';
import { getMovieIdentity, getSessionDetails, getSessionHistory } from '../api/roomsApi.ts';

/** One page of the account's finished sessions, newest first (GET /me/history). */
export function useSessionHistory(page = 0, size = 10) {
  return useQuery({
    queryKey: queryKeys.history(page, size),
    queryFn: () => getSessionHistory(page, size),
  });
}

/**
 * The full list of sessions for the Sessions page: the first page at once, the next ones on
 * "Show more" (`fetchNextPage`).
 */
export function useSessionList(size = 10) {
  return useInfiniteQuery({
    queryKey: queryKeys.historyList(size),
    queryFn: ({ pageParam }) => getSessionHistory(pageParam, size),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

/** One finished session (GET /me/history/{sessionId}); `sessionId` null = nothing to load. */
export function useSessionDetails(sessionId: number | null) {
  return useQuery({
    queryKey: queryKeys.sessionDetails(sessionId ?? 0),
    queryFn: () => getSessionDetails(sessionId as number),
    enabled: sessionId !== null,
  });
}

/** The account's taste statistics (GET /me/movie-identity). */
export function useMovieIdentity() {
  return useQuery({ queryKey: queryKeys.movieIdentity, queryFn: getMovieIdentity });
}
