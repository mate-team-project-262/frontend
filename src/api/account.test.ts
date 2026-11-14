import { mockBackend, signIn } from '../test/fixtures.ts';
import {
  getMovieIdentity,
  getSessionDetails,
  getSessionHistory,
  linkRoomToAccount,
} from './account.ts';
import { RoomApiError } from './errors.ts';

const title = { id: 5, title: 'Dune', year: 2024, posterUrl: 'https://img/x.jpg' };
const summary = {
  sessionId: 2,
  finishedAt: '2026-10-14T12:00:00Z',
  contentType: 'MOVIES',
  participantCount: 3,
  winnerTitles: [title],
  ratedCount: 20,
  likedCount: 8,
};

describe('account data API', () => {
  it('reads a page of the history in the frontend shape', async () => {
    const fetchMock = mockBackend({
      'GET /me/history?page=1&size=5': {
        items: [summary],
        page: 1,
        size: 5,
        totalElements: 6,
        totalPages: 2,
      },
    });

    const page = await getSessionHistory(1, 5);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(page).toMatchObject({ page: 1, size: 5, total: 6, totalPages: 2 });
    expect(page.items[0]).toEqual({
      id: 2,
      finishedAt: '2026-10-14T12:00:00Z',
      contentType: 'MOVIES',
      participantCount: 3,
      winners: [
        {
          id: 5,
          title: 'Dune',
          year: 2024,
          posterUrl: 'https://img/x.jpg',
          runtimeMin: null,
          rating: null,
        },
      ],
      ratedCount: 20,
      likedCount: 8,
    });
  });

  it('survives a session without winners', async () => {
    mockBackend({
      'GET /me/history?page=0&size=10': {
        items: [{ ...summary, winnerTitles: undefined }],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      },
    });

    expect((await getSessionHistory()).items[0].winners).toEqual([]);
  });

  it('reads the details of a session: people and cards in deck order', async () => {
    mockBackend({
      'GET /me/history/2': {
        session: summary,
        participants: [{ displayName: 'Sofiia', host: true, me: true }],
        cards: [
          { position: 1, title: { ...title, id: 6, title: 'Moana' }, likesCount: 1, winner: false },
          { position: 0, title, likesCount: 3, winner: true, myVote: true },
        ],
      },
    });

    const details = await getSessionDetails(2);

    expect(details.participants).toEqual([{ name: 'Sofiia', isHost: true, isMe: true }]);
    expect(details.cards.map((card) => card.title.title)).toEqual(['Dune', 'Moana']);
    expect(details.cards[0]).toMatchObject({ likes: 3, isWinner: true, myVote: true });
    // no vote from this person
    expect(details.cards[1].myVote).toBeNull();
  });

  it('reports a session that is not in the history by its code', async () => {
    mockBackend({
      'GET /me/history/9': { status: 404, body: { code: 'HISTORY_NOT_FOUND', message: 'x' } },
    });

    await expect(getSessionDetails(9)).rejects.toMatchObject({ code: 'HISTORY_NOT_FOUND' });
    await expect(getSessionDetails(9)).rejects.toBeInstanceOf(RoomApiError);
  });

  it('reads the movie identity: decades oldest first, missing parts as empty', async () => {
    mockBackend({
      'GET /me/movie-identity': {
        sessionsCount: 2,
        ratedCount: 40,
        likedCount: 10,
        genreMix: [{ id: 1, name: 'Drama', likesCount: 10, percentage: 100 }],
        favoriteGenre: { id: 1, name: 'Drama', likesCount: 10, percentage: 100 },
        leastLikedGenre: null,
        decadeMix: [
          { decade: 2020, label: '2020s', likedCount: 7, percentage: 70 },
          { decade: 1990, label: '1990s', likedCount: 3, percentage: 30 },
        ],
        favoriteDecade: { decade: 2020, label: '2020s', likedCount: 7, percentage: 70 },
      },
    });

    const identity = await getMovieIdentity();

    expect(identity.genreMix).toEqual([{ id: 1, name: 'Drama', likes: 10, percent: 100 }]);
    expect(identity.decadeMix.map((item) => item.label)).toEqual(['1990s', '2020s']);
    expect(identity.leastLikedGenre).toBeNull();
    expect(identity.favoriteActors).toEqual([]);
  });

  it('asks an account for the history: a guest gets AUTHENTICATION_REQUIRED', async () => {
    mockBackend({
      'GET /me/movie-identity': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    });

    await expect(getMovieIdentity()).rejects.toMatchObject({ code: 'AUTHENTICATION_REQUIRED' });
  });

  it('does not ask the backend to link a room this tab is not in', async () => {
    const fetchMock = mockBackend({});

    await linkRoomToAccount('ABC123');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes on a real linking failure, but not "already linked"', async () => {
    signIn('ABC123');
    const csrf = { 'GET /auth/csrf': { headerName: 'X-XSRF-TOKEN', token: 'c' } };
    mockBackend({
      ...csrf,
      'POST /me/participants/link': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    }).mockName('guest');
    await expect(linkRoomToAccount('ABC123')).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
    });

    vi.restoreAllMocks();
    mockBackend({
      ...csrf,
      'POST /me/participants/link': { status: 409, body: { code: 'PARTICIPANT_ALREADY_LINKED' } },
    });
    await expect(linkRoomToAccount('ABC123')).resolves.toBeUndefined();
  });
});
