import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App.tsx';
import { resetLinkedRooms } from './hooks/useLinkRoomToAccount.ts';
import { mockBackend } from './test/fixtures.ts';
import { renderWithQuery } from './test/render.tsx';

/**
 * The account flow through the real routes, with a small fake backend that remembers who is
 * signed in (like the session cookie does).
 */
const sofiia = { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' };
const emptyIdentity = { sessionsCount: 0, ratedCount: 0, likedCount: 0, genreMix: [] };
const emptyHistory = { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 };

function startApp(path: string, signedIn = false) {
  const state = { user: signedIn ? sofiia : null };
  const fetchMock = mockBackend({
    'GET /me': () => state.user ?? { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    'GET /auth/csrf': { headerName: 'X-XSRF-TOKEN', token: 'csrf-1' },
    'POST /auth/login': () => (state.user = sofiia),
    'POST /auth/register': () => ({ status: 201, body: (state.user = sofiia) }),
    'POST /auth/logout': () => {
      state.user = null;
      return { status: 204, body: null };
    },
    'GET /me/history?page=0&size=2': { ...emptyHistory, size: 2 },
    'GET /me/history?page=0&size=10': emptyHistory,
    'GET /me/movie-identity': emptyIdentity,
    'POST /rooms': {
      status: 201,
      body: {
        code: 'ABC123',
        participant: { id: 1, displayName: 'Sofiia', host: true, token: 't' },
      },
    },
    // wrapped in { status, body }: the room has its own `status` field
    'GET /rooms/ABC123': {
      status: 200,
      body: {
        code: 'ABC123',
        status: 'LOBBY',
        maxParticipants: 5,
        preferences: { contentType: 'MOVIES', genreIds: [], maxDurationMinutes: null },
        participants: [{ id: 1, displayName: 'Sofiia', host: true }],
      },
    },
    'POST /me/participants/link': { status: 204, body: null },
  });
  renderWithQuery(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return fetchMock;
}

const called = (fetchMock: ReturnType<typeof mockBackend>, path: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url) === `/api${path}`);

describe('account flow', () => {
  beforeEach(() => resetLinkedRooms());

  it('sends a guest from /home to Sign In, and after signing in shows the dashboard', async () => {
    const user = userEvent.setup();
    startApp('/home');

    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your name'), 'Sofiia');
    await user.type(screen.getByLabelText('Password'), 'secret12');
    // the header has its own "Sign In": press the one of the form
    const form = within(screen.getByRole('region', { name: 'Sign In' }));
    await user.click(form.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('heading', { name: /Welcome, Sofiia/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('walks through the tabs of a signed-in person', async () => {
    const user = userEvent.setup();
    startApp('/home', true);
    // every page draws the tabs again, so they are looked up each time
    const tab = (name: string) =>
      within(screen.getByRole('navigation', { name: 'Account sections' })).getByRole('link', {
        name,
      });
    await screen.findByRole('navigation', { name: 'Account sections' });

    await user.click(tab('Sessions'));
    expect(await screen.findByRole('heading', { name: 'Your movie history' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No sessions yet' })).toBeInTheDocument();
    expect(tab('Sessions')).toHaveAttribute('aria-current', 'page');

    await user.click(tab('Movie identity'));
    expect(await screen.findByRole('heading', { name: 'Your movie identity' })).toBeInTheDocument();

    await user.click(tab('Home'));
    expect(
      await screen.findByRole('heading', { name: /Start your first movie session/ }),
    ).toBeVisible();
  });

  it('opens the dashboard instead of the landing page for a signed-in person', async () => {
    startApp('/', true);

    expect(await screen.findByRole('heading', { name: /Welcome, Sofiia/ })).toBeInTheDocument();
  });

  it('logs out to the landing page, and /home is closed again', async () => {
    const user = userEvent.setup();
    const fetchMock = startApp('/home', true);

    await user.click(await screen.findByRole('button', { name: 'Sofiia' }));
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Log out' }),
    );

    expect(await screen.findByRole('heading', { name: /Stop arguing about/ })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Main' })).getByText('Sign In'),
    ).toBeVisible();
    expect(called(fetchMock, '/auth/logout')).toHaveLength(1);
  });

  it('signs up, creates a room without typing a name and ties the room to the account', async () => {
    const user = userEvent.setup();
    const fetchMock = startApp('/sign-up');

    await user.type(await screen.findByLabelText('Full name'), 'Sofiia');
    await user.type(screen.getByLabelText('Email address'), 'sofiia@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret12');
    await user.click(screen.getByRole('button', { name: /Create account/ }));
    await screen.findByRole('heading', { name: /Welcome, Sofiia/ });

    // two buttons lead to "Create room": the header one comes first
    await user.click(screen.getAllByRole('button', { name: 'Create a room' })[0]);
    expect(await screen.findByText('Signed in as Sofiia')).toBeInTheDocument();
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create room' }));

    expect(await screen.findByRole('heading', { name: 'Get everyone together' })).toBeVisible();
    const room = called(fetchMock, '/rooms')[0];
    expect(JSON.parse(String(room[1]?.body)).displayName).toBe('Sofiia');
    await waitFor(() => expect(called(fetchMock, '/me/participants/link')).toHaveLength(1));
    const headers = new Headers(called(fetchMock, '/me/participants/link')[0][1]?.headers);
    expect(headers.get('X-Participant-Token')).toBe('t');
  });
});
