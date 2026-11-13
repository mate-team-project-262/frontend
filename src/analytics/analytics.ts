/**
 * Google Analytics 4 (the marketer's tracking plan). One place that knows about GA:
 * pages call `track('room_created', {...})` and nothing else.
 *
 *  - Runs only on the real site: not in development, not in tests, not on localhost, so local
 *    and QA runs do not pollute the reports. Add `?ga_debug=1` to the address to see the events
 *    in GA4 DebugView.
 *  - No personal data: names are never sent, and room codes are cut out of page addresses
 *    (`/room/K7M2QX` is reported as `/room/:code`).
 *  - Every event carries `user_type`: 'guest' or 'registered' (set by the account session).
 */
const MEASUREMENT_ID: string = import.meta.env.VITE_GA_MEASUREMENT_ID ?? 'G-CHKH5SVJ2K';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** Custom events of the tracking plan and the parameters each one carries. */
export interface AnalyticsEvents {
  page_view: { page_path: string; page_location: string; page_title: string };
  room_created: { content_type: string; genre_count: number; duration_count: number };
  room_joined: Record<string, never>;
  friend_invited: { invite_method: 'link' | 'telegram'; participant_count: number };
  movie_swiped: {
    swipe_direction: 'left' | 'right';
    swipe_method: 'drag' | 'button' | 'keyboard';
    movie_id: number;
    movie_title: string;
  };
  movie_matched: { participant_count: number; match_count: number; movie_title: string };
  /** GA4's recommended names for a new account and a sign-in */
  sign_up: { method: 'password' };
  login: { method: 'password' };
  selection_completed: {
    participant_count: number;
    match_count: number;
    selection_duration_sec: number | null;
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let isActive = false;
let userType: 'guest' | 'registered' = 'guest';

/** GA's own queue function: it must push the `arguments` object itself, not an array. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

/** `/room/K7M2QX` -> `/room/:code`: a room code lets people into the room, so it stays private. */
export const toReportedPath = (pathname: string): string =>
  pathname
    .replace(/^\/(room|join)\/[^/]+/, '/$1/:code')
    .replace(/^\/home\/sessions\/[^/]+/, '/home/sessions/:sessionId');

export function isAnalyticsAllowed(
  isProduction: boolean = import.meta.env.PROD,
  hostname: string = window.location.hostname,
): boolean {
  return isProduction && !LOCAL_HOSTS.includes(hostname);
}

/** Loads the Google tag once. Does nothing where analytics is not allowed (see above). */
export function initAnalytics({ enabled = isAnalyticsAllowed() } = {}): void {
  if (!enabled || isActive) return;
  isActive = true;
  window.dataLayer = window.dataLayer ?? [];

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    send_page_view: false, // page views are sent by hand, without room codes (App.tsx)
    ...(new URLSearchParams(window.location.search).has('ga_debug') ? { debug_mode: true } : {}),
  });
  gtag('set', 'user_properties', { user_type: 'guest' });
}

/** Sends one event of the tracking plan. Safe to call anywhere: a no-op until GA is loaded. */
export function track<Name extends keyof AnalyticsEvents>(
  name: Name,
  params: AnalyticsEvents[Name],
): void {
  if (!isActive) return;
  gtag('event', name, { user_type: userType, ...params });
}

/** Runs `send` once per room and browser tab (a reload of the results page must not repeat it). */
export function oncePerRoom(code: string, key: string, send: () => void): void {
  const storageKey = `analytics:${key}:${code.toUpperCase()}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    // no storage: better to send twice than never
  }
  send();
}

const startedKey = (code: string) => `analytics:swipe-started:${code.toUpperCase()}`;

/** Remembers when this person started swiping in the room (kept over a reload). */
export function markSwipeStarted(code: string): void {
  try {
    if (!sessionStorage.getItem(startedKey(code))) {
      sessionStorage.setItem(startedKey(code), String(Date.now()));
    }
  } catch {
    // the duration will simply be unknown
  }
}

/** Seconds from the first movie card to now, or null when the start is unknown. */
export function secondsSinceSwipeStarted(code: string): number | null {
  try {
    const startedAt = Number(sessionStorage.getItem(startedKey(code)));
    return startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;
  } catch {
    return null;
  }
}

/** Called when the person signs in or out: later events and the GA user property carry it. */
export function setAnalyticsUserType(type: 'guest' | 'registered'): void {
  userType = type;
  if (isActive) gtag('set', 'user_properties', { user_type: type });
}

/** For tests: forget that GA was started. */
export function resetAnalytics(): void {
  isActive = false;
  userType = 'guest';
  delete window.dataLayer;
}
