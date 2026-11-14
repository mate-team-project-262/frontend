import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useAccount } from '../../hooks/useAccount.ts';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import RequireAccount from './RequireAccount.tsx';

/** A button that signs the person out the way the "Log out" dialog does. */
function SignOutButton() {
  const { setUser } = useAccount();
  return (
    <button type="button" onClick={() => setUser(null)}>
      Sign out
    </button>
  );
}

function setup(me: unknown) {
  mockBackend({ 'GET /me': me });
  renderWithQuery(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route
          path="/private"
          element={
            <RequireAccount>
              <h1>Private page</h1>
              <SignOutButton />
            </RequireAccount>
          }
        />
        <Route path="/sign-in" element={<h1>Sign In page</h1>} />
        <Route path="/" element={<h1>Landing page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAccount', () => {
  it('sends a guest to the Sign In page', async () => {
    setup({ status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } });
    expect(await screen.findByRole('heading', { name: 'Sign In page' })).toBeInTheDocument();
  });

  it('shows the page to a signed-in person', async () => {
    setup({ id: 1, email: 'a@b.co', displayName: 'Anna' });
    expect(await screen.findByRole('heading', { name: 'Private page' })).toBeInTheDocument();
  });

  it('sends a person who has just logged out to the landing page, not to Sign In', async () => {
    setup({ id: 1, email: 'a@b.co', displayName: 'Anna' });
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Landing page' })).toBeInTheDocument();
  });
});
