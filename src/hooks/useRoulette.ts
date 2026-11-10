import { useCallback, useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** A fair random index: every winner has the same chance (1-1-1 -> 1/3 each). */
export function randomIndex(
  length: number,
  random: Pick<Crypto, 'getRandomValues'> = crypto,
): number {
  try {
    const value = new Uint32Array(1);
    random.getRandomValues(value);
    return value[0] % length;
  } catch {
    return Math.floor(Math.random() * length);
  }
}

/** The host's pick is kept in this tab, so it survives a reload. */
const pickKey = (code: string) => `roulette-pick:${String(code).toUpperCase()}`;

function readPick(code: string): number | null {
  try {
    return Number(sessionStorage.getItem(pickKey(code))) || null;
  } catch {
    return null;
  }
}

function savePick(code: string, id: number): void {
  try {
    sessionStorage.setItem(pickKey(code), String(id));
  } catch {
    // kept in memory only
  }
}

/**
 * Roulette over the round's winners (cards with winner: true). `spin()` runs a highlight over the
 * cards, slows down and stops on a random one (equal chances); with reduced motion it picks at once.
 */
export function useRoulette<T extends { id: number }>(code: string, winners: T[]) {
  const [pickId, setPickId] = useState(() => readPick(code));
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const spin = useCallback(() => {
    if (winners.length < 2) return;
    const target = randomIndex(winners.length);
    const finish = () => {
      setHighlightedId(null);
      setPickId(winners[target].id);
      savePick(code, winners[target].id);
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
    const steps = winners.length * 3 + target; // three full rounds, then stop on the target
    let step = 0;
    const tick = () => {
      setHighlightedId(winners[step % winners.length].id);
      if (step >= steps) {
        later(finish, 650);
        return;
      }
      step += 1;
      later(tick, 70 + (step / steps) ** 2 * 330); // slows down towards the end
    };
    setPickId(null);
    tick();
  }, [code, winners]);

  return {
    picked: winners.find((card) => card.id === pickId) ?? null,
    highlightedId,
    isSpinning: highlightedId !== null,
    spin,
  };
}
