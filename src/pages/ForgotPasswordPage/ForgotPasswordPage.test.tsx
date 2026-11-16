import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import ForgotPasswordPage from './ForgotPasswordPage.tsx';

const guest = { 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } };
const csrf = { 'GET /auth/csrf': { headerName: 'X-XSRF-TOKEN', token: 'csrf-1' } };

function setup(answer: unknown) {
  const fetchMock = mockBackend({ ...guest, ...csrf, 'POST /auth/forgot-password': answer });
  renderWithQuery(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/sign-in" element={<h1>Sign In page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}

const sentBodies = (fetchMock: ReturnType<typeof mockBackend>) =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith('/auth/forgot-password'))
    .map(([, options]) => JSON.parse(String(options?.body)));

describe('ForgotPasswordPage', () => {
  afterEach(() => vi.useRealTimers());

  it('checks the email before sending', async () => {
    const user = userEvent.setup();
    const fetchMock = setup({ status: 202, body: {} });

    await user.type(screen.getByLabelText('Email address'), 'anna@gkail');
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(sentBodies(fetchMock)).toEqual([]);
  });

  it('sends the link and lets resend only after a minute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = setup({ status: 202, body: {} });

    await user.type(screen.getByLabelText('Email address'), ' anna@example.com ');
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    expect(sentBodies(fetchMock)).toEqual([{ email: 'anna@example.com' }]);
    expect(screen.getByRole('button', { name: /Resend email in 1:00/ })).toBeDisabled();

    // one second at a time: each tick of the countdown is set after the page has re-rendered
    for (let second = 0; second < 61; second++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }
    await user.click(screen.getByRole('button', { name: 'Resend email' }));

    expect(sentBodies(fetchMock)).toHaveLength(2);
  });

  it('waits as long as the backend asks after "too many requests"', async () => {
    const user = userEvent.setup();
    setup({ status: 429, body: { code: 'TOO_MANY_REQUESTS' } });

    await user.type(screen.getByLabelText('Email address'), 'anna@example.com');
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));

    // mockBackend sends no Retry-After header: the default minute is used
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend email in 1:00/ })).toBeDisabled();
  });

  it('shows a connection problem and stays on the form', async () => {
    const user = userEvent.setup();
    setup({ status: 500, body: { code: 'INTERNAL' } });

    await user.type(screen.getByLabelText('Email address'), 'anna@example.com');
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
  });

  it('leads back to Sign In', async () => {
    const user = userEvent.setup();
    setup({ status: 202, body: {} });

    await user.click(screen.getByRole('link', { name: /Back to Sign In/ }));

    expect(screen.getByRole('heading', { name: 'Sign In page' })).toBeInTheDocument();
  });
});
