import { act, renderHook } from '@testing-library/react';
import { randomIndex, useRoulette } from './useRoulette.ts';

const winners = [{ id: 11 }, { id: 22 }, { id: 33 }];

describe('randomIndex', () => {
  it('gives every winner the same chance (1-1-1 -> 1/3 each)', () => {
    // feed every possible remainder: each index must come out equally often
    let next = 0;
    const fakeRandom = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        (array as unknown as Uint32Array)[0] = next++;
        return array;
      },
    };
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i += 1) counts[randomIndex(3, fakeRandom)] += 1;
    expect(counts).toEqual([1000, 1000, 1000]);
  });

  it('stays inside the list', () => {
    for (let i = 0; i < 200; i += 1) {
      const index = randomIndex(4);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
    }
  });
});

describe('useRoulette', () => {
  it('picks one of the winners and remembers it for this room', () => {
    const { result } = renderHook(() => useRoulette('ABC123', winners));
    expect(result.current.picked).toBeNull();
    act(() => result.current.spin()); // reduced motion in tests: picks at once
    expect(winners).toContain(result.current.picked);
    expect(sessionStorage.getItem('roulette-pick:ABC123')).toBe(String(result.current.picked?.id));
  });

  it('restores the pick after a reload', () => {
    sessionStorage.setItem('roulette-pick:ABC123', '22');
    const { result } = renderHook(() => useRoulette('ABC123', winners));
    expect(result.current.picked).toEqual({ id: 22 });
  });

  it('does nothing with a single winner', () => {
    const { result } = renderHook(() => useRoulette('ABC123', [{ id: 1 }]));
    act(() => result.current.spin());
    expect(result.current.picked).toBeNull();
  });
});
