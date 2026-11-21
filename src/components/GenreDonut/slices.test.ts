import { legendName, roundPercents } from './slices.ts';

describe('roundPercents', () => {
  it('keeps the total at 100 where plain rounding gives 101', () => {
    const exact = [16.6, 16.6, 66.8];
    expect(exact.map((value) => Math.round(value))).toEqual([17, 17, 67]);
    expect(roundPercents(exact)).toEqual([17, 16, 67]);
  });

  it('gives the leftover points to the largest remainders', () => {
    expect(roundPercents([33.3, 33.3, 33.4])).toEqual([33, 33, 34]);
    expect(roundPercents([12.5, 12.5, 75])).toEqual([13, 12, 75]);
  });

  it('leaves whole numbers and an empty list alone', () => {
    expect(roundPercents([40, 35, 25])).toEqual([40, 35, 25]);
    expect(roundPercents([])).toEqual([]);
  });
});

describe('legendName', () => {
  it('shortens the long TMDB genre names as in the mockup', () => {
    expect(legendName('Science Fiction')).toBe('Sci-Fi');
    expect(legendName('Action & Adventure')).toBe('Action');
    expect(legendName('Comedy')).toBe('Comedy');
  });
});
