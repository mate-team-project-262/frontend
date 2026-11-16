import { mockBackend } from '../test/fixtures.ts';
import {
  changePassword,
  checkResetToken,
  deleteAccount,
  getCurrentUser,
  register,
  requestPasswordReset,
  resetPassword,
  signIn,
  signOut,
  updateAccount,
} from './auth.ts';

const csrf = { 'GET /auth/csrf': { headerName: 'X-CSRF-TOKEN', token: 'csrf-1' } };
const anna = { id: 7, email: 'anna@example.com', displayName: 'Anna' };

/** [url, method, headers, body] of every request, in order */
const requests = (fetchMock: ReturnType<typeof mockBackend>) =>
  fetchMock.mock.calls.map(([url, options]) => ({
    url: String(url),
    method: options?.method ?? 'GET',
    headers: options?.headers as Record<string, string>,
    body: options?.body ? JSON.parse(String(options.body)) : undefined,
  }));

describe('account API', () => {
  it('registers with a fresh CSRF token and the backend field names', async () => {
    const fetchMock = mockBackend({ ...csrf, 'POST /auth/register': { status: 201, body: anna } });
    const user = await register({ email: 'anna@example.com', name: 'Anna', password: 'secret12' });

    expect(user).toEqual({ id: 7, email: 'anna@example.com', name: 'Anna' });
    const [first, second] = requests(fetchMock);
    expect(first.url).toBe('/api/auth/csrf');
    expect(second).toMatchObject({
      url: '/api/auth/register',
      method: 'POST',
      body: { email: 'anna@example.com', displayName: 'Anna', password: 'secret12' },
    });
    expect(second.headers['X-CSRF-TOKEN']).toBe('csrf-1');
  });

  it('signs in by name and password', async () => {
    const fetchMock = mockBackend({ ...csrf, 'POST /auth/login': anna });
    await expect(signIn({ name: 'Anna', password: 'secret12' })).resolves.toMatchObject({
      name: 'Anna',
    });
    expect(requests(fetchMock)[1].body).toEqual({ displayName: 'Anna', password: 'secret12' });
  });

  it.each([
    ['EMAIL_TAKEN', 'email'],
    ['USERNAME_TAKEN', 'name'],
  ])('%s points at the %s field', async (code, field) => {
    mockBackend({ ...csrf, 'POST /auth/register': { status: 409, body: { code } } });
    await expect(
      register({ email: 'a@b.co', name: 'Anna', password: 'secret12' }),
    ).rejects.toMatchObject({ code, field });
  });

  it('gives one message for a wrong name or password', async () => {
    mockBackend({
      ...csrf,
      'POST /auth/login': { status: 401, body: { code: 'INVALID_CREDENTIALS' } },
    });
    await expect(signIn({ name: 'Anna', password: 'x' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Wrong name or password. Please try again.',
    });
  });

  it('treats 401 from /me as "guest", not as an error', async () => {
    mockBackend({ 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } });
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it('returns the signed-in user', async () => {
    mockBackend({ 'GET /me': anna });
    await expect(getCurrentUser()).resolves.toEqual({
      id: 7,
      email: 'anna@example.com',
      name: 'Anna',
    });
  });

  it('changes the account with PATCH, PUT and DELETE, each with a CSRF token', async () => {
    const fetchMock = mockBackend({
      ...csrf,
      'PATCH /me': anna,
      'PUT /me/password': { status: 204, body: null },
      'DELETE /me': { status: 204, body: null },
    });

    await expect(updateAccount({ name: 'Anna' })).resolves.toEqual({
      id: 7,
      email: 'anna@example.com',
      name: 'Anna',
    });
    await changePassword({ currentPassword: 'old12345', newPassword: 'new12345' });
    await deleteAccount('new12345');

    const changes = requests(fetchMock).filter((request) => request.method !== 'GET');
    expect(changes.map(({ method, url, body }) => [method, url, body])).toEqual([
      ['PATCH', '/api/me', { displayName: 'Anna' }],
      ['PUT', '/api/me/password', { currentPassword: 'old12345', newPassword: 'new12345' }],
      ['DELETE', '/api/me', { currentPassword: 'new12345' }],
    ]);
    expect(changes.every((request) => request.headers['X-CSRF-TOKEN'] === 'csrf-1')).toBe(true);
  });

  it('resets a password: the email, the check of the link, the new password', async () => {
    const fetchMock = mockBackend({
      ...csrf,
      'POST /auth/forgot-password': { status: 202, body: {} },
      'GET /auth/reset-password/check?token=a%2Fb': { status: 204, body: null },
      'POST /auth/reset-password': { status: 204, body: null },
    });

    await requestPasswordReset('anna@example.com');
    await checkResetToken('a/b');
    await resetPassword({ token: 'a/b', newPassword: 'new12345' });

    const calls = requests(fetchMock).filter((request) => !request.url.endsWith('/csrf'));
    expect(calls.map(({ method, url, body }) => [method, url, body])).toEqual([
      ['POST', '/api/auth/forgot-password', { email: 'anna@example.com' }],
      ['GET', '/api/auth/reset-password/check?token=a%2Fb', undefined],
      ['POST', '/api/auth/reset-password', { token: 'a/b', newPassword: 'new12345' }],
    ]);
  });

  it('reads how long to wait after "too many requests"', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).endsWith('/csrf')
        ? new Response(JSON.stringify(csrf['GET /auth/csrf']))
        : new Response(JSON.stringify({ code: 'TOO_MANY_REQUESTS' }), {
            status: 429,
            headers: { 'Retry-After': '42' },
          }),
    );

    await expect(requestPasswordReset('anna@example.com')).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      retryAfter: 42,
    });
  });

  it('signs out with a CSRF token', async () => {
    const fetchMock = mockBackend({ ...csrf, 'POST /auth/logout': { status: 204, body: null } });
    await signOut();
    expect(requests(fetchMock)[1].headers['X-CSRF-TOKEN']).toBe('csrf-1');
  });
});
