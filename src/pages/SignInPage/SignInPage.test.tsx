import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import SignInPage from './SignInPage.tsx';

const csrf = { 'GET /auth/csrf': { headerName: 'X-CSRF-TOKEN', token: 't' } };
const anna = { id: 1, email: 'anna@example.com', displayName: 'Anna' };

function setup(routes: Record<string, unknown>) {
  mockBackend({
    'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } },
    ...csrf,
    ...routes,
  });
  renderWithQuery(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/" element={<h1>Home page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** the form's button (the header has a "Sign In" link of its own) */
const submitButton = () =>
  within(screen.getByRole('main')).getByRole('button', { name: /Sign In/ });

describe('SignInPage', () => {
  it('signs in and opens the home page', async () => {
    const user = userEvent.setup();
    setup({ 'POST /auth/login': anna });
    await user.type(screen.getByLabelText('Your name'), 'Anna');
    await user.type(screen.getByLabelText('Password'), 'secret12');
    await user.click(submitButton());
    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
  });

  it('shows one message for a wrong name or password and lets the person try again', async () => {
    const user = userEvent.setup();
    setup({ 'POST /auth/login': { status: 401, body: { code: 'INVALID_CREDENTIALS' } } });
    await user.type(screen.getByLabelText('Your name'), 'Anna');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong name or password');
    expect(submitButton()).toBeEnabled();
  });

  it('sends a person who is already signed in to the home page', async () => {
    setup({ 'GET /me': anna });
    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
  });

  it('shows the name icon only while the field is empty, as in the mockup', async () => {
    const user = userEvent.setup();
    setup({});
    const field = screen.getByLabelText('Your name').closest('.light-field__control');
    expect(field?.querySelector('.light-field__icon')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your name'), 'A');
    expect(field?.querySelector('.light-field__icon')).not.toBeInTheDocument();
  });
});
