/**
 * Rooms API.
 *
 * STUBS: there is no backend yet, so nothing is sent anywhere. Every function below keeps the
 * final signature - when the backend is ready, replace only the bodies (see the examples) and
 * the pages keep working unchanged.
 *
 * The stub room is kept in sessionStorage (per browser tab) so that the lobby page survives a
 * reload. To preview the lobby with several people, run this in the browser console and reload:
 *
 *   sessionStorage.setItem('stub-room:GMX2I', JSON.stringify({ code: 'GMX2I', status: 'lobby',
 *     participants: [
 *       { id: '1', name: 'Sofiia', isHost: true, isMe: true },
 *       { id: '2', name: 'Anna', isHost: false, isMe: false },
 *       { id: '3', name: 'Peter', isHost: false, isMe: false },
 *     ] }))
 *
 * and open /room/GMX2I. A tab that did NOT create the room (or any unknown code) is treated as a
 * visitor and sees the invite page, as a guest opening the shared link would.
 */

/**
 * @typedef {Object} CreateRoomPayload
 * @property {string} hostName                      Name of the person creating the room
 * @property {'movie' | 'tv' | null} contentType    null = no preference
 * @property {string[]} genres                      Empty = any genre
 * @property {number | null} maxDurationMin         90 | 120 | 150, null = no limit
 * @property {string[]} streamingServices           Empty = any service
 */

/**
 * @typedef {Object} Participant
 * @property {string} id
 * @property {string} name
 * @property {boolean} isHost
 * @property {boolean} isMe    true for the person who is looking at the page (set by the backend)
 */

/**
 * @typedef {Object} Room
 * @property {string} code                    Room code from the invite link
 * @property {'lobby' | 'started'} status
 * @property {Participant[]} participants     Everyone in the room, host included
 */

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const stubKey = (code) => `stub-room:${code}`;

function generateStubCode() {
  return Array.from(
    { length: 5 },
    () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
  ).join('');
}

function readStubRoom(code) {
  try {
    return JSON.parse(sessionStorage.getItem(stubKey(code)));
  } catch {
    return null;
  }
}

function writeStubRoom(room) {
  try {
    sessionStorage.setItem(stubKey(room.code), JSON.stringify(room));
  } catch {
    // sessionStorage can be unavailable; the stub then falls back to a default room.
  }
}

/**
 * Creates a room.
 * Real version: POST /api/rooms with `payload`, return the response ({ code }).
 *
 * @param {CreateRoomPayload} payload
 * @returns {Promise<{ code: string }>}
 */
export async function createRoom(payload) {
  if (import.meta.env.DEV) console.info('[stub] createRoom', payload);
  const code = generateStubCode();
  writeStubRoom({
    code,
    status: 'lobby',
    participants: [{ id: 'stub-host', name: payload.hostName, isHost: true, isMe: true }],
  });
  return { code };
}

/**
 * Loads a room. Resolves to `null` when the room does not exist (real version: 404).
 * Who is looking decides the view: no participant with `isMe` = visitor (invite page),
 * `isMe` + `isHost` = host lobby.
 * Real version: GET /api/rooms/:code
 *
 * @param {string} code
 * @returns {Promise<Room | null>}
 */
export async function getRoom(code) {
  // Unknown codes behave like a room the visitor is not part of (no participant has isMe).
  return readStubRoom(code) ?? { code, status: 'lobby', participants: [] };
}

/**
 * Live updates of a room (people joining or leaving). `onChange` receives the whole updated Room.
 * Real version: WebSocket / SSE / polling; return a function that stops the updates.
 *
 * @param {string} code
 * @param {(room: Room) => void} onChange
 * @returns {() => void} unsubscribe
 */
// eslint-disable-next-line no-unused-vars -- stub: the parameters document the final signature
export function subscribeToRoom(code, onChange) {
  return () => {};
}

/**
 * Starts the swiping session for everyone in the room (host only).
 * Real version: POST /api/rooms/:code/start
 *
 * @param {string} code
 * @returns {Promise<{ ok: boolean }>}
 */
export async function startSession(code) {
  if (import.meta.env.DEV) console.info('[stub] startSession', code);
  return { ok: true };
}

/**
 * Joins a room as a guest ("Join a movie room" page and the invite page).
 * Real version: POST /api/rooms/:code/join with { name }; throw an Error when it fails
 * (for example 404 - there is no such room, 409 - the session already started).
 *
 * @param {string} code
 * @param {{ name: string }} guest
 * @returns {Promise<{ ok: boolean }>}
 */
export async function joinRoom(code, guest) {
  if (import.meta.env.DEV) console.info('[stub] joinRoom', code, guest);
  return { ok: true };
}
