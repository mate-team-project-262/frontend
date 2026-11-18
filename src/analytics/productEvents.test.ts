import { signIn } from '../test/fixtures.ts';
import {
  flushProductEvents,
  getAnalyticsSessionId,
  initProductEvents,
  logEvent,
  resetProductEvents,
} from './productEvents.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function mockFetch(status = 202) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status }));
}

/** The events of every request sent to /api/event, with its participant token. */
const sentBatches = (fetchMock: ReturnType<typeof mockFetch>) =>
  fetchMock.mock.calls.map(([url, options]) => ({
    url: String(url),
    token: new Headers(options?.headers).get('X-Participant-Token'),
    keepalive: options?.keepalive,
    events: JSON.parse(String(options?.body)).events,
  }));

describe('product events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/room/K7M2QX');
  });

  afterEach(() => {
    resetProductEvents();
    vi.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('sends nothing where analytics is off (localhost, tests)', () => {
    const fetchMock = mockFetch();
    initProductEvents({ enabled: false });

    logEvent('sign_in_clicked');
    vi.advanceTimersByTime(10_000);
    flushProductEvents();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a batch a few seconds later, in the shape the backend expects', () => {
    const fetchMock = mockFetch();
    initProductEvents({ enabled: true });

    logEvent('sign_in_clicked');
    logEvent('genres_selected', { genres: ['Comedy', 'Drama'] });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);

    const [batch] = sentBatches(fetchMock);
    expect(batch.url).toBe('/api/event');
    expect(batch.keepalive).toBe(true);
    expect(batch.token).toBeNull();
    const [first, second] = batch.events;
    expect(first).toMatchObject({ name: 'sign_in_clicked', page: '/room/:code' });
    expect(first.params).toBeUndefined();
    expect(second.params).toEqual({ genres: ['Comedy', 'Drama'] });
    expect(first.eventId).toMatch(UUID);
    expect(first.eventId).not.toBe(second.eventId);
    // one tab = one sessionId
    expect(first.sessionId).toMatch(UUID);
    expect(second.sessionId).toBe(first.sessionId);
    expect(getAnalyticsSessionId()).toBe(first.sessionId);
    expect(new Date(first.occurredAt).toISOString()).toBe(first.occurredAt);
  });

  it('sends room events separately, with the participant token of that room', () => {
    signIn('ABC123');
    const fetchMock = mockFetch();
    initProductEvents({ enabled: true });

    logEvent('header_sign_in_clicked');
    logEvent('room_invite_link_copied', {}, { roomCode: 'ABC123' });
    flushProductEvents();

    const batches = sentBatches(fetchMock);
    expect(batches).toHaveLength(2);
    expect(batches.find((batch) => batch.token === null)?.events[0].name).toBe(
      'header_sign_in_clicked',
    );
    expect(batches.find((batch) => batch.token === 'test-token')?.events[0].name).toBe(
      'room_invite_link_copied',
    );
  });

  it('sends at once when twenty events are waiting', () => {
    const fetchMock = mockFetch();
    initProductEvents({ enabled: true });

    for (let i = 0; i < 20; i++) logEvent('swipe_right', { movie_id: i });

    expect(sentBatches(fetchMock)[0].events).toHaveLength(20);
  });

  it('uses sendBeacon when the page is closed (but not for room events)', () => {
    signIn('ABC123');
    const fetchMock = mockFetch();
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    initProductEvents({ enabled: true });

    logEvent('sign_up_clicked', { source: 'landing' });
    logEvent('swipe_left', { movie_id: 3 }, { roomCode: 'ABC123' });
    window.dispatchEvent(new Event('pagehide'));

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]).toEqual(['/api/event', expect.any(Blob)]);
    // the room event needs its token header, which sendBeacon cannot send
    expect(sentBatches(fetchMock)).toEqual([
      expect.objectContaining({ token: 'test-token', keepalive: true }),
    ]);
  });

  it('tries a failed batch once more with the same event ids', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    initProductEvents({ enabled: true });

    logEvent('another_round_clicked');
    flushProductEvents();
    await vi.advanceTimersByTimeAsync(5000); // the retry
    await vi.advanceTimersByTimeAsync(5000); // nothing more

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const ids = fetchMock.mock.calls.map(
      ([, options]) => JSON.parse(String(options?.body)).events[0].eventId,
    );
    expect(new Set(ids).size).toBe(1);
  });
});
