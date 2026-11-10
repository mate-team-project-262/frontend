import { getDurationRanges } from './duration.ts';

describe('getDurationRanges', () => {
  it.each([
    [[], []],
    [[90], [{ from: 0, to: 90 }]],
    [[150], [{ from: 0, to: 150 }]],
    [[90, 120], [{ from: 0, to: 120 }]],
    [[120, 150], [{ from: 90, to: 150 }]],
    [[90, 120, 150], [{ from: 0, to: 150 }]],
    [
      [90, 150],
      [
        { from: 0, to: 90 },
        { from: 120, to: 150 },
      ],
    ],
  ])('%j -> %j', (selected, expected) => {
    expect(getDurationRanges(selected)).toEqual(expected);
  });

  it('ignores the order of the ticked chips', () => {
    expect(getDurationRanges([150, 90])).toEqual(getDurationRanges([90, 150]));
  });
});
