import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import RequireAccount from '../../components/RequireAccount/RequireAccount.tsx';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import SignInPage from '../SignInPage/SignInPage.tsx';
import MyAccountPage from './MyAccountPage.tsx';

const sofiia = { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' };
const csrf = { 'GET /auth/csrf': { headerName: 'X-XSRF-TOKEN', token: 'csrf-1' } };

function setup(routes: Record<string, unknown> = {}) {
  const fetchMock = mockBackend({ 'GET /me': sofiia, ...csrf, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route
          path="/account"
          element={
            <RequireAccount>
              <MyAccountPage />
            </RequireAccount>
          }
        />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/" element={<h1>Landing page</h1>} />
        <Route path="/home" element={<h1>Home page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}

/** The requests sent to `path` with `method`, their JSON bodies. */
const sent = (fetchMock: ReturnType<typeof mockBackend>, method: string, path: string) =>
  fetchMock.mock.calls
    .filter(([url, options]) => String(url) === `/api${path}` && options?.method === method)
    .map(([, options]) => JSON.parse(String(options?.body)));

describe('MyAccountPage', () => {
  it('shows the name and the email of the account', async () => {
    setup();

    expect(await screen.findByRole('heading', { name: 'My account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sofiia');
    expect(screen.getByLabelText('Name')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Email address')).toHaveValue('sofiia@example.com');
  });

  it('changes the name without a password and shows it everywhere', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({ 'PATCH /me': { ...sofiia, displayName: 'Sonya' } });

    await user.click(await screen.findByRole('button', { name: 'Edit name' }));
    expect(screen.getByText('You will sign in with this name')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Sonya');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(sent(fetchMock, 'PATCH', '/me')).toEqual([{ displayName: 'Sonya' }]);
    // the header and the profile use the new name
    expect(screen.getByRole('button', { name: 'Sonya' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sonya');
  });

  it('does not send a name that breaks the rules', async () => {
    const user = userEvent.setup();
    const fetchMock = setup();

    await user.click(await screen.findByRole('button', { name: 'Edit name' }));
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'So');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Your name must be 3-20 characters long')).toBeInTheDocument();
    expect(sent(fetchMock, 'PATCH', '/me')).toEqual([]);
  });

  it('shows "name taken" under the field', async () => {
    const user = userEvent.setup();
    setup({ 'PATCH /me': { status: 409, body: { code: 'USERNAME_TAKEN' } } });

    await user.click(await screen.findByRole('button', { name: 'Edit name' }));
    await user.type(screen.getByLabelText('Name'), '2');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/This name is already taken/)).toBeInTheDocument();
  });

  it('asks for the current password to change the email', async () => {
    const user = userEvent.setup();
    let answer: unknown = { status: 400, body: { code: 'INVALID_CURRENT_PASSWORD' } };
    const fetchMock = setup({ 'PATCH /me': () => answer });

    await user.click(await screen.findByRole('button', { name: 'Change email address' }));
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Email address'));
    await user.type(screen.getByLabelText('Email address'), 'sonya@example.com');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Please enter your current password')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Current password'), 'wrong123');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument();

    answer = { ...sofiia, email: 'sonya@example.com' };
    await user.clear(screen.getByLabelText('Current password'));
    await user.type(screen.getByLabelText('Current password'), 'secret12');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveValue('sonya@example.com');
    expect(sent(fetchMock, 'PATCH', '/me').at(-1)).toEqual({
      email: 'sonya@example.com',
      currentPassword: 'secret12',
    });
  });

  it('changes the password and asks to sign in again', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({ 'PUT /me/password': { status: 204, body: null } });

    await user.click(await screen.findByRole('button', { name: /Change password/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'Change password' }));
    const update = dialog.getByRole('button', { name: 'Update password' });
    expect(update).toBeDisabled();

    await user.type(dialog.getByLabelText('Current password'), 'oldpass12');
    await user.type(dialog.getByLabelText('New password'), 'newpass12');
    await user.type(dialog.getByLabelText('Confirm new password'), 'newpass1');
    expect(dialog.getByText('The passwords do not match')).toBeInTheDocument();
    expect(update).toBeDisabled();

    await user.type(dialog.getByLabelText('Confirm new password'), '2');
    await user.click(update);

    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText(/Your password has been changed/)).toHaveAttribute('role', 'status');
    expect(sent(fetchMock, 'PUT', '/me/password')).toEqual([
      { currentPassword: 'oldpass12', newPassword: 'newpass12' },
    ]);
    // the old session is over: the header offers "Sign In" again
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Sofiia' })).not.toBeInTheDocument(),
    );
  });

  it('keeps the dialog open when the current password is wrong', async () => {
    const user = userEvent.setup();
    setup({ 'PUT /me/password': { status: 400, body: { code: 'INVALID_CURRENT_PASSWORD' } } });

    await user.click(await screen.findByRole('button', { name: /Change password/ }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Current password'), 'wrongpass1');
    await user.type(dialog.getByLabelText('New password'), 'newpass12');
    await user.type(dialog.getByLabelText('Confirm new password'), 'newpass12');
    await user.click(dialog.getByRole('button', { name: 'Update password' }));

    expect(await dialog.findByText('The current password is incorrect.')).toBeInTheDocument();
  });

  it('deletes the account after DELETE and the password', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({ 'DELETE /me': { status: 204, body: null } });

    await user.click(await screen.findByRole('button', { name: /^Delete$/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'Delete account' }));
    const remove = dialog.getByRole('button', { name: 'Delete account' });

    await user.type(dialog.getByLabelText('Type DELETE to confirm'), 'delete');
    expect(remove).toBeDisabled();
    await user.type(dialog.getByLabelText('Current password'), 'secret12');
    await user.click(remove);

    expect(await screen.findByRole('heading', { name: 'Landing page' })).toBeInTheDocument();
    expect(sent(fetchMock, 'DELETE', '/me')).toEqual([{ currentPassword: 'secret12' }]);
  });

  it('closes a dialog with Escape without sending anything', async () => {
    const user = userEvent.setup();
    const fetchMock = setup();

    await user.click(await screen.findByRole('button', { name: /^Delete$/ }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sent(fetchMock, 'DELETE', '/me')).toEqual([]);
  });

  it('goes back to the dashboard', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(await screen.findByRole('button', { name: /Back to Home/ }));

    expect(screen.getByRole('heading', { name: 'Home page' })).toBeInTheDocument();
  });
});

describe('MyAccountPage profile photo', () => {
  const withPhoto = { ...sofiia, avatarUrl: '/me/avatar/image?v=2' };
  const photoFile = () => new File(['photo'], 'me.jpg', { type: 'image/jpeg' });

  it('uploads a photo and shows it in the avatar', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({ 'PUT /me/avatar': withPhoto });

    await screen.findByRole('button', { name: 'Add profile photo' });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, photoFile());

    const avatar = await screen.findByRole('button', { name: 'Change profile photo' });
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/api/me/avatar/image?v=2');
    const [, options] = fetchMock.mock.calls.find(([url]) => String(url) === '/api/me/avatar')!;
    expect(options?.method).toBe('PUT');
    expect((options?.body as FormData).get('file')).toBeInstanceOf(Blob);
    expect(options?.headers).toMatchObject({ 'X-XSRF-TOKEN': 'csrf-1' });
  });

  it('does not send a file that is not a JPG, PNG or WebP', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const fetchMock = setup();

    await screen.findByRole('button', { name: 'Add profile photo' });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(['gif'], 'me.gif', { type: 'image/gif' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a JPG, PNG or WebP image up to 2 MB.',
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url) === '/api/me/avatar')).toBe(false);
  });

  it('shows the backend error about the file', async () => {
    const user = userEvent.setup();
    setup({
      'PUT /me/avatar': {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fieldErrors: [{ field: 'file', message: 'Too big' }],
        },
      },
    });

    await screen.findByRole('button', { name: 'Add profile photo' });
    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, photoFile());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a JPG, PNG or WebP image up to 2 MB.',
    );
  });

  it('removes the photo and shows the letter again', async () => {
    const user = userEvent.setup();
    mockBackend({
      'GET /me': withPhoto,
      ...csrf,
      'DELETE /me/avatar': { status: 204, body: null },
    });
    renderWithQuery(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<MyAccountPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    const avatar = await screen.findByRole('button', { name: 'Add profile photo' });
    expect(avatar.querySelector('img')).toBeNull();
    expect(avatar).toHaveTextContent('S');
  });
});
