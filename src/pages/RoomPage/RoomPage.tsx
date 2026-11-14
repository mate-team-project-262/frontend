import { Navigate, useParams } from 'react-router';
import BrandHeader from '../../components/BrandHeader/BrandHeader.tsx';
import { useLinkRoomToAccount } from '../../hooks/useLinkRoomToAccount.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { useRoom } from '../../hooks/useRoom.ts';
import { invitePath } from '../../routes.ts';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import RoomLobbyPage from '../RoomLobbyPage/RoomLobbyPage.tsx';
import ResultsPage from '../ResultsPage/ResultsPage.tsx';
import SwipePage from '../SwipePage/SwipePage.tsx';
import WaitingRoomPage from '../WaitingRoomPage/WaitingRoomPage.tsx';
import './RoomPage.css';

const STATUS_MESSAGES = {
  loading: 'Loading room…',
  'not-found': 'Room not found.',
  error: 'Could not load the room. Please try again later.',
};

function RoomMessage({ status }: { status: keyof typeof STATUS_MESSAGES }) {
  return (
    <div className="room-page cinema-page cinema-page--audience landing">
      <BrandHeader />
      <main className="room-page__main">
        <p className="room-page__message" role="status">
          {STATUS_MESSAGES[status]}
        </p>
      </main>
    </div>
  );
}

/**
 * /room/:code - inside a room. Needs the person's token (saved when they created or joined it):
 *  - no token / expired token -> back to the invite page (/join/:code)
 *  - the session has started  -> swipe page, for everyone (status VOTING)
 *  - everybody has voted      -> results page (status FINISHED)
 *  - the host                 -> room lobby (share the link, see who joined, start the session)
 *  - a guest                  -> waiting room ("You're all set")
 * A signed-in person's place in the room is tied to their account here (useLinkRoomToAccount).
 */
export default function RoomPage() {
  const { code = '' } = useParams();
  const { status, room, refresh } = useRoom(code);
  usePageMeta(); // rooms are private: not for search engines
  useLinkRoomToAccount(status === 'ready' && room ? code : null);

  if (status === 'unauthorized') return <Navigate to={invitePath(code)} replace />;
  if (status !== 'ready' || !room) {
    return <RoomMessage status={status === 'ready' ? 'loading' : status} />;
  }

  if (room.status === 'FINISHED') return <ResultsPage code={code} room={room} />;
  if (room.status !== 'LOBBY') return <SwipePage code={code} room={room} />;

  const me = room.participants.find((person) => person.isMe);
  return me?.isHost ? (
    <RoomLobbyPage code={code} room={room} onStarted={refresh} />
  ) : (
    <WaitingRoomPage code={code} room={room} />
  );
}
