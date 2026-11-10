import { act } from '@testing-library/react';
import { backendCard, mockBackend, signIn } from '../test/fixtures.ts';
import { renderHookWithQuery } from '../test/render.tsx';
import { useRoundResults } from './useRoundResults.ts';

const results = {
  totalParticipants: 2,
  cards: [backendCard(0, { likesCount: 2, winner: true }), backendCard(1, { likesCount: 0 })],
};

describe('useRoundResults', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    signIn();
  });
  afterEach(() => vi.useRealTimers());

  it('asks again every 3 seconds while the backend is still counting', async () => {
    let calls = 0;
    const fetchMock = mockBackend({
      'GET /rooms/ABC123/results': () =>
        ++calls < 3 ? { status: 409, body: { code: 'RESULT_NOT_READY' } } : results,
    });
    const { result } = renderHookWithQuery(() => useRoundResults('ABC123'));

    await act(() => vi.advanceTimersByTimeAsync(3500));
    expect(result.current.status).toBe('loading');

    await act(() => vi.advanceTimersByTimeAsync(3500));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe('ready');
    expect(result.current.results?.winners.map((card) => card.title)).toEqual(['Movie 1']);
  });

  it('shows other errors at once', async () => {
    mockBackend({ 'GET /rooms/ABC123/results': { status: 500, body: {} } });
    const { result } = renderHookWithQuery(() => useRoundResults('ABC123'));

    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current).toMatchObject({ status: 'error', results: null });
    expect(result.current.error).toMatch(/went wrong/);
  });
});
