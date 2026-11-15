/**
 * Accounts: register, sign in, sign out, the current user, change or delete the account.
 * GET /auth/csrf, POST /auth/register, POST /auth/login, POST /auth/logout, GET /me,
 * PATCH /me, PUT /me/password, DELETE /me.
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

/**
 * A changing request (POST, PUT, PATCH, DELETE) to the account API with a fresh CSRF token.
 * `options.method` defaults to POST.
 */
export async function accountPost<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const csrf = await call<{ headerName: string; token: string }>('/auth/csrf');
  return call<T>(path, {
    ...options,
    method: options.method && options.method !== 'GET' ? options.method : 'POST',
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
 * Changes the account's name and/or email. Changing the email needs the current password;
 * the name alone does not. The new name is used for signing in from now on.
 * PATCH /me
 *
 * @throws {RoomApiError} USERNAME_TAKEN (field 'name'), EMAIL_TAKEN (field 'email'),
 *   INVALID_CURRENT_PASSWORD (field 'password'), VALIDATION_ERROR
 */
export async function updateAccount(changes: {
  name?: string;
  email?: string;
  currentPassword?: string;
}): Promise<User> {
  const data = await accountPost<UserDto>('/me', {
    method: 'PATCH',
    body: {
      displayName: changes.name,
      email: changes.email,
      currentPassword: changes.currentPassword,
    },
  });
  return toUser(data);
}

/**
 * Changes the password. The backend then ends this session: the person signs in again.
 * PUT /me/password (204)
 *
 * @throws {RoomApiError} INVALID_CURRENT_PASSWORD, PASSWORD_NOT_CHANGED, VALIDATION_ERROR
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await accountPost<null>('/me/password', { method: 'PUT', body: input });
}

/**
 * Deletes the account for good and ends the session. Finished sessions stay in the history of
 * the other players, without the name of this account.
 * DELETE /me (204)
 *
 * @throws {RoomApiError} INVALID_CURRENT_PASSWORD
 */
export async function deleteAccount(currentPassword: string): Promise<void> {
  await accountPost<null>('/me', { method: 'DELETE', body: { currentPassword } });
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
