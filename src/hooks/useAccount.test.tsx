import { act, waitFor } from '@testing-library/react';
import { mockBackend } from '../test/fixtures.ts';
import { renderHookWithQuery } from '../test/render.tsx';
import { useAccount } from './useAccount.ts';

const sofiia = { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' };

describe('useAccount', () => {
  it('is "loading" first and then knows the signed-in person', async () => {
    mockBackend({ 'GET /me': sofiia });
    const { result } = renderHookWithQuery(() => useAccount());

    expect(result.current).toMatchObject({ status: 'loading', user: null });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));
    expect(result.current.user).toEqual({ id: 7, email: 'sofiia@example.com', name: 'Sofiia' });
  });

  it('treats 401 as a guest', async () => {
    mockBackend({ 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } });
    const { result } = renderHookWithQuery(() => useAccount());

    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
  });

  it('keeps the public pages working as a guest when the server cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderHookWithQuery(() => useAccount());

    await waitFor(() => expect(result.current.status).toBe('guest'));
  });

  it('takes the user from the sign-in form without asking the backend again', async () => {
    const fetchMock = mockBackend({
      'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    });
    const { result } = renderHookWithQuery(() => useAccount());
    await waitFor(() => expect(result.current.status).toBe('guest'));

    act(() => result.current.setUser({ id: 7, email: 'sofiia@example.com', name: 'Sofiia' }));
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    act(() => result.current.setUser(null));
    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
