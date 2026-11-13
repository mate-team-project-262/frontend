import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import SessionsPage from './SessionsPage.tsx';

const me = { 'GET /me': { id: 1, email: 'sofiia@example.com', displayName: 'Sofiia' } };
const session = (sessionId: number, winner: string) => ({
  sessionId,
  finishedAt: '2026-10-28T12:00:00Z',
  contentType: 'MOVIES',
  participantCount: 4,
  winnerTitles: [{ id: sessionId, title: winner, year: 2024, posterUrl: null }],
  ratedCount: 20,
  likedCount: 8,
});
const page = (items: unknown[], pageIndex = 0, totalPages = 1) => ({
  items,
  page: pageIndex,
  size: 10,
  totalElements: 12,
  totalPages,
});
const identity = { sessionsCount: 12, ratedCount: 240, likedCount: 96, genreMix: [] };

function setup(routes: Record<string, unknown>) {
  mockBackend({ ...me, 'GET /me/movie-identity': identity, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={['/home/sessions']}>
      <Routes>
        <Route path="/home/sessions" element={<SessionsPage />} />
        <Route path="/home/sessions/:sessionId" element={<h1>Details page</h1>} />
        <Route path="/create-room" element={<h1>Create room page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionsPage', () => {
  it('shows the counters and the sessions', async () => {
    setup({ 'GET /me/history?page=0&size=10': page([session(3, 'Dune'), session(2, 'Moana')]) });

    expect(await screen.findByText('Winner: Dune')).toBeInTheDocument();
    expect(screen.getByText('Winner: Moana')).toBeInTheDocument();
    expect(screen.getAllByText('3 friends')).toHaveLength(2);
    expect(screen.getAllByText('You liked 8 of 20')).toHaveLength(2);
    expect(await screen.findByText('240')).toBeInTheDocument();
    expect(screen.getByText('96')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('opens the details of a session', async () => {
    setup({ 'GET /me/history?page=0&size=10': page([session(3, 'Dune')]) });

    await userEvent.click(await screen.findByRole('link', { name: 'View details' }));

    expect(screen.getByRole('heading', { name: 'Details page' })).toBeInTheDocument();
  });

  it('loads the next sessions on "Show more"', async () => {
    setup({
      'GET /me/history?page=0&size=10': page([session(3, 'Dune')], 0, 2),
      'GET /me/history?page=1&size=10': page([session(2, 'Moana')], 1, 2),
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Show more' }));

    expect(await screen.findByText('Winner: Moana')).toBeInTheDocument();
    expect(screen.getByText('Winner: Dune')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('invites to create a room when there are no sessions', async () => {
    setup({ 'GET /me/history?page=0&size=10': { ...page([]), totalElements: 0, totalPages: 0 } });

    const title = await screen.findByRole('heading', { name: 'No sessions yet' });
    // the header has its own "Create a room": press the one of the card
    const card = within(title.parentElement as HTMLElement);
    await userEvent.click(card.getByRole('button', { name: 'Create a room' }));

    expect(screen.getByRole('heading', { name: 'Create room page' })).toBeInTheDocument();
  });

  it('offers to try again when the list did not load', async () => {
    setup({ 'GET /me/history?page=0&size=10': { status: 500, body: { code: 'INTERNAL' } } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your sessions.');
    expect(screen.queryByText('No sessions yet')).not.toBeInTheDocument();
  });
});
