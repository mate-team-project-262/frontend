import {
  initAnalytics,
  isAnalyticsAllowed,
  markSwipeStarted,
  oncePerRoom,
  resetAnalytics,
  secondsSinceSwipeStarted,
  toReportedPath,
  track,
} from './analytics.ts';

/** GA's queue holds `arguments` objects: turn them into plain arrays to compare. */
const sent = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));

describe('analytics', () => {
  afterEach(() => {
    resetAnalytics();
    document.head.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
    vi.useRealTimers();
  });

  it('runs only on the real site', () => {
    expect(isAnalyticsAllowed(true, 'what2watch.duckdns.org')).toBe(true);
    expect(isAnalyticsAllowed(true, 'localhost')).toBe(false);
    expect(isAnalyticsAllowed(false, 'what2watch.duckdns.org')).toBe(false);
  });

  it('sends nothing until it is started', () => {
    track('room_joined', {});
    expect(window.dataLayer).toBeUndefined();
  });

  it('loads the Google tag once and switches the automatic page view off', () => {
    initAnalytics({ enabled: true });
    initAnalytics({ enabled: true });
    expect(document.head.querySelectorAll('script[src*="gtag/js?id=G-"]')).toHaveLength(1);
    expect(sent()).toContainEqual(['config', 'G-CHKH5SVJ2K', { send_page_view: false }]);
  });

  it('sends events with their parameters and the user type', () => {
    initAnalytics({ enabled: true });
    track('movie_swiped', {
      swipe_direction: 'right',
      swipe_method: 'button',
      movie_id: 7,
      movie_title: 'Dune',
    });
    expect(sent()).toContainEqual([
      'event',
      'movie_swiped',
      {
        user_type: 'guest',
        swipe_direction: 'right',
        swipe_method: 'button',
        movie_id: 7,
        movie_title: 'Dune',
      },
    ]);
  });

  it('never reports a room code', () => {
    expect(toReportedPath('/room/K7M2QX')).toBe('/room/:code');
    expect(toReportedPath('/join/K7M2QX')).toBe('/join/:code');
    expect(toReportedPath('/join')).toBe('/join');
    expect(toReportedPath('/create-room')).toBe('/create-room');
    expect(toReportedPath('/home/sessions/42')).toBe('/home/sessions/:sessionId');
    expect(toReportedPath('/home/sessions')).toBe('/home/sessions');
  });

  it('sends a once-per-room event a single time', () => {
    const send = vi.fn();
    oncePerRoom('abc123', 'matched', send);
    oncePerRoom('ABC123', 'matched', send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('measures the time from the first card', () => {
    vi.useFakeTimers();
    expect(secondsSinceSwipeStarted('ABC123')).toBeNull();
    markSwipeStarted('ABC123');
    vi.advanceTimersByTime(95_000);
    markSwipeStarted('ABC123'); // a reload does not restart the clock
    expect(secondsSinceSwipeStarted('ABC123')).toBe(95);
  });
});
