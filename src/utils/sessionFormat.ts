import type { HistoryTitle } from '../api/types.ts';

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
