import { useParams } from 'react-router';
import Header from '../../components/Header/Header.jsx';
import JoinRoom from '../../components/JoinRoom/JoinRoom.jsx';
import { useRoom } from '../../hooks/useRoom.js';
import RoomLobbyPage from '../RoomLobbyPage/RoomLobbyPage.jsx';
import './RoomPage.css';

const STATUS_MESSAGES = {
  loading: 'Loading room…',
  'not-found': 'Room not found.',
  error: 'Could not load the room. Please try again later.',
  // TODO: replace with the waiting room page ("You're in!") when it exists
  'waiting-room': 'You are in the room. The waiting room page is coming soon.',
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
 * /room/:code - one address for everybody (the invite link and the QR code point here).
 * The backend tells who is looking, and the page shows the matching view:
 *  - not in the room yet  -> "You're invited" page (join with a name)
 *  - the host             -> room lobby (share the link, see who joined, start the session)
 *  - a guest in the room  -> waiting room (not built yet)
 */
export default function RoomPage() {
  const { code } = useParams();
  const { status, room } = useRoom(code);

  if (status !== 'ready') return <RoomMessage status={status} />;

  const me = room.participants.find((person) => person.isMe);
  if (!me) return <JoinRoom title="You’re invited to Movie room" code={code} />;
  if (me.isHost) return <RoomLobbyPage code={code} room={room} />;
  return <RoomMessage status="waiting-room" />;
}
