import { screen, waitFor } from '@testing-library/react';
import type { Participant } from '../../api/roomsApi.ts';
import { signIn } from '../../test/fixtures.ts';
import { renderWithQuery } from '../../test/render.tsx';
import RoomParticipant from './RoomParticipant.tsx';

const PATH = '/rooms/ABC123/participants/2/avatar?v=3';
const egor = (avatarPath: string | null): Participant => ({
  id: 2,
  name: 'Egor',
  isHost: false,
  isMe: false,
  avatarPath,
});

function setup(person: Participant, answer: () => Response) {
  signIn('ABC123', 1);
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => answer());
  const view = renderWithQuery(
    <ul>
      <RoomParticipant code="ABC123" person={person} index={1} />
    </ul>,
  );
  return { fetchMock, ...view };
}

describe('RoomParticipant', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:egor');
    URL.revokeObjectURL = vi.fn();
  });

  it('loads the photo with the participant token and shows it in the circle', async () => {
    const { fetchMock, container } = setup(
      egor(PATH),
      () => new Response('img', { headers: { 'Content-Type': 'image/webp' } }),
    );

    await waitFor(() => expect(container.querySelector('img')).toHaveAttribute('src', 'blob:egor'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api${PATH}`);
    expect(options?.headers).toMatchObject({ 'X-Participant-Token': expect.any(String) });
    expect(screen.queryByText('E')).not.toBeInTheDocument();
  });

  it('keeps the letter for a guest and asks for nothing', () => {
    const { fetchMock } = setup(egor(null), () => new Response(null));
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the letter when the photo is gone', async () => {
    const { fetchMock, container } = setup(egor(PATH), () => new Response(null, { status: 404 }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('frees the photo when the person leaves the list', async () => {
    const { container, unmount } = setup(egor(PATH), () => new Response('img'));
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:egor');
  });
});
