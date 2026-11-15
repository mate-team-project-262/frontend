import type { HistoryTitle, SessionSummary } from '../api/types.ts';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** '2026-10-28T19:40:00Z' -> "Oct 28, 2026" (in the person's own time zone). */
export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

/** "Winner: Dune", "Winners: Dune +1" for a tie, "No match" when nobody liked anything. */
export function getWinnerLabel(winners: HistoryTitle[]): string {
  if (winners.length === 0) return 'No match';
  if (winners.length === 1) return `Winner: ${winners[0].title}`;
  return `Winners: ${winners[0].title} +${winners.length - 1}`;
}

/** Everyone in the session except the account's owner: 4 participants -> "3 friends". */
export function formatFriends(participantCount: number): string {
  const friends = Math.max(participantCount - 1, 0);
  return `${friends} ${friends === 1 ? 'friend' : 'friends'}`;
}

/** The person's own reaction in a session: "You liked 8 of 20". */
export const formatMyLikes = (liked: number, rated: number): string =>
  `You liked ${liked} of ${rated}`;

/** "S" for "Sofiia": the letter inside a participant's round avatar. */
export const getInitial = (name: string): string => name.trim().charAt(0).toUpperCase();

/**
 * The "+16" next to the small posters of a session: the movies shown nowhere in the row.
 * The winner and the previews may overlap (the backend does not promise either way), so each
 * movie is counted once. 0 = nothing to add.
 */
export function countHiddenMovies(
  session: Pick<SessionSummary, 'winners' | 'previews' | 'totalCards'>,
): number {
  if (session.totalCards === null) return 0;
  const shown = new Set([...session.winners.slice(0, 1), ...session.previews].map((t) => t.id));
  return Math.max(session.totalCards - shown.size, 0);
}

/** "4 / 4 likes": how many of the group liked the winner. */
export const formatWinnerLikes = (likes: number, people: number): string =>
  `${likes} / ${people} ${likes === 1 && people === 1 ? 'like' : 'likes'}`;
