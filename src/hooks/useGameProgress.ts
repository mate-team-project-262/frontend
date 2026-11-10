import { useQuery } from '@tanstack/react-query';
import { POLL_INTERVAL_MS, queryKeys } from '../api/queryClient.ts';
import { type GameProgress, getProgress } from '../api/roomsApi.ts';

/**
 * Voting progress of the whole room (GET /rooms/{code}/progress), asked again every 3 seconds
 * while `enabled`. Temporary errors keep the last known progress.
 */
export function useGameProgress(code: string, enabled: boolean): GameProgress | null {
  const { data } = useQuery({
    queryKey: queryKeys.progress(code),
    queryFn: () => getProgress(code),
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
  });
  return data ?? null;
}
