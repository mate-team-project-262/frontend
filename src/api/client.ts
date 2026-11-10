/**
 * Shared helpers of the API modules: backend errors become RoomApiError (safe to show), and the
 * person's saved pass (token) for a room is required for most calls.
 */
import { RoomApiError, toRoomApiError } from './errors.ts';
import { type RequestOptions, apiRequest } from './http.ts';
import { type RoomSession, getRoomSession } from './roomSession.ts';

/** The pass is missing, expired or belongs to another room: the person must join again. */
export const SESSION_ERROR_CODES: readonly (string | null)[] = [
  'INVALID_TOKEN',
  'WRONG_ROOM',
  'ROOM_NOT_FOUND',
  'NO_SESSION',
];
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please join the room again.';

export const encode = encodeURIComponent;

/** apiRequest that throws RoomApiError (user-safe message + backend code). */
export async function call<T>(path: string, options?: RequestOptions): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    throw toRoomApiError(error);
  }
}

/** The saved pass for this room, or NO_SESSION. */
export function requireSession(code: string): RoomSession {
  const session = getRoomSession(code);
  if (!session) throw new RoomApiError(SESSION_EXPIRED_MESSAGE, { code: 'NO_SESSION' });
  return session;
}

/** True when the error means "this person cannot use this room any more". */
export const isSessionError = (error: unknown): boolean =>
  error instanceof RoomApiError && SESSION_ERROR_CODES.includes(error.code);
