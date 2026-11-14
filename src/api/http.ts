/**
 * Thin fetch wrapper for the backend. Requests go to `/api/...` and the dev server proxies them
 * to the backend (see vite.config.js); set VITE_API_BASE_URL to use another address.
 *
 * POST requests are never retried automatically (the backend has no idempotency keys: a retry
 * after a lost response could create a second room or participant).
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** A failed backend call: `status` 0 = the server could not be reached. */
export interface FieldError {
  field: string;
  message: string;
}

interface ApiErrorInit {
  status: number;
  code: string | null;
  message: string;
  fieldErrors?: FieldError[];
}

export class ApiError extends Error {
  status: number;
  /** backend error code, e.g. 'NAME_TAKEN' (null for plain HTTP errors) */
  code: string | null;
  /** filled for VALIDATION_ERROR */
  fieldErrors: FieldError[];

  constructor({ status, code, message, fieldErrors = [] }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** sent in the X-Participant-Token header */
  token?: string;
  /** extra request headers, e.g. the CSRF token of the account API */
  headers?: Record<string, string>;
}

/**
 * @param path  e.g. '/rooms'
 * @returns the parsed JSON body (null for empty answers). The caller says what shape it expects.
 */
export async function apiRequest<T = unknown>(
  path: string,
  { method = 'GET', body, token, headers: extraHeaders }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['X-Participant-Token'] = token;

  let response: Response;
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
  return data as T;
}
