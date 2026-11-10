import {
  formatLanguage,
  formatList,
  formatMoney,
  formatRating,
  formatRuntime,
  getMetaParts,
} from './movieFormat.ts';

describe('movieFormat', () => {
  it.each([
    [167, '2h 47m'],
    [120, '2h'],
    [45, '45m'],
    [0, null],
    [null, null],
  ])('formatRuntime(%s) = %s', (minutes, text) => {
    expect(formatRuntime(minutes)).toBe(text);
  });

  it('joins genres like the design', () => {
    expect(formatList(['Sci-Fi', 'Action', 'Adventure'])).toBe('Sci-Fi, Action, and Adventure');
    expect(formatList([])).toBeNull();
  });

  it('rounds the rating to one digit and hides zero', () => {
    expect(formatRating(7.94)).toBe('7.9');
    expect(formatRating(0)).toBeNull();
  });

  it('formats money in dollars and hides unknown values', () => {
    expect(formatMoney(190000000)).toBe('$190,000,000');
    expect(formatMoney(null)).toBeNull();
  });

  it('turns a language code into its name', () => {
    expect(formatLanguage('en')).toBe('English');
    expect(formatLanguage(null)).toBeNull();
  });

  it('builds the meta line without empty parts', () => {
    expect(getMetaParts({ year: 2024, runtimeMin: null, genres: ['Drama'] })).toEqual([
      '2024',
      'Drama',
    ]);
  });
});
