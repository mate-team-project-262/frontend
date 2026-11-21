import { RoomApiError, toRoomApiError } from './errors.ts';
import { ApiError } from './http.ts';

const backend = (status: number, code: string | null, extra = {}) =>
  new ApiError({ status, code, message: 'x', ...extra });

describe('toRoomApiError', () => {
  it('maps a known code to a user message and the field to highlight', () => {
    const error = toRoomApiError(backend(409, 'NAME_TAKEN')) as RoomApiError;
    expect(error).toBeInstanceOf(RoomApiError);
    expect(error).toMatchObject({ code: 'NAME_TAKEN', field: 'name' });
    expect(error.message).toMatch(/already taken/);
  });

  it('puts room problems under the room field', () => {
    expect((toRoomApiError(backend(409, 'ROOM_FULL')) as RoomApiError).field).toBe('room');
  });

  it('recognises a name validation error', () => {
    const error = toRoomApiError(
      backend(400, 'VALIDATION_ERROR', {
        fieldErrors: [{ field: 'displayName', message: 'size' }],
      }),
    );
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', field: 'name' });
  });

  it.each([
    [0, 'NETWORK_ERROR'],
    [503, 'UNAVAILABLE'],
    [500, 'UNKNOWN'],
  ])('status %s becomes %s', (status, code) => {
    expect((toRoomApiError(backend(status, null)) as RoomApiError).code).toBe(code);
  });

  it('leaves other errors untouched', () => {
    const error = new Error('boom');
    expect(toRoomApiError(error)).toBe(error);
  });
});

describe('profile photo errors', () => {
  it('turns the gateway 413 and a file validation error into one clear message', () => {
    const tooBig = toRoomApiError(new ApiError({ status: 413, code: null, message: 'Too Large' }));
    expect(tooBig).toMatchObject({
      code: 'FILE_TOO_LARGE',
      field: 'file',
      message: 'Choose a JPG, PNG or WebP image up to 2 MB.',
    });

    const wrongType = toRoomApiError(
      new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fieldErrors: [{ field: 'file', message: 'Unsupported' }],
      }),
    );
    expect(wrongType).toMatchObject({ code: 'VALIDATION_ERROR', field: 'file' });
  });
});
