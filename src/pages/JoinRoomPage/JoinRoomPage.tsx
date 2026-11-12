import { useNavigate } from 'react-router';
import JoinRoom from '../../components/JoinRoom/JoinRoom.tsx';
import { SEO } from '../../data/seo.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { roomPath } from '../../routes.ts';

/** Opened from the landing "Join a room" button: the guest pastes the room link and a name. */
export default function JoinRoomPage() {
  const navigate = useNavigate();
  usePageMeta(SEO.join);

  // After joining, /room/:code shows the waiting room.
  return <JoinRoom title="Join a movie room" onJoined={({ code }) => navigate(roomPath(code))} />;
}
