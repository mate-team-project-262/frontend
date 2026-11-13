import type { GenreShare } from '../../api/roomsApi.ts';

/** Segment colours in the order of the genres (Figma "genre mix"). */
export const GENRE_COLORS = [
  '#7835ff',
  '#fc006e',
  '#fedb49',
  '#43e0a4',
  '#9beeff',
  '#c1eaff',
  '#cbcbff',
];
const MAX_SEGMENTS = GENRE_COLORS.length;

/** At most seven slices: the smallest genres are merged into "Other". */
export function toSlices(genres: GenreShare[]): { name: string; percent: number }[] {
  const sorted = [...genres].sort((a, b) => b.percent - a.percent);
  if (sorted.length <= MAX_SEGMENTS) return sorted;
  const shown = sorted.slice(0, MAX_SEGMENTS - 1);
  const rest = sorted.slice(MAX_SEGMENTS - 1).reduce((sum, genre) => sum + genre.percent, 0);
  return [...shown, { name: 'Other', percent: rest }];
}
