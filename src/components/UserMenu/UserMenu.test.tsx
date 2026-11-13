import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import LandingHeader from '../LandingHeader/LandingHeader.tsx';

const sofiia = { id: 1, email: 'sofiia@example.com', displayName: 'Sofiia' };
const csrf = { 'GET /auth/csrf': { headerName: 'X-CSRF-TOKEN', token: 't' } };

function setup(routes: Record<string, unknown>) {
  const fetchMock = mockBackend({ 'GET /me': sofiia, ...csrf, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={['/somewhere']}>
      <Routes>
        <Route path="/somewhere" element={<LandingHeader />} />
        <Route path="/" element={<h1>Landing page</h1>} />
        <Route path="/create-room" element={<h1>Create room page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}

const openMenu = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByRole('button', { name: 'Sofiia' }));

describe('signed-in header and user menu', () => {
  it('shows the links and "Sign In" to a guest', async () => {
    setup({ 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } });
    expect(await screen.findByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create a room/ })).not.toBeInTheDocument();
  });

  it('shows "Create a room" and the name to a signed-in person', async () => {
    const user = userEvent.setup();
    setup({});
    expect(await screen.findByRole('button', { name: 'Sofiia' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create a room/ }));
    expect(screen.getByRole('heading', { name: 'Create room page' })).toBeInTheDocument();
  });

  it('opens the menu and closes it with Escape', async () => {
    const user = userEvent.setup();
    setup({});
    await openMenu(user);
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My account' })).toBeDisabled();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sofiia' })).toHaveFocus();
  });

  it('asks before logging out, and "Cancel" keeps the person signed in', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({});
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Log out?' });
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/auth/logout'))).toBe(false);
  });

  it('logs out and opens the landing page', async () => {
    const user = userEvent.setup();
    setup({ 'POST /auth/logout': { status: 204, body: null } });
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await user.click(screen.getAllByRole('button', { name: 'Log out' }).at(-1)!);
    expect(await screen.findByRole('heading', { name: 'Landing page' })).toBeInTheDocument();
  });

  it('keeps the dialog open with a message when logging out fails', async () => {
    const user = userEvent.setup();
    setup({ 'POST /auth/logout': { status: 503, body: {} } });
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await user.click(screen.getAllByRole('button', { name: 'Log out' }).at(-1)!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/server is busy/));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
