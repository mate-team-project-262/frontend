/**
 * Rooms API - talks to the backend (POST /rooms, POST /rooms/{code}/join, GET /rooms/{code},
 * POST /rooms/{code}/start, GET /rooms/{code}/deck, POST /rooms/{code}/votes). The pages only use
 * the functions below and the `Room` / `MovieCard` shapes; the backend details (field names, enum
 * values, tokens) stay in this file.
 *
 * Not available on the backend yet (kept as a stub): leaving a room.
 */
import { FEATURES } from '../config/features.js';
import { getDurationRanges } from '../utils/duration.js';
import { RoomApiError, toRoomApiError } from './errors.js';
import { BASE_URL, apiRequest } from './http.js';
import { clearRoomSession, getRoomSession, saveRoomSession } from './roomSession.js';

export { RoomApiError };

/**
 * @typedef {Object} CreateRoomPayload
 * @property {string} hostName                      3-20 characters
 * @property {'MOVIES' | 'TV_SERIES'} contentType
 * @property {number[]} genreIds                    Backend genre ids for the content type. Empty = any
 * @property {number[]} durationsMin              Durations the host ticked (90, 120, 150). Empty = no limit.
 *                                                 What they mean: getDurationRanges() in utils/duration.js.
 *                                                 The backend takes ONE number (`maxDurationMinutes`), so
 *                                                 the longest time is sent; the exact ranges go out too once
 *                                                 FEATURES.durationRanges is on.
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

/**
 * @typedef {Object} MovieCard   One movie of the room's 20-card deck
 * @property {number} id                 roomTitleId - what a vote is sent for
 * @property {number} position           0-19, the same order for everyone
 * @property {string} title
 * @property {number | null} year
 * @property {string | null} overview
 * @property {string | null} posterUrl
 * @property {number | null} runtimeMin  for TV shows: the length of an episode
 * @property {string[]} genres           names, e.g. ['Action', 'Comedy']
 * @property {number | null} rating      TMDB vote average, 0-10
 * @property {string | null} director
 * @property {string[]} creators         TV shows: "Created by"
 * @property {string[]} cast             in billing order
 * @property {string | null} ageRating   e.g. 'PG-13' (US)
 * @property {number | null} budget      USD
 * @property {number | null} revenue     USD
 * @property {string | null} language    ISO 639-1 code, e.g. 'en'
 * @property {boolean | null} myVote     true = liked, false = skipped, null = not voted yet
 */

/**
 * @typedef {Object} Deck
 * @property {'MOVIES' | 'TV_SERIES'} contentType
 * @property {MovieCard[]} cards     in position order
 * @property {number} votedCount     how many of them this person has voted for
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
  const ranges = getDurationRanges(payload.durationsMin);
  const preferences = {
    contentType: payload.contentType,
    genreIds: payload.genreIds,
    maxDurationMinutes: ranges.length ? ranges[ranges.length - 1].to : null,
  };
  // PROPOSAL for the backend (field name to agree on): exactly which lengths the host wants.
  if (FEATURES.durationRanges) {
    preferences.durationRanges = ranges.map(({ from, to }) => ({
      fromMinutes: from,
      toMinutes: to,
    }));
  }

  const data = await call('/rooms', {
    method: 'POST',
    body: { displayName: payload.hostName, preferences },
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
 * Starts the swiping session for everyone in the room (host only, 2+ people). The backend picks
 * the 20 movies (this can take several seconds) and moves the room to VOTING.
 * POST /rooms/{code}/start
 *
 * @param {string} code
 * @returns {Promise<{ status: 'VOTING' }>}
 * @throws {RoomApiError}   NOT_ENOUGH_PARTICIPANTS, NOT_ENOUGH_TITLES, TMDB_UNAVAILABLE ...
 */
export async function startSession(code) {
  const session = getRoomSession(code);
  if (!session) throw new RoomApiError(SESSION_EXPIRED_MESSAGE, { code: 'NO_SESSION' });
  const data = await call(`/rooms/${encode(code)}/start`, { method: 'POST', token: session.token });
  return { status: data.status };
}

/** Demo posters come from the backend itself (/demo/...), real ones are full TMDB links. */
const toPosterUrl = (url) => (url?.startsWith('/') ? `${BASE_URL}${url}` : (url ?? null));

/** Backend deck card -> MovieCard. */
function toMovieCard(card) {
  return {
    id: card.roomTitleId,
    position: card.position,
    title: card.title,
    year: card.year ?? null,
    overview: card.overview ?? null,
    posterUrl: toPosterUrl(card.posterUrl),
    runtimeMin: card.runtimeMinutes ?? null,
    genres: (card.genres ?? []).map((genre) => genre.name).filter(Boolean),
    rating: card.voteAverage ?? null,
    director: card.director ?? null,
    creators: card.creators ?? [],
    cast: card.cast ?? [],
    ageRating: card.ageRating ?? null,
    budget: card.budget ?? null,
    revenue: card.revenue ?? null,
    language: card.originalLanguage ?? null,
    myVote: card.myVote ?? null,
  };
}

/**
 * The room's 20 movies with this person's votes (available once the session has started).
 * GET /rooms/{code}/deck
 *
 * @param {string} code
 * @returns {Promise<Deck>}
 * @throws {RoomApiError}   ROOM_NOT_VOTING (not started yet), INVALID_TOKEN ...
 */
export async function getDeck(code) {
  const session = getRoomSession(code);
  if (!session) throw new RoomApiError(SESSION_EXPIRED_MESSAGE, { code: 'NO_SESSION' });
  const data = await call(`/rooms/${encode(code)}/deck`, { token: session.token });
  return {
    contentType: data.contentType,
    cards: data.cards.map(toMovieCard).sort((a, b) => a.position - b.position),
    votedCount: data.votedCount,
  };
}

/**
 * Saves a like (true) or a skip (false). Sending the same vote again is fine; a different vote
 * for the same movie is rejected with ALREADY_VOTED.
 * POST /rooms/{code}/votes
 *
 * @param {string} code
 * @param {{ cardId: number, liked: boolean }} vote
 * @returns {Promise<{ votedCount: number, total: number, finished: boolean }>}
 * @throws {RoomApiError}
 */
export async function voteForMovie(code, { cardId, liked }) {
  const session = getRoomSession(code);
  if (!session) throw new RoomApiError(SESSION_EXPIRED_MESSAGE, { code: 'NO_SESSION' });
  const data = await call(`/rooms/${encode(code)}/votes`, {
    method: 'POST',
    token: session.token,
    body: { roomTitleId: cardId, isLiked: liked },
  });
  return {
    votedCount: data.votedCount,
    total: data.totalCards,
    finished: data.participantFinished,
  };
}
