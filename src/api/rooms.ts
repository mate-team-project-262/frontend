/**
 * Rooms: create, join, read and leave a room, start the session.
 * POST /rooms, POST /rooms/{code}/join, GET /rooms/{code}, POST /rooms/{code}/leave,
 * POST /rooms/{code}/start. The backend field names stay in this file; pages use `Room`.
 */
import { FEATURES } from '../config/features.ts';
import { getDurationRanges } from '../utils/duration.ts';
import { SESSION_EXPIRED_MESSAGE, call, encode, isSessionError, requireSession } from './client.ts';
import { RoomApiError } from './errors.ts';
import {
  type RoomSession,
  clearRoomSession,
  getRoomSession,
  saveRoomSession,
} from './roomSession.ts';
import type {
  CreateRoomDto,
  CreateRoomPayload,
  JoinRoomDto,
  Room,
  RoomDto,
  RoomStatus,
} from './types.ts';

/** Backend lobby response -> the shape the pages use. */
function toRoom(data: RoomDto, session: RoomSession): Room {
  const preferences = data.preferences;
  return {
    code: data.code,
    status: data.status,
    maxParticipants: data.maxParticipants,
    preferences: {
      contentType: preferences?.contentType ?? 'MOVIES',
      genreIds: preferences?.genreIds ?? [],
      maxDurationMin: preferences?.maxDurationMinutes ?? null,
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
 * @throws {RoomApiError}
 */
export async function createRoom(payload: CreateRoomPayload): Promise<{ code: string }> {
  const ranges = getDurationRanges(payload.durationsMin);
  const preferences: Record<string, unknown> = {
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

  const data = await call<CreateRoomDto>('/rooms', {
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
 * @param guest  name: 3-20 characters, unique in the room
 * @returns `code` is the room's own spelling of the code
 * @throws {RoomApiError} NAME_TAKEN, ROOM_FULL, ROOM_NOT_JOINABLE, ROOM_NOT_FOUND...
 */
export async function joinRoom(
  code: string,
  guest: { name: string },
): Promise<{ ok: true; code: string }> {
  const data = await call<JoinRoomDto>(`/rooms/${encode(code)}/join`, {
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
 * @throws {RoomApiError} code NO_SESSION, INVALID_TOKEN, WRONG_ROOM, ROOM_NOT_FOUND or a network error
 */
export async function getRoom(code: string): Promise<Room> {
  const session = getRoomSession(code);
  if (!session) throw new RoomApiError('You are not in this room yet.', { code: 'NO_SESSION' });

  try {
    const data = await call<RoomDto>(`/rooms/${encode(code)}`, { token: session.token });
    const room = toRoom(data, session);
    if (!room.participants.some((person) => person.isMe)) {
      throw new RoomApiError(SESSION_EXPIRED_MESSAGE, { code: 'INVALID_TOKEN' });
    }
    return room;
  } catch (error) {
    if (isSessionError(error)) clearRoomSession(code);
    throw error;
  }
}

/**
 * Leaves the room: the backend removes the person and their votes and revokes the token.
 * When the host leaves, the participant with the smallest id becomes host; a host who is alone
 * deletes the room. The saved pass is forgotten afterwards.
 * POST /rooms/{code}/leave  (204)
 *
 * @throws {RoomApiError} only for network / server problems (the person is still in the room)
 */
export async function leaveRoom(code: string): Promise<{ ok: true }> {
  const session = getRoomSession(code);
  if (session) {
    try {
      await call<null>(`/rooms/${encode(code)}/leave`, { method: 'POST', token: session.token });
    } catch (error) {
      // Token already revoked / room gone: the person is not in the room any more anyway.
      if (!isSessionError(error)) throw error;
    }
  }
  clearRoomSession(code);
  return { ok: true };
}

/**
 * Starts the swiping session for everyone in the room (host only, 2+ people). The backend picks
 * the 20 movies (this can take several seconds) and moves the room to VOTING.
 * POST /rooms/{code}/start
 *
 * @throws {RoomApiError} NOT_ENOUGH_PARTICIPANTS, NOT_ENOUGH_TITLES, TMDB_UNAVAILABLE ...
 */
export async function startSession(code: string): Promise<{ status: RoomStatus }> {
  const session = requireSession(code);
  const data = await call<{ status: RoomStatus }>(`/rooms/${encode(code)}/start`, {
    method: 'POST',
    token: session.token,
  });
  return { status: data.status };
}
