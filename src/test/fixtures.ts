import type { CardDto, Room } from '../api/types.ts';

/** Backend-shaped test data (the same fields as the real API). */
export const backendCard = (i: number, extra: Partial<CardDto> = {}): CardDto => ({
  roomTitleId: i + 1,
  position: i,
  title: `Movie ${i + 1}`,
  year: 2020,
  overview: 'A story.',
  posterUrl: null,
  runtimeMinutes: 120,
  genres: [{ id: 28, name: 'Action' }],
  voteAverage: 7.5,
  director: 'Someone',
  creators: [],
  cast: ['A', 'B'],
  ageRating: 'PG-13',
  budget: null,
  revenue: null,
  originalLanguage: 'en',
  myVote: null,
  ...extra,
});

/** A room of two: Anna (host) and Egor. `meId` says which of them is looking at the page. */
export const testRoom = (meId = 1, extra: Partial<Room> = {}): Room => ({
  code: 'ABC123',
  status: 'VOTING',
  maxParticipants: 5,
  preferences: { contentType: 'MOVIES', genreIds: [], maxDurationMin: null },
  participants: [
    { id: 1, name: 'Anna', isHost: true, isMe: meId === 1 },
    { id: 2, name: 'Egor', isHost: false, isMe: meId === 2 },
  ],
  ...extra,
});

/** Saves the pass of person `participantId` for room `code`, as after joining. */
export const signIn = (code = 'ABC123', participantId = 1) =>
  sessionStorage.setItem(
    `room-session:${code}`,
    JSON.stringify({ token: 'test-token', participantId }),
  );

/**
 * Fakes the backend: `routes` maps "METHOD /path" (without /api) to a JSON body, a function
 * (request body) => body, or { status, body }. Returns the fetch mock to inspect the calls.
 */
type Answer = unknown | ((body: unknown) => unknown);

export function mockBackend(routes: Record<string, Answer>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    const key = `${options.method ?? 'GET'} ${String(url).replace(/^\/api/, '')}`;
    if (!(key in routes))
      return new Response(JSON.stringify({ code: 'NOT_MOCKED' }), { status: 404 });
    let answer: any = routes[key];
    if (typeof answer === 'function')
      answer = answer(options.body ? JSON.parse(String(options.body)) : null);
    const { status = 200, body = answer } = answer?.status ? answer : {};
    return new Response(body == null ? null : JSON.stringify(body), { status });
  });
}
