import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import HomePage from './HomePage.tsx';

const me = { 'GET /me': { id: 1, email: 'sofiia@example.com', displayName: 'Sofiia' } };
const title = (id: number, name: string) => ({ id, title: name, year: 2024, posterUrl: null });
const session = (sessionId: number, winner: string, participantCount: number) => ({
  sessionId,
  finishedAt: '2026-10-28T12:00:00Z',
  contentType: 'MOVIES',
  participantCount,
  winnerTitles: [title(sessionId, winner)],
  ratedCount: 20,
  likedCount: 8,
});
const page = (items: unknown[]) => ({
  items,
  page: 0,
  size: 2,
  totalElements: items.length,
  totalPages: 1,
});
const genre = (id: number, name: string, percentage: number) => ({
  id,
  name,
  likesCount: percentage,
  percentage,
});
const emptyIdentity = { sessionsCount: 0, ratedCount: 0, likedCount: 0, genreMix: [] };

function setup(routes: Record<string, unknown>) {
  mockBackend({ ...me, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-room" element={<h1>Create room page</h1>} />
        <Route path="/home/sessions" element={<h1>Sessions page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('welcomes a new user and explains the empty cards', async () => {
    setup({ 'GET /me/history?page=0&size=2': page([]), 'GET /me/movie-identity': emptyIdentity });

    expect(await screen.findByRole('heading', { name: /Welcome, Sofiia/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Start your first movie session' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/will appear here after your first session/)).toBeInTheDocument();
    expect(screen.getByText(/Complete a session to start building/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View all/ })).not.toBeInTheDocument();
  });

  it('shows the latest sessions and the genre mix', async () => {
    setup({
      'GET /me/history?page=0&size=2': page([
        session(3, 'Spider Man', 5),
        session(2, 'Dune: Part Two', 2),
      ]),
      'GET /me/movie-identity': {
        sessionsCount: 12,
        ratedCount: 240,
        likedCount: 96,
        genreMix: [genre(1, 'Sci-Fi', 24), genre(2, 'Drama', 19), genre(3, 'Comedy', 14)],
      },
    });

    expect(await screen.findByText('Winner: Spider Man')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /What to Watch, Sofiia/ })).toBeInTheDocument();
    expect(screen.getByText('Winner: Dune: Part Two')).toBeInTheDocument();
    expect(screen.getByText('4 friends')).toBeInTheDocument();
    expect(screen.getByText('1 friend')).toBeInTheDocument();
    expect(screen.getAllByText('Oct 28, 2026')).toHaveLength(2);

    expect(await screen.findByText('96')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('24%')).toBeInTheDocument();
  });

  it('opens "Create room" and the full list of sessions', async () => {
    const user = userEvent.setup();
    setup({
      'GET /me/history?page=0&size=2': page([session(3, 'Spider Man', 3)]),
      'GET /me/movie-identity': emptyIdentity,
    });
    await user.click(await screen.findByRole('link', { name: /View all/ }));
    expect(screen.getByRole('heading', { name: 'Sessions page' })).toBeInTheDocument();
  });

  it('says so when the sessions could not be loaded, without calling it a first visit', async () => {
    setup({
      'GET /me/history?page=0&size=2': { status: 503, body: {} },
      'GET /me/movie-identity': emptyIdentity,
    });
    expect(await screen.findByText(/Could not load your sessions/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /What to Watch, Sofiia/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
