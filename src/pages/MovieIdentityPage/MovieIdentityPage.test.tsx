import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import MovieIdentityPage from './MovieIdentityPage.tsx';

const me = { 'GET /me': { id: 1, email: 'sofiia@example.com', displayName: 'Sofiia' } };
const genre = (id: number, name: string, percentage: number) => ({
  id,
  name,
  likesCount: percentage,
  percentage,
});
const empty = {
  sessionsCount: 0,
  ratedCount: 0,
  likedCount: 0,
  genreMix: [],
  favoriteGenre: null,
  leastLikedGenre: null,
  decadeMix: [],
  favoriteDecade: null,
  favoriteActors: [],
};
const full = {
  ...empty,
  sessionsCount: 3,
  ratedCount: 60,
  likedCount: 24,
  genreMix: [genre(1, 'Sci-Fi', 60), genre(2, 'Drama', 40)],
  favoriteGenre: genre(1, 'Sci-Fi', 60),
  leastLikedGenre: {
    id: 7,
    name: 'Horror',
    dislikesCount: 9,
    ratedCount: 10,
    dislikePercentage: 90,
  },
  decadeMix: [
    { decade: 2020, label: '2020s', likedCount: 6, percentage: 25 },
    { decade: 2010, label: '2010s', likedCount: 18, percentage: 75 },
  ],
  favoriteDecade: { decade: 2010, label: '2010s', likedCount: 18, percentage: 75 },
  favoriteActors: [
    { name: 'Timothee Chalamet', likedTitlesCount: 3 },
    { name: 'Natalie Portman', likedTitlesCount: 2 },
  ],
};

function setup(identity: unknown) {
  mockBackend({ ...me, 'GET /me/movie-identity': identity });
  renderWithQuery(
    <MemoryRouter initialEntries={['/home/movie-identity']}>
      <Routes>
        <Route path="/home/movie-identity" element={<MovieIdentityPage />} />
        <Route path="/create-room" element={<h1>Create room page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

const card = (title: string) =>
  within(screen.getByRole('heading', { name: title }).parentElement as HTMLElement);

describe('MovieIdentityPage', () => {
  it('shows the genres, the eras and the actors', async () => {
    setup(full);

    const mix = within(
      (await screen.findByRole('heading', { name: 'Your genre mix' })).parentElement as HTMLElement,
    );
    expect(mix.getByText('24')).toBeInTheDocument();
    expect(mix.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Sci-Fi60%',
      'Drama40%',
    ]);

    expect(screen.getByText('Favorite genre').nextSibling).toHaveTextContent('Sci-Fi');
    expect(screen.getByText('Least liked genre').nextSibling).toHaveTextContent('Horror');

    // decades go oldest first
    expect(
      card('Favorite era')
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['2010s75%', '2020s25%']);

    const faces = card('Faces you like');
    expect(faces.getByText('Timothee Chalamet')).toBeInTheDocument();
    expect(faces.getByText('TC')).toBeInTheDocument();
    expect(faces.getByText('Natalie Portman')).toBeInTheDocument();
  });

  it('explains every card before the first likes', async () => {
    setup(empty);

    expect(await screen.findByText('Like a few movies to see genre distribution')).toBeVisible();
    expect(screen.getByText('Favorite genre').nextSibling).toHaveTextContent('-');
    expect(screen.getByText('Least liked genre').nextSibling).toHaveTextContent('-');
    expect(screen.getByText('We’ll show this after a few likes')).toBeInTheDocument();
    expect(screen.getByText('Actors from your liked movies will appear here')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Start a session' }));
    expect(screen.getByRole('heading', { name: 'Create room page' })).toBeInTheDocument();
  });

  it('fills only the cards that have data after a short first session', async () => {
    setup({ ...full, leastLikedGenre: null, favoriteActors: [] });

    expect(await screen.findByText('Based on the movies you’ve liked')).toBeInTheDocument();
    expect(screen.getByText('Least liked genre').nextSibling).toHaveTextContent('-');
    expect(screen.getByText('Actors from your liked movies will appear here')).toBeInTheDocument();
    expect(screen.getByText('Eras of the movies you liked')).toBeInTheDocument();
  });

  it('offers to try again when the data did not load', async () => {
    setup({ status: 500, body: { code: 'INTERNAL' } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your movie identity.',
    );
  });
});
