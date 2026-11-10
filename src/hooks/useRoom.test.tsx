import { act, waitFor } from '@testing-library/react';
import { RoomApiError } from '../api/errors.ts';
import * as roomsApi from '../api/roomsApi.ts';
import type { Room } from '../api/roomsApi.ts';
import { renderHookWithQuery } from '../test/render.tsx';
import { useRoom } from './useRoom.ts';

vi.mock('../api/roomsApi.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof roomsApi>()),
  getRoom: vi.fn(),
}));

const getRoom = vi.mocked(roomsApi.getRoom);

const room: Room = {
  code: 'ABC123',
  status: 'LOBBY',
  participants: [],
  preferences: { contentType: 'MOVIES', genreIds: [], maxDurationMin: null },
  maxParticipants: 5,
};

describe('useRoom', () => {
  afterEach(() => vi.useRealTimers());

  it('loads the room', async () => {
    getRoom.mockResolvedValue(room);
    const { result } = renderHookWithQuery(() => useRoom('ABC123'));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.room).toEqual(room);
  });

  it.each([
    ['NO_SESSION', 'unauthorized'],
    ['INVALID_TOKEN', 'unauthorized'],
    ['ROOM_NOT_FOUND', 'not-found'],
    ['NETWORK_ERROR', 'error'],
  ])('%s -> %s', async (code, status) => {
    getRoom.mockRejectedValue(new RoomApiError('x', { code }));
    const { result } = renderHookWithQuery(() => useRoom('ABC123'));
    await waitFor(() => expect(result.current.status).toBe(status));
  });

  it('asks again every 3 seconds and applies the update', async () => {
    vi.useFakeTimers();
    getRoom.mockResolvedValueOnce(room).mockResolvedValue({ ...room, status: 'VOTING' });
    const { result } = renderHookWithQuery(() => useRoom('ABC123'));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.room?.status).toBe('LOBBY');

    await act(() => vi.advanceTimersByTimeAsync(3500));
    expect(getRoom).toHaveBeenCalledTimes(2);
    expect(result.current.room?.status).toBe('VOTING');
  });

  it('keeps the last known room when one poll fails (network)', async () => {
    vi.useFakeTimers();
    getRoom
      .mockResolvedValueOnce(room)
      .mockRejectedValue(new RoomApiError('x', { code: 'NETWORK_ERROR' }));
    const { result } = renderHookWithQuery(() => useRoom('ABC123'));
    await act(() => vi.advanceTimersByTimeAsync(0));
    await act(() => vi.advanceTimersByTimeAsync(3500));
    expect(getRoom).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('ready');
  });

  it('stops asking when the pass is no longer valid', async () => {
    vi.useFakeTimers();
    getRoom.mockRejectedValue(new RoomApiError('x', { code: 'INVALID_TOKEN' }));
    const { result } = renderHookWithQuery(() => useRoom('ABC123'));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.status).toBe('unauthorized');

    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(getRoom).toHaveBeenCalledTimes(1);
  });

  it('refresh() asks right away', async () => {
    getRoom.mockResolvedValueOnce(room).mockResolvedValue({ ...room, status: 'VOTING' });
    const { result } = renderHookWithQuery(() => useRoom('ABC123'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(() => result.current.refresh());
    await waitFor(() => expect(result.current.room?.status).toBe('VOTING'));
  });
});
