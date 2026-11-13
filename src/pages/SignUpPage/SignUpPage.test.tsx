import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import SignUpPage from './SignUpPage.tsx';

const guest = { 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } };
const csrf = { 'GET /auth/csrf': { headerName: 'X-CSRF-TOKEN', token: 't' } };

function setup(routes: Record<string, unknown>) {
  const fetchMock = mockBackend({ ...guest, ...csrf, ...routes });
  renderWithQuery(
    <MemoryRouter initialEntries={['/sign-up']}>
      <Routes>
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/" element={<h1>Home page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}

async function fill(user: ReturnType<typeof userEvent.setup>, email = 'anna@example.com') {
  await user.type(screen.getByLabelText('Full name'), 'Anna');
  await user.type(screen.getByLabelText('Email address'), email);
  await user.type(screen.getByLabelText('Password'), 'secret12');
}

describe('SignUpPage', () => {
  it('shows every problem on "Create account" and sends nothing while the form is invalid', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({});
    await user.click(screen.getByRole('button', { name: /Create account/ }));

    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Please create a password')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/auth/register'))).toBe(
      false,
    );
  });

  it('shows the rules under a field after the person leaves it', async () => {
    const user = userEvent.setup();
    setup({});
    await user.type(screen.getByLabelText('Email address'), 'anna@gkail');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.tab();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInvalid();
  });

  it('creates the account, signs the person in and opens the home page', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({
      'POST /auth/register': {
        status: 201,
        body: { id: 1, email: 'anna@example.com', displayName: 'Anna' },
      },
    });
    await fill(user);
    await user.click(screen.getByRole('button', { name: /Create account/ }));

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    const register = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/register'));
    expect(JSON.parse(String(register?.[1]?.body))).toEqual({
      email: 'anna@example.com',
      displayName: 'Anna',
      password: 'secret12',
    });
  });

  it.each([
    ['EMAIL_TAKEN', 'Email address', /already registered/],
    ['USERNAME_TAKEN', 'Full name', /already taken/],
  ])('shows %s under its field', async (code, label, message) => {
    const user = userEvent.setup();
    setup({ 'POST /auth/register': { status: 409, body: { code } } });
    await fill(user);
    await user.click(screen.getByRole('button', { name: /Create account/ }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(label)).toBeInvalid();
    // editing the field clears the backend's message
    await user.type(screen.getByLabelText(label), 'x');
    await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
  });
});
