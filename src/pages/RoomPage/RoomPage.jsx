import { Navigate, useParams } from 'react-router';
import Header from '../../components/Header/Header.jsx';
import { useRoom } from '../../hooks/useRoom.js';
import { invitePath } from '../../routes.js';
import RoomLobbyPage from '../RoomLobbyPage/RoomLobbyPage.jsx';
import WaitingRoomPage from '../WaitingRoomPage/WaitingRoomPage.jsx';
import './RoomPage.css';

const STATUS_MESSAGES = {
  loading: 'Loading room…',
  'not-found': 'Room not found.',
  error: 'Could not load the room. Please try again later.',
};

function RoomMessage({ status }) {
  return (
    <div className="room-page">
      <Header variant="back" />
      <main className="container">
        <p className="room-page__message">{STATUS_MESSAGES[status]}</p>
      </main>
    </div>
  );
}

/**
 * /room/:code - inside a room. Needs the person's token (saved when they created or joined it):
 *  - no token / expired token -> back to the invite page (/join/:code)
 *  - the host                 -> room lobby (share the link, see who joined, start the session)
 *  - a guest                  -> waiting room ("You're in!")
 *
 * TODO: when `room.status` becomes 'VOTING' move everybody to the swipe page (not built yet).
 */
export default function RoomPage() {
  const { code } = useParams();
  const { status, room } = useRoom(code);

  if (status === 'unauthorized') return <Navigate to={invitePath(code)} replace />;
  if (status !== 'ready') return <RoomMessage status={status} />;

  const me = room.participants.find((person) => person.isMe);
  return me?.isHost ? (
    <RoomLobbyPage code={code} room={room} />
  ) : (
    <WaitingRoomPage code={code} room={room} />
  );
}
