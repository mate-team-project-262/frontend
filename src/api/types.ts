/**
 * Shapes the pages work with (camelCase, our own names) and, at the bottom, the raw JSON of the
 * backend (`*Dto`). Only api/rooms.ts and api/game.ts know the Dto types.
 */
export type ContentType = 'MOVIES' | 'TV_SERIES';
export type RoomStatus = 'LOBBY' | 'VOTING' | 'FINISHED';

export interface CreateRoomPayload {
  /** 3-20 characters */
  hostName: string;
  contentType: ContentType;
  /** Backend genre ids for the content type. Empty = any */
  genreIds: number[];
  /**
   * Durations the host ticked (90, 120, 150). Empty = no limit. What they mean:
   * getDurationRanges() in utils/duration.ts. The backend takes ONE number (`maxDurationMinutes`),
   * so the longest time is sent; the exact ranges go out too once FEATURES.durationRanges is on.
   */
  durationsMin: number[];
}

export interface Participant {
  id: number;
  name: string;
  isHost: boolean;
  /** true for the person who is looking at the page */
  isMe: boolean;
}

export interface RoomPreferences {
  contentType: ContentType;
  genreIds: number[];
  maxDurationMin: number | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  /** Everyone in the room, host included, ordered by id */
  participants: Participant[];
  preferences: RoomPreferences;
  maxParticipants: number;
}

/** One movie of the room's 20-card deck */
export interface MovieCard {
  /** roomTitleId - what a vote is sent for */
  id: number;
  /** 0-19, the same order for everyone */
  position: number;
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  /** for TV shows: the length of an episode */
  runtimeMin: number | null;
  /** names, e.g. ['Action', 'Comedy'] */
  genres: string[];
  /** TMDB vote average, 0-10 */
  rating: number | null;
  director: string | null;
  /** TV shows: "Created by" */
  creators: string[];
  /** in billing order */
  cast: string[];
  /** e.g. 'PG-13' (US) */
  ageRating: string | null;
  /** USD */
  budget: number | null;
  /** USD */
  revenue: number | null;
  /** ISO 639-1 code, e.g. 'en' */
  language: string | null;
  /** true = liked, false = skipped, null = not voted yet */
  myVote: boolean | null;
}

export interface Deck {
  contentType: ContentType;
  /** in position order */
  cards: MovieCard[];
  /** how many of them this person has voted for */
  votedCount: number;
}

export interface ProgressParticipant extends Participant {
  finished: boolean;
}

export interface GameProgress {
  /** people who voted for every movie */
  finished: number;
  /** people in the room */
  total: number;
  allFinished: boolean;
  participants: ProgressParticipant[];
}

export interface ResultCard extends MovieCard {
  likes: number;
  isWinner: boolean;
}

export interface RoundResults {
  /** people in the room at the end of the round */
  total: number;
  /** all 20, most liked first */
  cards: ResultCard[];
  /** the cards tied for the most likes (empty = no match) */
  winners: ResultCard[];
}

export interface VoteResult {
  votedCount: number;
  total: number;
  finished: boolean;
}

/* ---- Backend JSON (docs/frontend-api.md of the backend repository) ---- */

export interface ParticipantDto {
  id: number;
  displayName: string;
  host: boolean;
  token?: string;
  finished?: boolean;
}

export interface RoomDto {
  code: string;
  status: RoomStatus;
  maxParticipants: number;
  preferences?: {
    contentType: ContentType;
    genreIds?: number[];
    maxDurationMinutes?: number | null;
  };
  participants: ParticipantDto[];
}

export interface CreateRoomDto {
  code: string;
  participant: ParticipantDto & { token: string };
}

export interface JoinRoomDto {
  code: string;
  currentParticipant: ParticipantDto & { token: string };
}

export interface CardDto {
  roomTitleId: number;
  position: number;
  title: string;
  year?: number | null;
  overview?: string | null;
  posterUrl?: string | null;
  runtimeMinutes?: number | null;
  genres?: { id: number; name: string }[];
  voteAverage?: number | null;
  director?: string | null;
  creators?: string[];
  cast?: string[];
  ageRating?: string | null;
  budget?: number | null;
  revenue?: number | null;
  originalLanguage?: string | null;
  myVote?: boolean | null;
  likesCount?: number;
  winner?: boolean;
}

export interface DeckDto {
  contentType: ContentType;
  cards: CardDto[];
  votedCount: number;
}

export interface ProgressDto {
  finishedParticipants: number;
  totalParticipants: number;
  allFinished: boolean;
  participants: (ParticipantDto & { finished: boolean })[];
}

export interface ResultsDto {
  totalParticipants: number;
  cards: CardDto[];
}

export interface VoteDto {
  votedCount: number;
  totalCards: number;
  participantFinished: boolean;
}
