import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { setAnalyticsUserType } from '../analytics/analytics.ts';
import { queryKeys } from '../api/queryClient.ts';
import { type User, getCurrentUser } from '../api/roomsApi.ts';

export type AccountStatus = 'loading' | 'guest' | 'signed-in';

/**
 * The account of the person in this browser. The session is a cookie, so after a reload the app
 * asks the backend who is signed in (GET /me). `setUser` is called by the sign-in, sign-up and
 * sign-out forms with the answer they got, so no extra request is needed.
 * While the answer is not known yet (or the server cannot be reached) the status is 'loading'
 * and then 'guest': the public pages keep working either way.
 */
export function useAccount() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: Infinity, // one answer for the whole visit, shared by every page
  });

  const user: User | null = query.data ?? null;
  const status: AccountStatus = query.isPending ? 'loading' : user ? 'signed-in' : 'guest';

  useEffect(() => {
    if (status !== 'loading') setAnalyticsUserType(user ? 'registered' : 'guest');
  }, [status, user]);

  const setUser = useCallback(
    (next: User | null) => queryClient.setQueryData(queryKeys.me, next),
    [queryClient],
  );

  return { status, user, setUser };
}
