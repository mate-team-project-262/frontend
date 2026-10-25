/**
 * Rooms API.
 *
 * STUBS: there is no backend yet. Every function keeps its final signature - when the backend is
 * ready, replace only the bodies (the real requests are described in each comment) and the pages
 * keep working unchanged.
 *
 * How the stub behaves: rooms are stored in localStorage, which all tabs of one browser share, and
 * every tab is a different person (its id lives in sessionStorage). A change made in one tab
 * reaches the others through the browser's `storage` event, so the whole flow can be tried with
 * several tabs: create a room in one tab, open the invite link in another tab and join - the
 * host's lobby shows the new person right away. Nobody is simulated: only what the tabs really do
 * appears. A duplicated tab copies sessionStorage (= the same person), so open a fresh tab.
 *
 * To look at a room with ready-made people, run this in the browser console and open /room/GMX2I:
 *
 *   localStorage.setItem('stub-room:GMX2I', JSON.stringify({ code: 'GMX2I', status: 'lobby',
 *     preferences: { contentType: 'movie', genres: ['Comedy'], maxDurationMin: null,
 *       streamingServices: ['Netflix'] },
 *     participants: [
 *       { id: 'a', name: 'Sofiia', isHost: true },
 *       { id: 'b', name: 'Anna', isHost: false },
 *       { id: 'c', name: 'Peter', isHost: false },
 *     ] }))
 *   sessionStorage.setItem('stub-participant-id', 'b') // look at it as Anna ('a' = the host)
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
 * @typedef {Object} RoomPreferences
 * @property {'movie' | 'tv' | null} contentType
 * @property {string[]} genres
 * @property {number | null} maxDurationMin
 * @property {string[]} streamingServices
 */

/**
 * @typedef {Object} Room
 * @property {string} code                    Room code from the invite link
 * @property {'lobby' | 'started'} status
 * @property {Participant[]} participants     Everyone in the room, host included.
 *                                            Empty for a visitor who has not joined yet.
 * @property {RoomPreferences} preferences    What the host picked (same fields as when creating)
 */

/**
 * An error whose message is safe to show to the user (map backend errors to this class:
 * 404 "Room not found", 409 "This session has already started", ...).
 */
export class RoomApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RoomApiError';
  }
}

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MIN_PARTICIPANTS_TO_START = 2;
const PARTICIPANT_ID_KEY = 'stub-participant-id';
const roomKey = (code) => `stub-room:${code}`;

// ---------- stub internals (the real backend replaces all of this) ----------

let fallbackParticipantId = null; // used when sessionStorage is unavailable

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  );
}

/** The id of the person using this tab. */
function getMyId() {
  try {
    let id = sessionStorage.getItem(PARTICIPANT_ID_KEY);
    if (!id) {
      id = createId();
      sessionStorage.setItem(PARTICIPANT_ID_KEY, id);
    }
    return id;
  } catch {
    fallbackParticipantId ??= createId();
    return fallbackParticipantId;
  }
}

function generateCode() {
  return Array.from(
    { length: 5 },
    () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
  ).join('');
}

function readStoredRoom(code) {
  try {
    return JSON.parse(localStorage.getItem(roomKey(code)));
  } catch {
    return null;
  }
}

/** Changes made in this tab; other tabs are notified by the browser's `storage` event. */
const localListeners = new Set();

function writeStoredRoom(room) {
  localStorage.setItem(roomKey(room.code), JSON.stringify(room));
  localListeners.forEach((listener) => listener(room.code));
}

function deleteStoredRoom(code) {
  localStorage.removeItem(roomKey(code));
  localListeners.forEach((listener) => listener(code));
}

/** What the backend would answer to the person in this tab: adds `isMe`, hides people from visitors. */
function toRoomView(stored) {
  if (!stored) return null;
  const myId = getMyId();
  const isMember = stored.participants.some((person) => person.id === myId);
  return {
    code: stored.code,
    status: stored.status,
    preferences: stored.preferences,
    participants: isMember
      ? stored.participants.map((person) => ({ ...person, isMe: person.id === myId }))
      : [],
  };
}

function requireStoredRoom(code) {
  const room = readStoredRoom(code);
  if (!room) throw new RoomApiError('We could not find this room.');
  return room;
}

// ---------- public API ----------

/**
 * Creates a room; the caller becomes its host.
 * Real version: POST /api/rooms with `payload`, return the response ({ code }).
 *
 * @param {CreateRoomPayload} payload
 * @returns {Promise<{ code: string }>}
 */
export async function createRoom(payload) {
  let code = generateCode();
  while (readStoredRoom(code)) code = generateCode();

  writeStoredRoom({
    code,
    status: 'lobby',
    preferences: {
      contentType: payload.contentType,
      genres: payload.genres,
      maxDurationMin: payload.maxDurationMin,
      streamingServices: payload.streamingServices,
    },
    participants: [{ id: getMyId(), name: payload.hostName, isHost: true }],
  });
  return { code };
}

/**
 * Loads a room as seen by the person who is looking at it. Resolves to `null` when the room
 * does not exist (real version: 404).
 * Who is looking decides the view: no participant with `isMe` = visitor (invite page),
 * `isMe` + `isHost` = host lobby, `isMe` guest = waiting room.
 * Real version: GET /api/rooms/:code
 *
 * @param {string} code
 * @returns {Promise<Room | null>}
 */
export async function getRoom(code) {
  return toRoomView(readStoredRoom(code));
}

/**
 * Live updates of a room (people joining or leaving, the session starting).
 * `onChange` receives the whole updated Room, or `null` when the room was closed.
 * Real version: WebSocket / SSE / polling; return a function that stops the updates.
 *
 * @param {string} code
 * @param {(room: Room | null) => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeToRoom(code, onChange) {
  const notify = () => onChange(toRoomView(readStoredRoom(code)));
  const handleLocalChange = (changedCode) => changedCode === code && notify();
  const handleStorageEvent = (event) => event.key === roomKey(code) && notify();

  localListeners.add(handleLocalChange);
  window.addEventListener('storage', handleStorageEvent);
  return () => {
    localListeners.delete(handleLocalChange);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Joins a room as a guest ("Join a movie room" page and the invite page).
 * Real version: POST /api/rooms/:code/join with { name }; throw a RoomApiError when it fails
 * (404 - there is no such room, 409 - the session already started).
 *
 * @param {string} code
 * @param {{ name: string }} guest
 * @returns {Promise<{ ok: boolean }>}
 */
export async function joinRoom(code, guest) {
  const room = readStoredRoom(code);
  if (!room) throw new RoomApiError('We could not find this room. Check the link and try again.');

  const myId = getMyId();
  if (room.participants.some((person) => person.id === myId)) return { ok: true };
  if (room.status !== 'lobby') throw new RoomApiError('This session has already started.');

  writeStoredRoom({
    ...room,
    participants: [...room.participants, { id: myId, name: guest.name, isHost: false }],
  });
  return { ok: true };
}

/**
 * Leaves the room ("Leave room" on the waiting room page). When the host leaves, the room closes.
 * Real version: POST /api/rooms/:code/leave
 *
 * @param {string} code
 * @returns {Promise<{ ok: boolean }>}
 */
export async function leaveRoom(code) {
  const room = readStoredRoom(code);
  if (!room) return { ok: true };

  const myId = getMyId();
  const me = room.participants.find((person) => person.id === myId);
  if (me?.isHost) deleteStoredRoom(code);
  else writeStoredRoom({ ...room, participants: room.participants.filter((p) => p.id !== myId) });
  return { ok: true };
}

/**
 * Starts the swiping session for everyone in the room (host only).
 * Real version: POST /api/rooms/:code/start
 *
 * @param {string} code
 * @returns {Promise<{ ok: boolean }>}
 */
export async function startSession(code) {
  const room = requireStoredRoom(code);
  const host = room.participants.find((person) => person.isHost);
  if (host?.id !== getMyId()) throw new RoomApiError('Only the host can start the session.');
  if (room.participants.length < MIN_PARTICIPANTS_TO_START) {
    throw new RoomApiError('Invite at least one friend to start a session.');
  }

  writeStoredRoom({ ...room, status: 'started' });
  return { ok: true };
}
