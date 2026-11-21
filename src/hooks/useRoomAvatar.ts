import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getRoomAvatar } from '../api/roomsApi.ts';
import { queryKeys } from '../api/queryClient.ts';

/** a photo stays cached while the room is open; a new photo has a new path (?v=) */
const KEEP_MS = 60 * 60 * 1000;

/**
 * A room participant's photo, ready for `<img src>` (an object URL), or null while it loads, for
 * guests and when it cannot be loaded (then the letter is shown).
 *
 * The room is polled every 3 seconds; the photo is fetched once per path (TanStack Query keeps the
 * Blob) and every mounted avatar makes its own object URL and revokes it when it goes away.
 */
export function useRoomAvatar(code: string, path: string | null): string | null {
  const { data: blob } = useQuery({
    queryKey: queryKeys.roomAvatar(code, path ?? ''),
    queryFn: () => getRoomAvatar(code, path!),
    enabled: Boolean(path),
    staleTime: KEEP_MS,
    gcTime: KEEP_MS,
  });
  const [shown, setShown] = useState<{ blob: Blob; url: string } | null>(null);

  // An object URL is a resource outside React: it is made here and freed when the photo changes
  // or the avatar goes away (StrictMode's second mount simply makes a new one).
  useEffect(() => {
    if (!blob || typeof URL.createObjectURL !== 'function') return undefined;
    const url = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the object URL above
    setShown({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  // a URL made for an older Blob is never shown
  return path && blob && shown?.blob === blob ? shown.url : null;
}
