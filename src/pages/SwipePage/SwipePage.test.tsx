import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { initAnalytics, resetAnalytics } from '../../analytics/analytics.ts';
import type { CardDto } from '../../api/types.ts';
import { backendCard, mockBackend, signIn, testRoom } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import SwipePage from './SwipePage.tsx';

function setup(cards: CardDto[]) {
  signIn('ABC123', 1);
  const votes: unknown[] = [];
  const fetchMock = mockBackend({
    'GET /rooms/ABC123/deck': {
      contentType: 'MOVIES',
      votedCount: 0,
      deckSize: cards.length,
      cards,
    },
    'POST /rooms/ABC123/votes': (body: unknown) => {
      votes.push(body);
      return {
        votedCount: votes.length,
        totalCards: cards.length,
        participantFinished: votes.length === cards.length,
      };
    },
    'GET /rooms/ABC123/progress': {
      finishedParticipants: 1,
      totalParticipants: 2,
      myFinished: true,
      allFinished: false,
      participants: [
        { id: 1, displayName: 'Anna', host: true, finished: true },
        { id: 2, displayName: 'Egor', host: false, finished: false },
      ],
    },
  });
  renderWithQuery(
    <MemoryRouter>
      <SwipePage code="ABC123" room={testRoom()} />
    </MemoryRouter>,
  );
  return { votes, fetchMock };
}

describe('SwipePage', () => {
  it('continues from the first movie without a vote', async () => {
    setup([backendCard(0, { myVote: true }), backendCard(1), backendCard(2)]);
    expect(await screen.findByRole('heading', { name: 'Movie 2' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  it('saves a like and a skip and moves to the next movie', async () => {
    const user = userEvent.setup();
    initAnalytics({ enabled: true });
    const { votes } = setup([backendCard(0), backendCard(1), backendCard(2)]);
    await screen.findByRole('heading', { name: 'Movie 1' });

    await user.click(screen.getByRole('button', { name: 'Like' }));
    expect(await screen.findByRole('heading', { name: 'Movie 2' })).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByRole('heading', { name: 'Movie 3' })).toBeInTheDocument();
    expect(votes).toEqual([
      { roomTitleId: 1, isLiked: true },
      { roomTitleId: 2, isLiked: false },
    ]);

    // analytics gets the direction and how the person voted
    const swipes = (window.dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter(([, name]) => name === 'movie_swiped')
      .map(([, , params]) => params);
    expect(swipes).toMatchObject([
      { swipe_direction: 'right', swipe_method: 'button', movie_title: 'Movie 1' },
      { swipe_direction: 'left', swipe_method: 'keyboard', movie_title: 'Movie 2' },
    ]);
    resetAnalytics();
  });

  it('shows the group progress after the last movie', async () => {
    const user = userEvent.setup();
    setup([backendCard(0)]);
    await screen.findByRole('heading', { name: 'Movie 1' });
    await user.click(screen.getByRole('button', { name: 'Like' }));
    expect(await screen.findByRole('heading', { name: 'You’re done!' })).toBeInTheDocument();
    expect(await screen.findByText('1 / 2 completed')).toBeInTheDocument();
    expect(screen.getByText('Waiting for Egor')).toBeInTheDocument();
  });

  it('opens the movie details and closes them with Escape', async () => {
    const user = userEvent.setup();
    setup([backendCard(0, { budget: 190000000 })]);
    await user.click(await screen.findByRole('button', { name: /More details/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('$190,000,000');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before leaving and tells the host about the role transfer', async () => {
    const user = userEvent.setup();
    setup([backendCard(0)]);
    await screen.findByRole('heading', { name: 'Movie 1' });
    await user.click(screen.getByRole('button', { name: /Leave room/ }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/host role will be transferred/);
    await user.click(screen.getByRole('button', { name: 'Stay in room' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
