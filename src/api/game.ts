/**
 * The swiping game: the 20-movie deck, votes, everybody's progress and the round's results.
 * GET /rooms/{code}/deck, POST /rooms/{code}/votes, GET /rooms/{code}/progress,
 * GET /rooms/{code}/results. Pages use `MovieCard`, `GameProgress` and `RoundResults`.
 */
import { call, encode, requireSession } from './client.ts';
import { BASE_URL } from './http.ts';
import type {
  CardDto,
  Deck,
  DeckDto,
  GameProgress,
  MovieCard,
  ProgressDto,
  ResultCard,
  ResultsDto,
  RoundResults,
  VoteDto,
  VoteResult,
} from './types.ts';

/**
 * Who has finished voting (the "You're done!" screen). Available once the session has started.
 * GET /rooms/{code}/progress
 *
 * @throws {RoomApiError}
 */
export async function getProgress(code: string): Promise<GameProgress> {
  const session = requireSession(code);
  const data = await call<ProgressDto>(`/rooms/${encode(code)}/progress`, {
    token: session.token,
  });
  return {
    finished: data.finishedParticipants,
    total: data.totalParticipants,
    allFinished: data.allFinished,
    participants: data.participants.map((person) => ({
      id: person.id,
      name: person.displayName,
      isHost: person.host,
      isMe: person.id === session.participantId,
      finished: person.finished,
    })),
  };
}

/** Demo posters come from the backend itself (/demo/...), real ones are full TMDB links. */
export const toPosterUrl = (url: string | null | undefined): string | null =>
  url?.startsWith('/') ? `${BASE_URL}${url}` : (url ?? null);

/** Backend deck card -> MovieCard. */
function toMovieCard(card: CardDto): MovieCard {
  return {
    id: card.roomTitleId,
    position: card.position,
    title: card.title,
    year: card.year ?? null,
    overview: card.overview ?? null,
    posterUrl: toPosterUrl(card.posterUrl),
    runtimeMin: card.runtimeMinutes ?? null,
    genres: (card.genres ?? []).map((genre) => genre.name).filter(Boolean),
    rating: card.voteAverage ?? null,
    director: card.director ?? null,
    creators: card.creators ?? [],
    cast: card.cast ?? [],
    ageRating: card.ageRating ?? null,
    budget: card.budget ?? null,
    revenue: card.revenue ?? null,
    language: card.originalLanguage ?? null,
    myVote: card.myVote ?? null,
  };
}

/**
 * The room's 20 movies with this person's votes (available once the session has started).
 * GET /rooms/{code}/deck
 *
 * @throws {RoomApiError} ROOM_NOT_VOTING (not started yet), INVALID_TOKEN ...
 */
export async function getDeck(code: string): Promise<Deck> {
  const session = requireSession(code);
  const data = await call<DeckDto>(`/rooms/${encode(code)}/deck`, { token: session.token });
  return {
    contentType: data.contentType,
    cards: data.cards.map(toMovieCard).sort((a, b) => a.position - b.position),
    votedCount: data.votedCount,
  };
}

/**
 * Results of a finished round (room status FINISHED). The backend counts the likes when the last
 * person votes; `winner` = tied for the most likes, and only when at least one like was cast.
 * GET /rooms/{code}/results
 *
 * @throws {RoomApiError} RESULT_NOT_READY while someone is still voting
 */
export async function getResults(code: string): Promise<RoundResults> {
  const session = requireSession(code);
  const data = await call<ResultsDto>(`/rooms/${encode(code)}/results`, { token: session.token });
  const cards: ResultCard[] = data.cards.map((card) => ({
    ...toMovieCard(card),
    likes: card.likesCount ?? 0,
    isWinner: Boolean(card.winner),
  }));
  return { total: data.totalParticipants, cards, winners: cards.filter((card) => card.isWinner) };
}

/**
 * Saves a like (true) or a skip (false). Sending the same vote again is fine; a different vote
 * for the same movie is rejected with ALREADY_VOTED.
 * POST /rooms/{code}/votes
 *
 * @throws {RoomApiError}
 */
export async function voteForMovie(
  code: string,
  { cardId, liked }: { cardId: number; liked: boolean },
): Promise<VoteResult> {
  const session = requireSession(code);
  const data = await call<VoteDto>(`/rooms/${encode(code)}/votes`, {
    method: 'POST',
    token: session.token,
    body: { roomTitleId: cardId, isLiked: liked },
  });
  return {
    votedCount: data.votedCount,
    total: data.totalCards,
    finished: data.participantFinished,
  };
}
