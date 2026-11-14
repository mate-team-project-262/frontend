import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import CreateRoomPage from './CreateRoomPage.tsx';

const created = {
  code: 'ABC123',
  participant: { id: 1, displayName: 'x', host: true, token: 't' },
};
const guest = { 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } };
const sofiia = { 'GET /me': { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' } };

function setup(routes: Record<string, unknown>) {
  const fetchMock = mockBackend(routes);
  renderWithQuery(
    <MemoryRouter initialEntries={['/create-room']}>
      <Routes>
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/room/:code" element={<h1>Room page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}

/** The JSON body of the POST /rooms request. */
const sentRoom = (fetchMock: ReturnType<typeof mockBackend>) => {
  const request = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/rooms'));
  return JSON.parse(String(request?.[1]?.body));
};

describe('CreateRoomPage', () => {
  it('asks a guest for a name', async () => {
    const fetchMock = setup({ ...guest, 'POST /rooms': created });
    const button = screen.getByRole('button', { name: 'Create room' });

    const field = await screen.findByLabelText('Your name');
    expect(button).toBeDisabled();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();

    await userEvent.type(field, 'Anna');
    await userEvent.click(button);

    expect(await screen.findByRole('heading', { name: 'Room page' })).toBeInTheDocument();
    expect(sentRoom(fetchMock).displayName).toBe('Anna');
  });

  it('uses the account name of a signed-in person and shows no name field', async () => {
    const fetchMock = setup({ ...sofiia, 'POST /rooms': created });

    expect(await screen.findByText('Signed in as Sofiia')).toBeInTheDocument();
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument();
    // the header offers the account menu
    expect(screen.getByRole('button', { name: 'Sofiia' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Create room' }));

    expect(await screen.findByRole('heading', { name: 'Room page' })).toBeInTheDocument();
    expect(sentRoom(fetchMock).displayName).toBe('Sofiia');
  });

  it('shows a name problem of a signed-in person above the button', async () => {
    setup({
      ...sofiia,
      'POST /rooms': { status: 409, body: { code: 'NAME_TAKEN', message: 'x' } },
    });
    await screen.findByText('Signed in as Sofiia');

    await userEvent.click(screen.getByRole('button', { name: 'Create room' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/already taken/));
  });
});
