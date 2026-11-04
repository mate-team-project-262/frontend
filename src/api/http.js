/**
 * Thin fetch wrapper for the backend. Requests go to `/api/...` and the dev server proxies them
 * to the backend (see vite.config.js); set VITE_API_BASE_URL to use another address.
 *
 * POST requests are never retried automatically (the backend has no idempotency keys: a retry
 * after a lost response could create a second room or participant).
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** A failed backend call: `status` 0 = the server could not be reached. */
export class ApiError extends Error {
  constructor({ status, code, message, fieldErrors = [] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code; // backend error code, e.g. 'NAME_TAKEN' (null for plain HTTP errors)
    this.fieldErrors = fieldErrors; // [{ field, message }] for VALIDATION_ERROR
  }
}

/**
 * @param {string} path                       e.g. '/rooms'
 * @param {{ method?: string, body?: object, token?: string }} [options]
 *        `token` is sent in the X-Participant-Token header
 */
export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['X-Participant-Token'] = token;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Network error' });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: data?.code ?? null,
      message: data?.message ?? data?.error ?? response.statusText,
      fieldErrors: data?.fieldErrors ?? [],
    });
  }
  return data;
}
