import { useCallback, useState } from 'react';

/**
 * Watches the room's host. When another person becomes the host (the old one left), returns a
 * notice for the "info toast": { title, text }. Works with the real room data only - the backend
 * passes the host role on when the host leaves.
 *
 * @param {import('../api/roomsApi.js').Room | null} room
 * @returns {[{ title: string, text: string } | null, () => void]}  the notice and "dismiss"
 */
export function useHostChange(room) {
  const host = room?.participants.find((person) => person.isHost) ?? null;
  const hostId = host?.id ?? null;
  const [seen, setSeen] = useState({ hostId, names: {} });
  const [notice, setNotice] = useState(null);

  // Derived state: compare with the host we saw last time (allowed during render).
  if (hostId !== seen.hostId) {
    const names = Object.fromEntries((room?.participants ?? []).map((person) => [person.id, person.name]));
    if (seen.hostId !== null && host) {
      const oldHostLeft = !(seen.hostId in names);
      const oldName = seen.names[seen.hostId];
      setNotice({
        title: host.isMe ? 'You are now the host' : `${host.name} is now the host`,
        text: oldHostLeft && oldName ? `${oldName} left the room. The voting continues` : 'The voting continues',
      });
    }
    setSeen({ hostId, names });
  } else if (room) {
    // keep the names up to date, so we know the old host's name when they leave
    const key = room.participants.map((person) => `${person.id}:${person.name}`).join();
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
