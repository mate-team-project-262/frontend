import { useCallback, useState } from 'react';
import type { Room } from '../api/roomsApi.ts';

export interface HostNotice {
  title: string;
  text: string;
}

interface Seen {
  hostId: number | null;
  key: string;
  names: Record<number, string>;
}

const participantsKey = (room: Room | null) =>
  (room?.participants ?? []).map((person) => `${person.id}:${person.name}`).join();

/**
 * Watches the room's host. When another person becomes the host (the old one left), returns a
 * notice for the "info toast": { title, text }. Works with the real room data only - the backend
 * passes the host role on when the host leaves.
 * Returns the notice and "dismiss".
 */
export function useHostChange(room: Room | null): [HostNotice | null, () => void] {
  const host = room?.participants.find((person) => person.isHost) ?? null;
  const hostId = host?.id ?? null;
  const [seen, setSeen] = useState<Seen>({ hostId, key: '', names: {} });
  const [notice, setNotice] = useState<HostNotice | null>(null);

  // Derived state: compare with the host we saw last time (allowed during render).
  if (hostId !== seen.hostId) {
    const names: Record<number, string> = Object.fromEntries(
      (room?.participants ?? []).map((person) => [person.id, person.name]),
    );
    if (seen.hostId !== null && host) {
      const oldHostLeft = !(seen.hostId in names);
      const oldName = seen.names[seen.hostId];
      setNotice({
        title: host.isMe ? 'You are now the host' : `${host.name} is now the host`,
        text:
          oldHostLeft && oldName
            ? `${oldName} left the room. The voting continues`
            : 'The voting continues',
      });
    }
    setSeen({ hostId, key: participantsKey(room), names });
  } else if (room) {
    // keep the names up to date, so we know the old host's name when they leave
    const key = participantsKey(room);
    if (key !== seen.key) {
      setSeen({
        hostId,
        key,
        names: Object.fromEntries(room.participants.map((person) => [person.id, person.name])),
      });
    }
  }

  const dismiss = useCallback(() => setNotice(null), []);
  return [notice, dismiss];
}
