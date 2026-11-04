import { useNavigate } from 'react-router';
import JoinRoom from '../../components/JoinRoom/JoinRoom.jsx';
import { roomPath } from '../../routes.js';

/** Opened from the landing "Join a room" button: the guest pastes the room link and a name. */
export default function JoinRoomPage() {
  const navigate = useNavigate();

  // After joining, /room/:code shows the waiting room.
  return <JoinRoom title="Join a movie room" onJoined={({ code }) => navigate(roomPath(code))} />;
}
