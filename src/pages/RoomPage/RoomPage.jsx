import { Navigate, useParams } from 'react-router';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import { useRoom } from '../../hooks/useRoom.js';
import { invitePath } from '../../routes.js';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import RoomLobbyPage from '../RoomLobbyPage/RoomLobbyPage.jsx';
import SwipePage from '../SwipePage/SwipePage.jsx';
import WaitingRoomPage from '../WaitingRoomPage/WaitingRoomPage.jsx';
import './RoomPage.css';

const STATUS_MESSAGES = {
  loading: 'Loading room…',
  'not-found': 'Room not found.',
  error: 'Could not load the room. Please try again later.',
};

function RoomMessage({ status }) {
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
 *  - the session has started  -> swipe page, for everyone (status VOTING; FINISHED too until
 *                                 the results page exists)
 *  - the host                 -> room lobby (share the link, see who joined, start the session)
 *  - a guest                  -> waiting room ("You're all set")
 */
export default function RoomPage() {
  const { code } = useParams();
  const { status, room, refresh } = useRoom(code);

  if (status === 'unauthorized') return <Navigate to={invitePath(code)} replace />;
  if (status !== 'ready') return <RoomMessage status={status} />;

  if (room.status !== 'LOBBY') return <SwipePage code={code} />;

  const me = room.participants.find((person) => person.isMe);
  return me?.isHost ? (
    <RoomLobbyPage code={code} room={room} onStarted={refresh} />
  ) : (
    <WaitingRoomPage code={code} room={room} />
  );
}
