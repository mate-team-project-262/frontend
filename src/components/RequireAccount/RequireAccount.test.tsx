import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import RequireAccount from './RequireAccount.tsx';

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
            </RequireAccount>
          }
        />
        <Route path="/sign-in" element={<h1>Sign In page</h1>} />
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
});
