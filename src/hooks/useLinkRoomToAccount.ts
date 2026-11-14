import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { linkRoomToAccount } from '../api/roomsApi.ts';
import { useAccount } from './useAccount.ts';

/** "userId:CODE" of the rooms already tied to the account during this visit. */
const linked = new Set<string>();

/** For tests: forget what was linked. */
export const resetLinkedRooms = (): void => linked.clear();

/**
 * Inside a room: when the person is signed in, ties their place in the room to the account
 * (once per room), so the session gets into their history. It runs on the room page, not after
 * "Create room" / "Join room", so it also covers a page reload and signing in during the game.
 * A failure is silent - the game must not depend on it - and is tried again on the next visit
 * of the room page.
 *
 * @param code the room code, or null while the room is not loaded
 */
export function useLinkRoomToAccount(code: string | null): void {
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!code || userId === null) return;
    const key = `${userId}:${code.toUpperCase()}`;
    if (linked.has(key)) return;
    linked.add(key);
    linkRoomToAccount(code)
      // the history and the statistics now have one more session to show
      .then(() => queryClient.invalidateQueries({ queryKey: ['account'] }))
      .catch(() => linked.delete(key));
  }, [code, userId, queryClient]);
}
