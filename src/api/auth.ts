/**
 * Accounts: register, sign in, sign out, the current user.
 * GET /auth/csrf, POST /auth/register, POST /auth/login, POST /auth/logout, GET /me.
 *
 * The account lives in a session cookie (HttpOnly, set by the backend), so nothing is stored
 * here. Every POST under /auth and /me needs a CSRF token in a header: it is asked for right
 * before the request, which also covers the "refresh after sign in / out" rule of the backend.
 * Room pages keep using the participant token (roomSession.ts); the two do not replace each other.
 */
import { call } from './client.ts';
import { RoomApiError } from './errors.ts';
import type { RequestOptions } from './http.ts';
import type { User, UserDto } from './types.ts';

const toUser = (data: UserDto): User => ({
  id: data.id,
  email: data.email,
  name: data.displayName,
});

/** A POST to the account API with a fresh CSRF token. */
export async function accountPost<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const csrf = await call<{ headerName: string; token: string }>('/auth/csrf');
  return call<T>(path, {
    ...options,
    method: 'POST',
    headers: { ...options.headers, [csrf.headerName]: csrf.token },
  });
}

/**
 * Creates an account and signs the person in.
 * POST /auth/register
 *
 * @throws {RoomApiError} EMAIL_TAKEN (field 'email'), USERNAME_TAKEN (field 'name'), VALIDATION_ERROR
 */
export async function register(input: {
  email: string;
  name: string;
  password: string;
}): Promise<User> {
  const data = await accountPost<UserDto>('/auth/register', {
    body: { email: input.email, displayName: input.name, password: input.password },
  });
  return toUser(data);
}

/**
 * Signs in by the account name and password.
 * POST /auth/login
 *
 * @throws {RoomApiError} INVALID_CREDENTIALS (the same answer for a wrong name and a wrong password)
 */
export async function signIn(input: { name: string; password: string }): Promise<User> {
  const data = await accountPost<UserDto>('/auth/login', {
    body: { displayName: input.name, password: input.password },
  });
  return toUser(data);
}

/**
 * Ends the account session.
 * POST /auth/logout (204)
 */
export async function signOut(): Promise<void> {
  await accountPost<null>('/auth/logout');
}

/**
 * The signed-in account, or null for a guest (the backend answers 401).
 * GET /me
 *
 * @throws {RoomApiError} only for network / server problems
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return toUser(await call<UserDto>('/me'));
  } catch (error) {
    if (error instanceof RoomApiError && error.code === 'AUTHENTICATION_REQUIRED') return null;
    throw error;
  }
}
