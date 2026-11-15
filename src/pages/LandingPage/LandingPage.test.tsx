import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import LandingPage from './LandingPage.tsx';

/** ALT texts agreed with the marketing team: each meaningful image has its own, once. */
const ALTS = [
  'W2W – What To Watch',
  'Cozy home theater setup ready for a movie night.',
  'Friends enjoying popcorn together during a movie night.',
  'Friends using their smartphones to choose a movie together.',
  'Friends celebrating their movie choice together.',
  'Personal movie taste profile showing genre preferences and movie matches.',
];

describe('LandingPage images', () => {
  it('describes every meaningful image once and leaves decorative ones empty', async () => {
    mockBackend({ 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } });
    renderWithQuery(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: /Stop arguing about/ });

    const images = [...document.querySelectorAll('img')];
    expect(images.every((image) => image.hasAttribute('alt'))).toBe(true);
    const described = images.map((image) => image.alt).filter(Boolean);
    expect(described.sort()).toEqual([...ALTS].sort());

    // the six hero posters share one description
    expect(
      screen.getByRole('img', {
        name: 'Movie cards displayed for friends to discover and choose a movie together.',
      }),
    ).toBeInTheDocument();
    // the logo's ALT is the name of the link to the home page
    expect(screen.getByRole('link', { name: 'W2W – What To Watch' })).toHaveAttribute('href', '/');
  });
});
