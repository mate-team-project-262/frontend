/**
 * "Save and build my profile" on the results page sends a guest to sign up / sign in. The room
 * they just played must then be tied to the new account (POST /me/participants/link), but that
 * normally happens on the room page only. So the room code waits here (this tab only) until the
 * account exists; SignUpPage and SignInPage link it and only then open the dashboard.
 */
const KEY = 'w2w:save-room';
/** a code older than this is not "the game I just played" any more */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function rememberRoomToSave(code: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    // no storage: the room page still links the game the next time it is opened
  }
}

export function getRoomToSave(): string | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as {
      code?: string;
      at?: number;
    } | null;
    if (!saved?.code || !saved.at || Date.now() - saved.at > MAX_AGE_MS) return null;
    return saved.code;
  } catch {
    return null;
  }
}

export function forgetRoomToSave(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to forget
  }
}
