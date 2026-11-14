import { waitFor } from '@testing-library/react';
import { mockBackend, signIn } from '../test/fixtures.ts';
import { renderHookWithQuery } from '../test/render.tsx';
import { resetLinkedRooms, useLinkRoomToAccount } from './useLinkRoomToAccount.ts';

const sofiia = { 'GET /me': { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' } };
const csrf = { 'GET /auth/csrf': { headerName: 'X-XSRF-TOKEN', token: 'csrf-1' } };

const linkCalls = (fetchMock: ReturnType<typeof mockBackend>) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/me/participants/link'));

describe('useLinkRoomToAccount', () => {
  beforeEach(() => {
    resetLinkedRooms();
    sessionStorage.clear();
  });

  it('ties the place in the room to the account, once', async () => {
    signIn('ABC123');
    const fetchMock = mockBackend({
      ...sofiia,
      ...csrf,
      'POST /me/participants/link': { status: 204, body: null },
    });

    const first = renderHookWithQuery(() => useLinkRoomToAccount('ABC123'));
    await waitFor(() => expect(linkCalls(fetchMock)).toHaveLength(1));

    const headers = new Headers(linkCalls(fetchMock)[0][1]?.headers);
    expect(headers.get('X-Participant-Token')).toBe('test-token');
    expect(headers.get('X-XSRF-TOKEN')).toBe('csrf-1');

    // the room page is opened again (e.g. lobby -> swipe): no second request
    first.unmount();
    renderHookWithQuery(() => useLinkRoomToAccount('abc123'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(linkCalls(fetchMock)).toHaveLength(1);
  });

  it('does nothing for a guest', async () => {
    signIn('ABC123');
    const fetchMock = mockBackend({
      'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    });

    renderHookWithQuery(() => useLinkRoomToAccount('ABC123'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(linkCalls(fetchMock)).toHaveLength(0);
  });

  it('does nothing while the room is not loaded', async () => {
    const fetchMock = mockBackend(sofiia);

    renderHookWithQuery(() => useLinkRoomToAccount(null));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(linkCalls(fetchMock)).toHaveLength(0);
  });

  it('tries again on the next visit after a failure, and accepts "already linked"', async () => {
    signIn('ABC123');
    const failing = mockBackend({
      ...sofiia,
      ...csrf,
      'POST /me/participants/link': { status: 500, body: { code: 'INTERNAL' } },
    });
    const first = renderHookWithQuery(() => useLinkRoomToAccount('ABC123'));
    await waitFor(() => expect(linkCalls(failing)).toHaveLength(1));
    first.unmount();
    failing.mockRestore();

    const taken = mockBackend({
      ...sofiia,
      ...csrf,
      'POST /me/participants/link': { status: 409, body: { code: 'PARTICIPANT_ALREADY_LINKED' } },
    });
    const second = renderHookWithQuery(() => useLinkRoomToAccount('ABC123'));
    await waitFor(() => expect(linkCalls(taken)).toHaveLength(1));
    second.unmount();

    // "already linked" counts as done: no third request
    await new Promise((resolve) => setTimeout(resolve, 20)); // let the answer be handled
    const callsBefore = taken.mock.calls.length;
    renderHookWithQuery(() => useLinkRoomToAccount('ABC123'));
    await waitFor(() => expect(taken.mock.calls.length).toBeGreaterThan(callsBefore));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(linkCalls(taken)).toHaveLength(1);
  });
});
