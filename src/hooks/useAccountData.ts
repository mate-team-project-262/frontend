import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient.ts';
import { getMovieIdentity, getSessionHistory } from '../api/roomsApi.ts';

/** One page of the account's finished sessions, newest first (GET /me/history). */
export function useSessionHistory(page = 0, size = 10) {
  return useQuery({
    queryKey: queryKeys.history(page, size),
    queryFn: () => getSessionHistory(page, size),
  });
}

/** The account's taste statistics (GET /me/movie-identity). */
export function useMovieIdentity() {
  return useQuery({ queryKey: queryKeys.movieIdentity, queryFn: getMovieIdentity });
}
