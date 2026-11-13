import type { MovieIdentity } from '../api/types.ts';

type Decade = MovieIdentity['decadeMix'][number];

/** "Timothee Chalamet" -> "TC", "Zendaya" -> "Z": the letters inside an actor's round avatar. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/** The `count` decades with the most likes, shown oldest first (the card has room for four). */
export function pickDecades(decades: Decade[], count = 4): Decade[] {
  return [...decades]
    .sort((a, b) => b.likes - a.likes || b.decade - a.decade)
    .slice(0, count)
    .sort((a, b) => a.decade - b.decade);
}

/** How much of the track the longest bar takes: the design never fills the track to the end. */
const LONGEST_BAR = 68;

/** Width of a decade's bar in % of the track, in proportion to the biggest share `top`. */
export const getBarWidth = (percent: number, top: number): number =>
  top > 0 ? Math.round((Math.max(percent, 0) / top) * LONGEST_BAR) : 0;
