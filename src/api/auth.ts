/**
 * Accounts: register, sign in, sign out, the current user, change or delete the account.
 * GET /auth/csrf, POST /auth/register, POST /auth/login, POST /auth/logout, GET /me,
 * PATCH /me, PUT /me/password, DELETE /me, password reset (/auth/forgot-password,
 * /auth/reset-password).
 *
 * The account lives in a session cookie (HttpOnly, set by the backend), so nothing is stored
 * here. Every POST under /auth and /me needs a CSRF token in a header: it is asked for right
 * before the request, which also covers the "refresh after sign in / out" rule of the backend.
 * Room pages keep using the participant token (roomSession.ts); the two do not replace each other.
 */
import { call } from './client.ts';
import { RoomApiError } from './errors.ts';
import { BASE_URL, type RequestOptions } from './http.ts';
import type { User, UserDto } from './types.ts';

/** "/me/avatar/image?v=3" -> "/api/me/avatar/image?v=3": the backend gives paths under the API */
export const toApiUrl = (path: string | null | undefined): string | null =>
  path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null;

export const toUser = (data: UserDto): User => ({
  id: data.id,
  email: data.email,
  name: data.displayName,
  avatarUrl: toApiUrl(data.avatarUrl),
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
 * Sends a password reset link to this email. The answer is the same for an unknown email, so
 * nobody can find out who has an account. Once a minute per email at most.
 * POST /auth/forgot-password (202)
 *
 * @throws {RoomApiError} TOO_MANY_REQUESTS (with `retryAfter` seconds), VALIDATION_ERROR
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await accountPost<unknown>('/auth/forgot-password', { body: { email } });
}

/**
 * Whether the link from the email still works (it lives 20 minutes, works once, and a newer
 * email cancels it). Checking does not use it up.
 * GET /auth/reset-password/check?token= (204)
 *
 * @throws {RoomApiError} RESET_TOKEN_INVALID
 */
export async function checkResetToken(token: string): Promise<void> {
  await call<null>(`/auth/reset-password/check?token=${encodeURIComponent(token)}`);
}

/**
 * Sets a new password with the token from the email. Every session of the account ends; the
 * person signs in as usual afterwards.
 * POST /auth/reset-password (204)
 *
 * @throws {RoomApiError} RESET_TOKEN_INVALID, PASSWORD_NOT_CHANGED, VALIDATION_ERROR
 */
export async function resetPassword(input: { token: string; newPassword: string }): Promise<void> {
  await accountPost<null>('/auth/reset-password', { body: input });
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

/**
 * Sets the profile photo (JPG, PNG or WebP up to 2 MB; the page shrinks it first).
 * PUT /me/avatar (multipart/form-data, field "file") -> the account with the new avatarUrl
 *
 * @throws {RoomApiError} VALIDATION_ERROR or FILE_TOO_LARGE (field 'file')
 */
export async function uploadAvatar(file: Blob, fileName = 'avatar'): Promise<User> {
  const form = new FormData();
  form.append('file', file, fileName);
  const data = await accountPost<UserDto>('/me/avatar', { method: 'PUT', body: form });
  return toUser(data);
}

/**
 * Removes the profile photo; the initial is shown again.
 * DELETE /me/avatar (204)
 */
export async function removeAvatar(): Promise<void> {
  await accountPost<null>('/me/avatar', { method: 'DELETE' });
}
