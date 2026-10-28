/**
 * Rooms API - talks to the backend (see docs: POST /rooms, POST /rooms/{code}/join,
 * GET /rooms/{code}). The pages only use the functions below and the `Room` shape; the backend
 * details (field names, enum values, tokens) stay in this file.
 *
 * Not available on the backend yet (kept as stubs): starting a session, leaving a room.
 */
import { RoomApiError, toRoomApiError } from './errors.js';
import { apiRequest } from './http.js';
import { clearRoomSession, getRoomSession, saveRoomSession } from './roomSession.js';

export { RoomApiError };

/**
 * @typedef {Object} CreateRoomPayload
 * @property {string} hostName                      3-20 characters
 * @property {'MOVIES' | 'TV_SERIES'} contentType
 * @property {number[]} genreIds                    Backend genre ids for the content type. Empty = any
 * @property {number | null} maxDurationMin         30-150 minutes, null = no limit
 */

/**
 * @typedef {Object} Participant
 * @property {number} id
 * @property {string} name
 * @property {boolean} isHost
 * @property {boolean} isMe    true for the person who is looking at the page
 */

/**
 * @typedef {Object} RoomPreferences
 * @property {'MOVIES' | 'TV_SERIES'} contentType
 * @property {number[]} genreIds
 * @property {number | null} maxDurationMin
 */

/**
 * @typedef {Object} Room
 * @property {string} code
 * @property {'LOBBY' | 'VOTING' | 'FINISHED'} status
 * @property {Participant[]} participants     Everyone in the room, host included, ordered by id
 * @property {RoomPreferences} preferences
 * @property {number} maxParticipants
 */

const POLL_INTERVAL_MS = 3000; // the backend has no WebSocket, it asks to poll every ~3 seconds
const SESSION_ERROR_CODES = ['INVALID_TOKEN', 'WRONG_ROOM', 'ROOM_NOT_FOUND', 'NO_SESSION'];

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please join the room again.';
const encode = encodeURIComponent;

async function call(path, options) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    throw toRoomApiError(error);
  }
}

/** Backend lobby response -> the shape the pages use. */
function toRoom(data, session) {
  const preferences = data.preferences ?? {};
  return {
    code: data.code,
    status: data.status,
    maxParticipants: data.maxParticipants,
    preferences: {
      contentType: preferences.contentType,
      genreIds: preferences.genreIds ?? [],
      maxDurationMin: preferences.maxDurationMinutes ?? null,
    },
    participants: data.participants.map((person) => ({
      id: person.id,
      name: person.displayName,
      isHost: person.host,
      isMe: person.id === session.participantId,
    })),
  };
}

/**
 * Creates a room; the caller becomes its host and gets a token (kept in sessionStorage).
 * POST /rooms
 *
 * @param {CreateRoomPayload} payload
 * @returns {Promise<{ code: string }>}
 * @throws {RoomApiError}
 */
export async function createRoom(payload) {
  const data = await call('/rooms', {
    method: 'POST',
    body: {
      displayName: payload.hostName,
      preferences: {
        contentType: payload.contentType,
        genreIds: payload.genreIds,
        maxDurationMinutes: payload.maxDurationMin,
      },
    },
  });
  saveRoomSession(data.code, { token: data.participant.token, participantId: data.participant.id });
  return { code: data.code };
}

/**
 * Joins a room as a guest and keeps the guest's token (sessionStorage).
 * POST /rooms/{code}/join
 *
 * @param {string} code
 * @param {{ name: string }} guest              name: 3-20 characters, unique in the room
 * @returns {Promise<{ ok: boolean, code: string }>}   `code` is the room's own spelling of the code
 * @throws {RoomApiError}                       NAME_TAKEN, ROOM_FULL, ROOM_NOT_JOINABLE, ROOM_NOT_FOUND...
 */
export async function joinRoom(code, guest) {
  const data = await call(`/rooms/${encode(code)}/join`, {
    method: 'POST',
    body: { displayName: guest.name },
  });
  const { token, id } = data.currentParticipant;
  saveRoomSession(data.code, { token, participantId: id });
  return { ok: true, code: data.code };
}

/**
 * Loads the room for the person in this tab (uses their saved token).
 * GET /rooms/{code}
 * When the token is missing, expired or belongs to another room the saved pass is dropped.
 *
 * @param {string} code
 * @returns {Promise<Room>}
 * @throws {RoomApiError}   code NO_SESSION, INVALID_TOKEN, WRONG_ROOM, ROOM_NOT_FOUND or a network error
 */
export async function getRoom(code) {
  const session = getRoomSession(code);
  if (!session) throw new RoomApiError('You are not in this room yet.', { code: 'NO_SESSION' });

  try {
    const room = toRoom(await call(`/rooms/${encode(code)}`, { token: session.token }), session);
    if (!room.participants.some((person) => person.isMe)) {
      throw new RoomApiError(SESSION_EXPIRED_MESSAGE, { code: 'INVALID_TOKEN' });
    }
    return room;
  } catch (error) {
    if (SESSION_ERROR_CODES.includes(error.code)) clearRoomSession(code);
    throw error;
  }
}

/**
 * Live updates of the room: asks the backend again every 3 seconds (no WebSocket available).
 * `onChange(room)` gets every fresh Room. `onError(error)` is called only when the person can
 * no longer use this room (expired token, room gone) and then polling stops; temporary network
 * errors are ignored and retried.
 *
 * @param {string} code
 * @param {(room: Room) => void} onChange
 * @param {(error: RoomApiError) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeToRoom(code, onChange, onError) {
  let isActive = true;
  let timer;

  const poll = async () => {
    try {
      const room = await getRoom(code);
      if (isActive) onChange(room);
    } catch (error) {
      if (SESSION_ERROR_CODES.includes(error.code)) {
        if (isActive) onError?.(error);
        return;
      }
    }
    if (isActive) timer = setTimeout(poll, POLL_INTERVAL_MS);
  };

  timer = setTimeout(poll, POLL_INTERVAL_MS);
  return () => {
    isActive = false;
    clearTimeout(timer);
  };
}

/**
 * Leaves the room ("Leave room" on the waiting room page).
 * STUB: the backend has no "leave" endpoint yet, so this only forgets the token on this device -
 * the person stays in the room's participant list until the backend supports leaving.
 *
 * @param {string} code
 * @returns {Promise<{ ok: boolean }>}
 */
export async function leaveRoom(code) {
  clearRoomSession(code);
  return { ok: true };
}

/**
 * Starts the swiping session for everyone in the room (host only).
 * STUB: the backend does not implement status changes yet. When it does, call it here
 * (e.g. POST /rooms/{code}/start) and throw a RoomApiError when it fails.
 *
 * @param {string} code
 * @returns {Promise<{ ok: boolean }>}
 */
export async function startSession(code) {
  if (import.meta.env.DEV) console.info('[stub] startSession', code);
  return { ok: true };
}
