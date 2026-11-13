import { getBarWidth, getInitials, pickDecades } from './identityFormat.ts';

const decade = (year: number, likes: number) => ({
  decade: year,
  label: `${year}s`,
  likes,
  percent: likes,
});

describe('identityFormat', () => {
  it('makes initials from the first and the last word', () => {
    expect(getInitials('Timothee Chalamet')).toBe('TC');
    expect(getInitials('Robert Downey Jr.')).toBe('RJ');
    expect(getInitials(' zendaya ')).toBe('Z');
    expect(getInitials('')).toBe('');
  });

  it('keeps the four most liked decades, oldest first', () => {
    const picked = pickDecades([
      decade(1970, 1),
      decade(1990, 8),
      decade(2000, 17),
      decade(2010, 42),
      decade(2020, 33),
    ]);
    expect(picked.map((item) => item.label)).toEqual(['1990s', '2000s', '2010s', '2020s']);
  });

  it('sizes the bars against the biggest share', () => {
    expect(getBarWidth(42, 42)).toBe(68);
    expect(getBarWidth(21, 42)).toBe(34);
    expect(getBarWidth(0, 42)).toBe(0);
    expect(getBarWidth(0, 0)).toBe(0);
  });
});
