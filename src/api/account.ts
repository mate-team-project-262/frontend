/**
 * What the account keeps between sessions: the history of finished sessions and the taste
 * statistics ("Movie identity"). GET /me/history, GET /me/history/{sessionId},
 * GET /me/movie-identity, POST /me/participants/link. All need the account session (cookie); a guest gets
 * AUTHENTICATION_REQUIRED.
 */
import { accountPost } from './auth.ts';
import { call } from './client.ts';
import { errorCode } from './errors.ts';
import { toPosterUrl } from './game.ts';
import { getRoomSession } from './roomSession.ts';
import type {
  GenreShare,
  HistoryPageDto,
  HistoryTitle,
  HistoryTitleDto,
  MovieIdentity,
  MovieIdentityDto,
  SessionDetails,
  SessionDetailsDto,
  SessionHistoryPage,
  SessionSummaryDto,
  SessionSummary,
} from './types.ts';

export const toHistoryTitle = (title: HistoryTitleDto): HistoryTitle => ({
  id: title.id,
  title: title.title,
  year: title.year ?? null,
  posterUrl: toPosterUrl(title.posterUrl),
  runtimeMin: title.runtimeMinutes ?? null,
  rating: title.voteAverage ?? null,
});

export const toSessionSummary = (session: SessionSummaryDto): SessionSummary => ({
  id: session.sessionId,
  finishedAt: session.finishedAt,
  contentType: session.contentType,
  participantCount: session.participantCount,
  winners: (session.winnerTitles ?? []).map(toHistoryTitle),
  ratedCount: session.ratedCount,
  likedCount: session.likedCount,
});

/**
 * Finished sessions of the account, newest first.
 * GET /me/history?page=&size=
 *
 * @param page zero-based
 * @param size 1-50
 * @throws {RoomApiError} AUTHENTICATION_REQUIRED for a guest
 */
export async function getSessionHistory(page = 0, size = 10): Promise<SessionHistoryPage> {
  const data = await call<HistoryPageDto>(`/me/history?page=${page}&size=${size}`);
  return {
    items: data.items.map(toSessionSummary),
    page: data.page,
    size: data.size,
    total: data.totalElements,
    totalPages: data.totalPages,
  };
}

/**
 * One finished session: who played and how the group reacted to every movie.
 * GET /me/history/{sessionId}
 *
 * @throws {RoomApiError} HISTORY_NOT_FOUND when the account did not play in this session
 */
export async function getSessionDetails(sessionId: number): Promise<SessionDetails> {
  const data = await call<SessionDetailsDto>(`/me/history/${sessionId}`);
  return {
    session: toSessionSummary(data.session),
    participants: (data.participants ?? []).map((person) => ({
      name: person.displayName,
      isHost: person.host,
      isMe: person.me,
    })),
    cards: [...(data.cards ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((card) => ({
        title: toHistoryTitle(card.title),
        likes: card.likesCount,
        isWinner: card.winner,
        myVote: card.myVote ?? null,
      })),
  };
}

const toGenreShare = (genre: {
  id: number;
  name: string;
  likesCount: number;
  percentage: number;
}): GenreShare => ({
  id: genre.id,
  name: genre.name,
  likes: genre.likesCount,
  percent: genre.percentage,
});

/**
 * Taste statistics built from the movies the person liked and skipped.
 * GET /me/movie-identity
 *
 * @throws {RoomApiError} AUTHENTICATION_REQUIRED for a guest
 */
export async function getMovieIdentity(): Promise<MovieIdentity> {
  const data = await call<MovieIdentityDto>('/me/movie-identity');
  return {
    sessionsCount: data.sessionsCount,
    ratedCount: data.ratedCount,
    likedCount: data.likedCount,
    genreMix: (data.genreMix ?? []).map(toGenreShare),
    favoriteGenre: data.favoriteGenre ? toGenreShare(data.favoriteGenre) : null,
    leastLikedGenre: data.leastLikedGenre
      ? {
          id: data.leastLikedGenre.id,
          name: data.leastLikedGenre.name,
          dislikePercent: data.leastLikedGenre.dislikePercentage,
        }
      : null,
    decadeMix: (data.decadeMix ?? [])
      .map((item) => ({
        decade: item.decade,
        label: item.label,
        likes: item.likedCount,
        percent: item.percentage,
      }))
      .sort((a, b) => a.decade - b.decade),
    favoriteDecade: data.favoriteDecade ?? null,
    favoriteActors: (data.favoriteActors ?? []).map((actor) => ({
      name: actor.name,
      likedTitles: actor.likedTitlesCount,
    })),
  };
}

/**
 * Ties the person's place in a room to the signed-in account, so the finished session appears
 * in the account's history. Safe to repeat. Does nothing when this tab has no pass for the room.
 * POST /me/participants/link (X-Participant-Token + account cookie + CSRF)
 *
 * PARTICIPANT_ALREADY_LINKED (the place belongs to another account, or the account already has
 * a place in this room) is not an error for the page: there is nothing left to do.
 *
 * @throws {RoomApiError} AUTHENTICATION_REQUIRED, INVALID_TOKEN, a network error...
 */
export async function linkRoomToAccount(code: string): Promise<void> {
  const session = getRoomSession(code);
  if (!session) return;
  try {
    await accountPost<void>('/me/participants/link', { token: session.token });
  } catch (error) {
    if (errorCode(error) !== 'PARTICIPANT_ALREADY_LINKED') throw error;
  }
}
