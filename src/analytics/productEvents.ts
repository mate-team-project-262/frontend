/**
 * Product events for the team's own analytics (the analyst's "Event Tracking Specification"):
 * clicks and choices go to our backend, POST /event. What the backend records by itself
 * (swipe session started / completed, the winning movie) is never sent from here.
 *
 *  - Runs only where Google Analytics runs: the real site, not localhost, dev or tests.
 *  - No personal data: no names, emails or room codes. Pages are reported as route templates
 *    (`/room/:code`). The backend links an event to the account (session cookie) and, for room
 *    screens, to the room and participant (X-Participant-Token).
 *  - `sessionId` is a random id of this browser tab: it lives until the tab is closed and is not
 *    kept between visits (agreed with the analyst), so no cookie consent is needed for it.
 *  - Events are sent in batches every few seconds, and when the page is hidden or closed.
 *    A failed batch is tried once more; the backend stores an `eventId` only once.
 */
import { BASE_URL } from '../api/http.ts';
import { getRoomSession } from '../api/roomSession.ts';
import { isAnalyticsAllowed, toReportedPath } from './analytics.ts';

type Params = Record<string, string | number | boolean | string[] | number[] | null>;

/** The events of the specification the frontend sends, and their parameters. */
export interface ProductEvents {
  // landing and entry
  create_room_submitted: { source: 'landing' | 'header' | 'create_room_form' };
  create_room_clicked: { source: 'create_room_form' };
  guest_start_clicked: Record<string, never>;
  join_room_clicked: { source: 'landing' };
  header_sign_in_clicked: Record<string, never>;
  sign_up_clicked: { source: 'landing' | 'results' | 'sign_in' | 'sign_up_form' };
  account_section_sign_in_clicked: { source: 'landing' | 'results' };
  // create room
  guest_name_entered: Record<string, never>;
  content_type_selected: { content_type: string };
  genres_selected: { genres: string[] };
  max_duration_selected: { max_duration: number; durations: number[] };
  // host room / invite
  room_invite_link_copied: Record<string, never>;
  room_invite_telegram_clicked: Record<string, never>;
  start_session_clicked: { source: 'lobby' | 'home' };
  participant_count: { participant_count: number };
  // swipe session: guests (by how they voted) and signed-in people (liked / disliked)
  swipe_right: { movie_id: number };
  swipe_left: { movie_id: number };
  like_button: { movie_id: number };
  dislike_button: { movie_id: number };
  movie_liked: { movie_id: number; method: 'swipe_right' | 'like_button' };
  movie_disliked: { movie_id: number; method: 'swipe_left' | 'dislike_button' };
  // results
  winner_details_clicked: { movie_id: number };
  another_round_clicked: Record<string, never>;
  view_sessions_clicked: { source: 'home' | 'results' };
  explore_taste_clicked: { source: 'home' | 'results' };
  // sign in / sign up
  sign_in_clicked: Record<string, never>;
  forgot_password_clicked: Record<string, never>;
  sign_up_succeeded: Record<string, never>;
  sign_in_from_signup_clicked: Record<string, never>;
  // home and settings
  session_details_clicked: { source: 'home' | 'sessions' };
  settings_clicked: Record<string, never>;
  profile_photo_upload_clicked: Record<string, never>;
  change_password_clicked: Record<string, never>;
  delete_account_clicked: Record<string, never>;
}

interface WireEvent {
  eventId: string;
  name: string;
  occurredAt: string;
  sessionId: string;
  page: string;
  params?: Params;
}

interface Queued {
  event: WireEvent;
  /** the room screen the event came from: its participant token goes along */
  roomCode: string | null;
  attempts: number;
}

const FLUSH_DELAY_MS = 5000;
const FLUSH_SIZE = 20;
const MAX_BATCH = 50; // the backend's limit
const SESSION_KEY = 'w2w-analytics-session';

let enabled = false;
let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let memorySessionId: string | null = null;

function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // older browsers: a version-4 UUID from random bytes
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The id of this tab: the same for every event until the tab is closed. */
export function getAnalyticsSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    memorySessionId ??= randomId();
    return memorySessionId;
  }
}

function send(batch: Queued[], roomCode: string | null, isLeaving: boolean): void {
  const body = JSON.stringify({ events: batch.map((item) => item.event) });
  const token = roomCode ? getRoomSession(roomCode)?.token : undefined;

  // sendBeacon survives closing the tab but cannot carry the participant token header
  if (isLeaving && !token && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    if (navigator.sendBeacon(`${BASE_URL}/event`, blob)) return;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Participant-Token'] = token;
  fetch(`${BASE_URL}/event`, {
    method: 'POST',
    headers,
    body,
    credentials: 'same-origin',
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok && response.status >= 500) throw new Error('server');
    })
    .catch(() => {
      // one more try later; the eventId keeps the backend from storing it twice
      const again = batch.filter((item) => item.attempts < 1);
      again.forEach((item) => (item.attempts += 1));
      if (again.length > 0 && !isLeaving) {
        queue.push(...again);
        schedule();
      }
    });
}

/** Sends everything waiting. `isLeaving`: the page is being hidden or closed. */
export function flushProductEvents(isLeaving = false): void {
  if (timer) clearTimeout(timer);
  timer = null;
  const waiting = queue;
  queue = [];
  // one request per room (a different participant token) and at most 50 events each
  const byRoom = new Map<string | null, Queued[]>();
  waiting.forEach((item) =>
    byRoom.set(item.roomCode, [...(byRoom.get(item.roomCode) ?? []), item]),
  );
  byRoom.forEach((items, roomCode) => {
    for (let start = 0; start < items.length; start += MAX_BATCH) {
      send(items.slice(start, start + MAX_BATCH), roomCode, isLeaving);
    }
  });
}

function schedule(): void {
  if (!timer) timer = setTimeout(() => flushProductEvents(), FLUSH_DELAY_MS);
}

/**
 * Records one event of the specification. `options.roomCode`: the event happened on a room
 * screen (lobby, swipe, results), so the backend can link it to that room.
 */
export function logEvent<Name extends keyof ProductEvents>(
  name: Name,
  ...[params, options]: ProductEvents[Name] extends Record<string, never>
    ? [params?: ProductEvents[Name], options?: { roomCode?: string }]
    : [params: ProductEvents[Name], options?: { roomCode?: string }]
): void {
  if (!enabled) return;
  const hasParams = params && Object.keys(params).length > 0;
  queue.push({
    event: {
      eventId: randomId(),
      name,
      occurredAt: new Date().toISOString(),
      sessionId: getAnalyticsSessionId(),
      page: toReportedPath(window.location.pathname),
      ...(hasParams ? { params: params as Params } : {}),
    },
    roomCode: options?.roomCode ?? null,
    attempts: 0,
  });
  if (queue.length >= FLUSH_SIZE) flushProductEvents();
  else schedule();
}

const flushWhenHidden = () => {
  if (document.visibilityState === 'hidden') flushProductEvents(true);
};
const flushOnLeave = () => flushProductEvents(true);

/** Starts sending (once, from main.tsx). Does nothing where analytics is not allowed. */
export function initProductEvents({ enabled: on = isAnalyticsAllowed() } = {}): void {
  if (enabled || !on) return;
  enabled = true;
  document.addEventListener('visibilitychange', flushWhenHidden);
  window.addEventListener('pagehide', flushOnLeave);
}

/** For tests: stop sending and forget the queue. */
export function resetProductEvents(): void {
  enabled = false;
  queue = [];
  if (timer) clearTimeout(timer);
  timer = null;
  document.removeEventListener('visibilitychange', flushWhenHidden);
  window.removeEventListener('pagehide', flushOnLeave);
}
