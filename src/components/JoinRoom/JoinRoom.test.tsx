import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { mockBackend } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import JoinRoom from './JoinRoom.tsx';

const joined = {
  code: 'ABC123',
  currentParticipant: { id: 2, displayName: 'x', host: false, token: 't' },
};
const guest = { 'GET /me': { status: 401, body: { code: 'AUTHENTICATION_REQUIRED' } } };
const sofiia = { 'GET /me': { id: 7, email: 'sofiia@example.com', displayName: 'Sofiia' } };

function setup(routes: Record<string, unknown>) {
  const onJoined = vi.fn();
  const fetchMock = mockBackend({ 'POST /rooms/ABC123/join': joined, ...routes });
  renderWithQuery(
    <MemoryRouter>
      <JoinRoom title="You’re invited" code="ABC123" onJoined={onJoined} />
    </MemoryRouter>,
  );
  return { onJoined, fetchMock };
}

describe('JoinRoom', () => {
  it('lets a guest join with a typed name', async () => {
    const { onJoined } = setup(guest);
    expect(screen.getByText('No account needed to join')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Your name'), 'Egor');
    await userEvent.click(screen.getByRole('button', { name: 'Join room' }));

    expect(await vi.waitFor(() => onJoined.mock.calls[0][0])).toEqual({
      code: 'ABC123',
      name: 'Egor',
    });
  });

  it('offers a signed-in person the account name, which can be changed', async () => {
    const { onJoined, fetchMock } = setup(sofiia);

    expect(await screen.findByText('Signed in as Sofiia')).toBeInTheDocument();
    const field = screen.getByLabelText('Your name');
    expect(field).toHaveValue('Sofiia');

    await userEvent.clear(field);
    await userEvent.type(field, 'Sonya');
    await userEvent.click(screen.getByRole('button', { name: 'Join room' }));

    await vi.waitFor(() => expect(onJoined).toHaveBeenCalled());
    const request = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/join'));
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({ displayName: 'Sonya' });
  });
});
