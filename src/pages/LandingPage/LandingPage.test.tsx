import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import {
  flushProductEvents,
  initProductEvents,
  resetProductEvents,
} from '../../analytics/productEvents.ts';
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

describe('LandingPage product events', () => {
  afterEach(() => resetProductEvents());

  it('reports the main buttons of the landing page', async () => {
    const fetchMock = mockBackend({
      'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
      'POST /event': { status: 202, body: null },
    });
    initProductEvents({ enabled: true });
    renderWithQuery(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: /Stop arguing about/ });

    await userEvent.click(screen.getByRole('button', { name: 'Join a room' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create free account' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    flushProductEvents();

    const sent = fetchMock.mock.calls
      .filter(([url]) => String(url).endsWith('/event'))
      .flatMap(([, options]) => JSON.parse(String(options?.body)).events);
    expect(
      sent.map((event: { name: string; params?: unknown }) => [event.name, event.params]),
    ).toEqual([
      ['join_room_clicked', { source: 'landing' }],
      ['sign_up_clicked', { source: 'landing' }],
      ['guest_start_clicked', undefined],
    ]);
  });
});
