import { toSlices } from '../components/GenreDonut/slices.ts';
import {
  countHiddenMovies,
  formatFriends,
  formatSessionDate,
  formatWinnerLikes,
  getInitial,
  getWinnerLabel,
} from './sessionFormat.ts';

const title = (name: string, id = 1) => ({
  id,
  title: name,
  year: null,
  posterUrl: null,
  runtimeMin: null,
  rating: null,
  genres: [],
  likes: null,
});

describe('session texts', () => {
  it('formats the date like the design', () => {
    expect(formatSessionDate('2026-10-28T12:00:00Z')).toBe('Oct 28, 2026');
    expect(formatSessionDate('not a date')).toBe('');
  });

  it('names the winner, a tie and a round without a match', () => {
    expect(getWinnerLabel([title('Dune')])).toBe('Winner: Dune');
    expect(getWinnerLabel([title('Dune'), title('Moana'), title('F1')])).toBe('Winners: Dune +2');
    expect(getWinnerLabel([])).toBe('No match');
  });

  it('counts the movies of a session that the row does not show', () => {
    const previews = [title('A', 2), title('B', 3), title('C', 4)];
    // winner + 3 previews of 20
    expect(countHiddenMovies({ winners: [title('W', 1)], previews, totalCards: 20 })).toBe(16);
    // the winner is one of the previews: counted once
    expect(countHiddenMovies({ winners: [title('A', 2)], previews, totalCards: 20 })).toBe(17);
    expect(countHiddenMovies({ winners: [], previews, totalCards: 3 })).toBe(0);
    expect(countHiddenMovies({ winners: [], previews, totalCards: null })).toBe(0);
  });

  it('shows how many of the group liked the winner', () => {
    expect(formatWinnerLikes(4, 4)).toBe('4 / 4 likes');
    expect(formatWinnerLikes(1, 1)).toBe('1 / 1 like');
  });

  it('counts friends without the account owner', () => {
    expect(formatFriends(4)).toBe('3 friends');
    expect(formatFriends(2)).toBe('1 friend');
    expect(formatFriends(1)).toBe('0 friends');
  });

  it('takes the first letter of a name for the avatar', () => {
    expect(getInitial(' sofiia')).toBe('S');
    expect(getInitial('')).toBe('');
  });
});

describe('toSlices', () => {
  const genres = (percents: number[]) =>
    percents.map((percent, id) => ({ id, name: `G${id}`, likes: percent, percent }));

  it('keeps up to seven genres, biggest first', () => {
    expect(toSlices(genres([10, 40, 20])).map((slice) => slice.percent)).toEqual([40, 20, 10]);
  });

  it('merges the smallest genres into "Other"', () => {
    const slices = toSlices(genres([24, 19, 17, 14, 11, 8, 4, 3]));
    expect(slices).toHaveLength(7);
    expect(slices[6]).toEqual({ name: 'Other', percent: 7 });
  });
});
