import { Navigate, useNavigate, useParams } from 'react-router';
import { getRoomSession } from '../../api/roomSession.js';
import JoinRoom from '../../components/JoinRoom/JoinRoom.jsx';
import { roomPath } from '../../routes.js';

/** /join/:code - the link the host shares (and the QR code): the guest only enters a name. */
export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();

  // Already joined from this tab: go straight to the room.
  if (getRoomSession(code)) return <Navigate to={roomPath(code)} replace />;

  return (
    <JoinRoom
      title="You’re invited to Movie room"
      code={code}
      onJoined={({ code: joinedCode }) => navigate(roomPath(joinedCode))}
    />
  );
}
