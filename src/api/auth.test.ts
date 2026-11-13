import { mockBackend } from '../test/fixtures.ts';
import { getCurrentUser, register, signIn, signOut } from './auth.ts';

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

  it('signs out with a CSRF token', async () => {
    const fetchMock = mockBackend({ ...csrf, 'POST /auth/logout': { status: 204, body: null } });
    await signOut();
    expect(requests(fetchMock)[1].headers['X-CSRF-TOKEN']).toBe('csrf-1');
  });
});
