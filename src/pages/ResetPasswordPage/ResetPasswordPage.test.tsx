import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import ResetPasswordPage from './ResetPasswordPage.tsx';

const guest = { 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } };
const csrf = { 'GET /auth/csrf': { headerName: 'X-XSRF-TOKEN', token: 'csrf-1' } };
const valid = { 'GET /auth/reset-password/check?token=abc': { status: 204, body: null } };

/** Shows the address the page ended up on. */
function Address() {
  const { pathname, search } = useLocation();
  return <p data-testid="address">{pathname + search}</p>;
}

function setup(path: string, routes: Record<string, unknown>) {
  const fetchMock = mockBackend({ ...guest, ...csrf, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={[path]}>
      <Address />
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<h1>Forgot password page</h1>} />
        <Route path="/sign-in" element={<h1>Sign In page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}

async function fill(password: string, repeat = password) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('New password'), password);
  await user.type(screen.getByLabelText('Confirm new password'), repeat);
  await user.click(screen.getByRole('button', { name: /Reset password/ }));
}

describe('ResetPasswordPage', () => {
  it('checks the link and takes the token out of the address', async () => {
    setup('/reset-password?token=abc', valid);

    expect(await screen.findByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create a new password' })).toBeInTheDocument();
    expect(screen.getByTestId('address')).toHaveTextContent(/^\/reset-password$/);
  });

  it('says at once that an old link does not work', async () => {
    const user = userEvent.setup();
    setup('/reset-password?token=old', {
      'GET /auth/reset-password/check?token=old': {
        status: 400,
        body: { code: 'RESET_TOKEN_INVALID' },
      },
    });

    expect(await screen.findByRole('heading', { name: 'Link expired' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Request a new link/ }));
    expect(screen.getByRole('heading', { name: 'Forgot password page' })).toBeInTheDocument();
  });

  it('treats an address without a token as an old link', () => {
    setup('/reset-password', {});

    expect(screen.getByRole('heading', { name: 'Link expired' })).toBeInTheDocument();
  });

  it('sets the new password and offers to sign in', async () => {
    const fetchMock = setup('/reset-password?token=abc', {
      ...valid,
      'POST /auth/reset-password': { status: 204, body: null },
    });

    await fill('newpass12');

    expect(await screen.findByRole('heading', { name: 'Password updated' })).toBeInTheDocument();
    const reset = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/auth/reset-password'),
    );
    expect(JSON.parse(String(reset?.[1]?.body))).toEqual({
      token: 'abc',
      newPassword: 'newpass12',
    });
    expect(new Headers(reset?.[1]?.headers).get('X-XSRF-TOKEN')).toBe('csrf-1');

    // the form's button: the header has its own "Sign In"
    await userEvent.click(
      within(screen.getByRole('main')).getByRole('button', { name: /Sign In/ }),
    );
    expect(screen.getByRole('heading', { name: 'Sign In page' })).toBeInTheDocument();
  });

  it('checks the rules and the repeat before sending', async () => {
    const fetchMock = setup('/reset-password?token=abc', valid);

    await fill('short', 'other');

    expect(screen.getByText('Use 8+ characters, including a letter and a number')).toBeVisible();
    expect(screen.getByLabelText('New password')).toBeInvalid();
    expect(screen.getByText('The passwords do not match')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/auth/reset-password'))).toBe(
      false,
    );
  });

  it('shows "same as the current password" under the field', async () => {
    setup('/reset-password?token=abc', {
      ...valid,
      'POST /auth/reset-password': { status: 409, body: { code: 'PASSWORD_NOT_CHANGED' } },
    });

    await fill('oldpass12');

    expect(
      await screen.findByText('The new password must be different from the current one.'),
    ).toBeInTheDocument();
  });

  it('turns into "Link expired" when the link ran out while typing', async () => {
    setup('/reset-password?token=abc', {
      ...valid,
      'POST /auth/reset-password': { status: 400, body: { code: 'RESET_TOKEN_INVALID' } },
    });

    await fill('newpass12');

    expect(await screen.findByRole('heading', { name: 'Link expired' })).toBeInTheDocument();
  });
});
