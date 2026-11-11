import { Navigate, useNavigate, useParams } from 'react-router';
import { getRoomSession } from '../../api/roomSession.ts';
import JoinRoom from '../../components/JoinRoom/JoinRoom.tsx';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { roomPath } from '../../routes.ts';

/** /join/:code - the link the host shares (and the QR code): the guest only enters a name. */
export default function InvitePage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  usePageMeta(); // a private invite link: not for search engines

  // Already joined from this tab: go straight to the room.
  if (getRoomSession(code)) return <Navigate to={roomPath(code)} replace />;

  return (
    <JoinRoom
      title="You’re invited to movie room"
      code={code}
      onJoined={({ code: joinedCode }) => navigate(roomPath(joinedCode))}
    />
  );
}
