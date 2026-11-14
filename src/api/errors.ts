import { ApiError } from './http.ts';

/** Where to show the message: the name field, the room link/code, or nowhere special. */
export type ErrorField = 'name' | 'room' | 'email' | 'password' | null;

/**
 * An error whose message is safe to show to the user.
 * `field` says where to show it: 'name' (the name field), 'room' (the room link/code) or null.
 */
export class RoomApiError extends Error {
  /** backend error code (NAME_TAKEN ...) or one of ours: NO_SESSION, NETWORK_ERROR, UNAVAILABLE, UNKNOWN */
  code: string | null;
  field: ErrorField;

  constructor(
    message: string,
    { code = null, field = null }: { code?: string | null; field?: ErrorField } = {},
  ) {
    super(message);
    this.name = 'RoomApiError';
    this.code = code;
    this.field = field;
  }
}

const SESSION_EXPIRED = 'Your session has expired. Please join the room again.';

// Backend error code -> [field, message for the user]
const KNOWN_ERRORS: Record<string, [ErrorField, string]> = {
  NAME_TAKEN: ['name', 'This name is already taken in this room. Please choose another one.'],
  ROOM_FULL: ['room', 'This room is full (up to 5 people).'],
  ROOM_NOT_JOINABLE: ['room', 'This session has already started, so joining is closed.'],
  ROOM_NOT_FOUND: ['room', 'We could not find this room. Check the link and try again.'],
  NOT_ENOUGH_PARTICIPANTS: [null, 'Invite at least one friend to start the session.'],
  NOT_ENOUGH_TITLES: [
    null,
    'We could not find 20 movies for these preferences. Try a new room with more genres or a longer duration.',
  ],
  DECK_SELECTION_LIMIT: [null, 'Picking the movies took too long. Please try again.'],
  TMDB_UNAVAILABLE: [null, 'The movie catalogue is not responding right now. Please try again.'],
  ROOM_ALREADY_STARTED: [null, 'The session has already started.'],
  NOT_HOST: [null, 'Only the host can start the session.'],
  ROOM_NOT_VOTING: [null, 'Voting is not open in this room.'],
  ALREADY_VOTED: [null, 'You have already voted for this movie.'],
  RESULT_NOT_READY: [null, 'The results are not ready yet.'],
  TITLE_NOT_IN_DECK: [null, 'This movie is not part of the session.'],
  INVALID_TOKEN: [null, SESSION_EXPIRED],
  // Account API
  EMAIL_TAKEN: ['email', 'This email is already registered. Sign in instead.'],
  USERNAME_TAKEN: ['name', 'This name is already taken. Please choose another one.'],
  INVALID_CREDENTIALS: [null, 'Wrong name or password. Please try again.'],
  AUTHENTICATION_REQUIRED: [null, 'Please sign in to continue.'],
  PARTICIPANT_ALREADY_LINKED: [null, 'This room is already linked to an account.'],
  HISTORY_NOT_FOUND: [null, 'This session is not in your history.'],
  ACCESS_DENIED: [null, 'The page is out of date. Reload it and try again.'],
  WRONG_ROOM: [null, SESSION_EXPIRED],
};

/** Turns a backend error into a RoomApiError (handled by status and `code`, never by message). */
export function toRoomApiError(error: unknown): unknown {
  if (!(error instanceof ApiError)) return error;

  const known = error.code ? KNOWN_ERRORS[error.code] : undefined;
  if (known) return new RoomApiError(known[1], { code: error.code, field: known[0] });

  if (error.code === 'VALIDATION_ERROR') {
    const has = (name: string) => error.fieldErrors.some(({ field }) => field.endsWith(name));
    if (has('email')) {
      return new RoomApiError('Enter a valid email address', { code: error.code, field: 'email' });
    }
    if (has('password')) {
      return new RoomApiError('Use 8+ characters, including a letter and a number', {
        code: error.code,
        field: 'password',
      });
    }
    const isNameError = has('displayName');
    return new RoomApiError(
      isNameError
        ? 'Please enter a name of 3-20 characters.'
        : 'Please check the form and try again.',
      { code: error.code, field: isNameError ? 'name' : null },
    );
  }
  if (error.status === 0) {
    return new RoomApiError('Could not reach the server. Check your connection and try again.', {
      code: 'NETWORK_ERROR',
    });
  }
  if ([502, 503, 504].includes(error.status)) {
    return new RoomApiError('The server is busy right now. Please try again in a moment.', {
      code: 'UNAVAILABLE',
    });
  }
  return new RoomApiError('Something went wrong. Please try again.', { code: 'UNKNOWN' });
}

/** The backend / our own error code of any thrown value (null when it is not a RoomApiError). */
export const errorCode = (error: unknown): string | null =>
  error instanceof RoomApiError ? error.code : null;

/** A text that is safe to show: the RoomApiError message, otherwise `fallback`. */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof RoomApiError ? error.message : fallback;
