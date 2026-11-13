import { screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import SessionDetailsPage from './SessionDetailsPage.tsx';

const me = { 'GET /me': { id: 1, email: 'sofiia@example.com', displayName: 'Sofiia' } };
const title = (id: number, name: string) => ({
  id,
  title: name,
  year: 2024,
  posterUrl: null,
  runtimeMinutes: 167,
  voteAverage: 8.4,
});
const card = (position: number, name: string, likesCount: number, extra = {}) => ({
  position,
  title: title(position + 1, name),
  likesCount,
  winner: false,
  myVote: false,
  ...extra,
});
const details = (cards: unknown[]) => ({
  session: {
    sessionId: 2,
    finishedAt: '2026-10-14T12:00:00Z',
    contentType: 'MOVIES',
    participantCount: 3,
    winnerTitles: [],
    ratedCount: 3,
    likedCount: 1,
  },
  participants: [
    { displayName: 'Sofiia', host: true, me: true },
    { displayName: 'Anna', host: false, me: false },
    { displayName: 'Peter', host: false, me: false },
  ],
  cards,
});

function setup(path: string, routes: Record<string, unknown> = {}) {
  mockBackend({ ...me, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/home/sessions/:sessionId" element={<SessionDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionDetailsPage', () => {
  it('shows the winner, the people and every movie with its likes', async () => {
    setup('/home/sessions/2', {
      'GET /me/history/2': details([
        card(1, 'Moana', 1),
        card(0, 'Dune: Part Two', 3, { winner: true, myVote: true }),
        card(2, 'Verity', 0, { myVote: null }),
      ]),
    });

    expect(await screen.findByRole('heading', { name: 'Dune: Part Two' })).toBeInTheDocument();
    expect(screen.getByText('2024 • 2h 47m')).toBeInTheDocument();
    expect(screen.getByText('8.4 / 10')).toBeInTheDocument();
    expect(screen.getByText('Oct 14, 2026')).toBeInTheDocument();
    expect(screen.getByText('likes for winner').nextSibling).toHaveTextContent('3');

    expect(screen.getByText('Sofiia (you)')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Anna')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'All 3 movies in this session' })).toBeVisible();
    const movies = within(screen.getAllByRole('list')[1]).getAllByRole('listitem');
    // in the order of the deck, whatever order the backend sent
    expect(movies.map((item) => item.querySelector('p')?.textContent)).toEqual([
      'Dune: Part Two',
      'Moana',
      'Verity',
    ]);
    expect(movies[0]).toHaveTextContent('You liked it. Likes: 3 / 3');
    expect(movies[1]).toHaveTextContent('Likes: 1 / 3');
    expect(movies[1]).not.toHaveTextContent('You liked it');
  });

  it('says "No match" when nobody liked the same movie', async () => {
    setup('/home/sessions/2', { 'GET /me/history/2': details([card(0, 'Moana', 0)]) });

    expect(await screen.findByRole('heading', { name: 'No match' })).toBeInTheDocument();
  });

  it('names the movies that tied for first place', async () => {
    setup('/home/sessions/2', {
      'GET /me/history/2': details([
        card(0, 'Dune', 2, { winner: true }),
        card(1, 'Moana', 2, { winner: true }),
      ]),
    });

    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('Tied with Moana')).toBeInTheDocument();
  });

  it('explains that the session is not in the history', async () => {
    setup('/home/sessions/99', {
      'GET /me/history/99': { status: 404, body: { code: 'HISTORY_NOT_FOUND', message: 'x' } },
    });

    expect(await screen.findByRole('heading', { name: 'Session not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Sessions' })).toHaveAttribute(
      'href',
      '/home/sessions',
    );
  });

  it('does not ask the backend for a broken address', () => {
    setup('/home/sessions/abc');

    expect(screen.getByRole('heading', { name: 'Session not found' })).toBeInTheDocument();
  });

  it('offers to try again when the session did not load', async () => {
    setup('/home/sessions/2', { 'GET /me/history/2': { status: 500, body: { code: 'X' } } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this session.');
  });
});
