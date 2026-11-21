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

/** TMDB names that are too long for a chart legend -> the short names of the mockup */
const SHORT_NAMES: Record<string, string> = {
  'Science Fiction': 'Sci-Fi',
  'Sci-Fi & Fantasy': 'Sci-Fi',
  'Action & Adventure': 'Action',
  'War & Politics': 'War',
};

/** The genre's name as the legend shows it ("Science Fiction" -> "Sci-Fi"). */
export const legendName = (name: string): string => SHORT_NAMES[name] ?? name;

/** At most seven slices: the smallest genres are merged into "Other". */
export function toSlices(genres: GenreShare[]): { name: string; percent: number }[] {
  const sorted = [...genres].sort((a, b) => b.percent - a.percent);
  if (sorted.length <= MAX_SEGMENTS) return sorted;
  const shown = sorted.slice(0, MAX_SEGMENTS - 1);
  const rest = sorted.slice(MAX_SEGMENTS - 1).reduce((sum, genre) => sum + genre.percent, 0);
  return [...shown, { name: 'Other', percent: rest }];
}

/**
 * Whole percents that add up to the same total as the exact ones (usually 100): plain rounding of
 * 16.6 + 16.6 + 66.8 gives 17 + 17 + 67 = 101. The leftover points go to the shares that lost the
 * most when rounded down (the "largest remainder" rule), so every number moves by less than 1.
 */
export function roundPercents(percents: number[]): number[] {
  const floors = percents.map((percent) => Math.floor(percent));
  const target = Math.round(percents.reduce((sum, percent) => sum + percent, 0));
  let left = target - floors.reduce((sum, value) => sum + value, 0);
  const order = percents
    .map((percent, index) => ({ index, rest: percent - floors[index] }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order) {
    if (left <= 0) break;
    floors[index] += 1;
    left -= 1;
  }
  return floors;
}
