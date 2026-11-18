import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { initAnalytics, resetAnalytics } from '../../analytics/analytics.ts';
import { backendCard, mockBackend, signIn, testRoom } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import ResultsPage from './ResultsPage.tsx';

/** likes per card, e.g. [2, 2, 1, 0]; winners = all tied for the most (if > 0), like the backend */
function setup(likes: number[], { host = true, me = null as unknown } = {}) {
  signIn('ABC123', host ? 1 : 2);
  const top = Math.max(...likes);
  mockBackend({
    'GET /me': me ?? { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    'GET /rooms/ABC123/results': {
      totalParticipants: 2,
      cards: likes.map((count, i) => ({
        ...backendCard(i),
        likesCount: count,
        winner: top > 0 && count === top,
      })),
    },
  });
  return renderWithQuery(
    <MemoryRouter>
      <ResultsPage code="ABC123" room={testRoom(host ? 1 : 2, { status: 'FINISHED' })} />
    </MemoryRouter>,
  );
}

describe('ResultsPage', () => {
  it('offers a guest to create an account', async () => {
    setup([2, 1, 0]);
    expect(
      await screen.findByRole('button', { name: 'Save and build my profile' }),
    ).toBeInTheDocument();
  });

  it('does not offer an account to someone who is signed in', async () => {
    setup([2, 1, 0], { me: { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' } });
    await screen.findByRole('heading', { name: 'Tonight’s winner' });
    // the header shows the account once /me has answered
    await screen.findByRole('button', { name: 'Sofiia' });
    expect(
      screen.queryByRole('button', { name: 'Save and build my profile' }),
    ).not.toBeInTheDocument();
  });

  it('shows a single winner without the roulette', async () => {
    setup([2, 1, 0]);
    expect(await screen.findByRole('heading', { name: 'Tonight’s winner' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Movie 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Spin the roulette/ })).not.toBeInTheDocument();
  });

  it('lets the host spin the roulette between tied winners only', async () => {
    const user = userEvent.setup();
    setup([2, 2, 1]);
    expect(await screen.findByRole('heading', { name: 'Tonight’s winners' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Spin the roulette/ }));
    expect(await screen.findByRole('heading', { name: /watch this one/ })).toBeInTheDocument();
    const pick = screen.getByRole('article');
    expect(['Movie 1', 'Movie 2']).toContain(pick.getAttribute('aria-label'));
    expect(screen.getByRole('button', { name: /Spin again/ })).toBeInTheDocument();
  });

  it('does not show the roulette to guests', async () => {
    setup([2, 2, 1], { host: false });
    await screen.findByRole('heading', { name: 'Tonight’s winners' });
    expect(screen.queryByRole('button', { name: /Spin the roulette/ })).not.toBeInTheDocument();
  });

  it('lists the next best movies under "Also highly rated"', async () => {
    setup([2, 1, 1, 0]);
    await screen.findByRole('heading', { name: 'Also highly rated' });
    expect(screen.getAllByText('1 / 2 liked it')).toHaveLength(2);
  });

  it('reports the finished selection to analytics once, and never a "no match" round', async () => {
    initAnalytics({ enabled: true });
    const events = () =>
      (window.dataLayer ?? [])
        .map((entry) => Array.from(entry as ArrayLike<unknown>))
        .filter(([kind]) => kind === 'event')
        .map(([, name]) => name);

    const first = setup([2, 2, 1]);
    await screen.findByRole('heading', { name: 'Tonight’s winners' });
    expect(events()).toEqual(['movie_matched', 'selection_completed']);

    first.unmount(); // the same person reloads the page
    setup([2, 2, 1]);
    await screen.findByRole('heading', { name: 'Tonight’s winners' });
    expect(events()).toEqual(['movie_matched', 'selection_completed']);
    resetAnalytics();
  });

  it('shows "No match" when nobody liked anything', async () => {
    const user = userEvent.setup();
    setup([0, 0, 0, 0]);
    expect(await screen.findByRole('heading', { name: /No match/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Details/ })).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'View all' }));
    expect(screen.getAllByRole('button', { name: /^Details/ })).toHaveLength(4);
  });
});
