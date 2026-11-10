/**
 * The person's own pass into a room: the token from the backend plus their participant id.
 * Kept in sessionStorage - one pass per browser tab, kept on reload, gone when the tab is closed.
 * (Tokens expire after 24 hours; never show or share them.)
 */
export interface RoomSession {
  token: string;
  participantId: number;
}

const key = (code: string) => `room-session:${String(code).toUpperCase()}`; // codes are case-insensitive
const memory = new Map<string, RoomSession>(); // fallback when sessionStorage is unavailable

export function getRoomSession(code: string): RoomSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(key(code)) ?? 'null');
  } catch {
    return memory.get(key(code)) ?? null;
  }
}

export function saveRoomSession(code: string, session: RoomSession): void {
  memory.set(key(code), session);
  try {
    sessionStorage.setItem(key(code), JSON.stringify(session));
  } catch {
    // Kept in memory only: lost on reload.
  }
}

export function clearRoomSession(code: string): void {
  memory.delete(key(code));
  try {
    sessionStorage.removeItem(key(code));
  } catch {
    // Nothing to clear.
  }
}
