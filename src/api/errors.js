import { ApiError } from './http.js';

/**
 * An error whose message is safe to show to the user.
 * `field` says where to show it: 'name' (the name field), 'room' (the room link/code) or null.
 */
export class RoomApiError extends Error {
  constructor(message, { code = null, field = null } = {}) {
    super(message);
    this.name = 'RoomApiError';
    this.code = code;
    this.field = field;
  }
}

const SESSION_EXPIRED = 'Your session has expired. Please join the room again.';

// Backend error code -> [field, message for the user]
const KNOWN_ERRORS = {
  NAME_TAKEN: ['name', 'This name is already taken in this room. Please choose another one.'],
  ROOM_FULL: ['room', 'This room is full (up to 5 people).'],
  ROOM_NOT_JOINABLE: ['room', 'This session has already started, so joining is closed.'],
  ROOM_NOT_FOUND: ['room', 'We could not find this room. Check the link and try again.'],
  INVALID_TOKEN: [null, SESSION_EXPIRED],
  WRONG_ROOM: [null, SESSION_EXPIRED],
};

/** Turns a backend error into a RoomApiError (handled by status and `code`, never by message). */
export function toRoomApiError(error) {
  if (!(error instanceof ApiError)) return error;

  const known = KNOWN_ERRORS[error.code];
  if (known) return new RoomApiError(known[1], { code: error.code, field: known[0] });

  if (error.code === 'VALIDATION_ERROR') {
    const isNameError = error.fieldErrors.some(({ field }) => field.endsWith('displayName'));
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
