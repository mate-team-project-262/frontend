import { ApiError, apiRequest } from './http.ts';

const respond = (status: number, body?: unknown) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('apiRequest', () => {
  it('sends JSON and the participant token to /api', async () => {
    const fetchMock = respond(200, { ok: true });
    await expect(
      apiRequest('/rooms', { method: 'POST', body: { a: 1 }, token: 't1' }),
    ).resolves.toEqual({
      ok: true,
    });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/rooms');
    expect(options?.method).toBe('POST');
    expect(options?.body).toBe('{"a":1}');
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Participant-Token': 't1',
    });
  });

  it('turns a backend error into ApiError with its code', async () => {
    respond(409, { code: 'NAME_TAKEN', message: 'taken', fieldErrors: [] });
    const error = await apiRequest('/rooms/X/join', { method: 'POST', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'NAME_TAKEN' });
  });

  it('handles errors without a JSON body (e.g. 502 from the gateway)', async () => {
    respond(502);
    await expect(apiRequest('/rooms')).rejects.toMatchObject({ status: 502, code: null });
  });

  it('reports a network failure as status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/rooms')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('returns null for 204 No Content (leave)', async () => {
    respond(204);
    await expect(apiRequest('/rooms/X/leave', { method: 'POST' })).resolves.toBeNull();
  });
});
