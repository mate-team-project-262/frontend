import { useQuery } from '@tanstack/react-query';
import { POLL_INTERVAL_MS, queryKeys } from '../api/queryClient.ts';
import { type RoundResults, errorCode, errorMessage, getResults } from '../api/roomsApi.ts';

export interface ResultsState {
  status: 'loading' | 'ready' | 'error';
  results: RoundResults | null;
  error: string;
}

const RETRY_CODES = ['RESULT_NOT_READY', 'NETWORK_ERROR'];

/**
 * Results of the finished round. Right after the last vote the backend may still be counting
 * (RESULT_NOT_READY), so the request is repeated every 3 seconds until they are there. Results
 * of a finished round never change, so they are loaded once.
 */
export function useRoundResults(code: string): ResultsState {
  const query = useQuery({
    queryKey: queryKeys.results(code),
    queryFn: () => getResults(code),
    staleTime: Infinity,
    retry: (_failures, error) => RETRY_CODES.includes(errorCode(error) ?? ''),
    retryDelay: POLL_INTERVAL_MS,
  });

  if (query.data) return { status: 'ready', results: query.data, error: '' };
  if (query.isError) {
    return {
      status: 'error',
      results: null,
      error: errorMessage(query.error, 'Could not load the results.'),
    };
  }
  return { status: 'loading', results: null, error: '' };
}
