/**
 * What the account keeps between sessions: the history of finished sessions and the taste
 * statistics ("Movie identity"). GET /me/history, GET /me/movie-identity. Both need the account
 * session (cookie); a guest gets AUTHENTICATION_REQUIRED.
 */
import { call } from './client.ts';
import { toPosterUrl } from './game.ts';
import type {
  GenreShare,
  HistoryPageDto,
  HistoryTitle,
  HistoryTitleDto,
  MovieIdentity,
  MovieIdentityDto,
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
