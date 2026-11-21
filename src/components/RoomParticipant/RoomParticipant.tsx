import type { Participant } from '../../api/roomsApi.ts';
import { useRoomAvatar } from '../../hooks/useRoomAvatar.ts';
import BrandParticipant, { type ParticipantStatus } from '../BrandParticipant/BrandParticipant.tsx';

interface Props {
  code: string;
  person: Participant;
  index: number;
  status?: ParticipantStatus;
}

/**
 * A person of the room list with their profile photo: BrandParticipant draws, this loads the photo
 * (it needs the participant token, see useRoomAvatar). Guests keep the letter.
 */
export default function RoomParticipant({ code, person, index, status }: Props) {
  const photoUrl = useRoomAvatar(code, person.avatarPath);
  return (
    <BrandParticipant
      name={person.name}
      index={index}
      isMe={person.isMe}
      isHost={person.isHost}
      status={status}
      photoUrl={photoUrl}
    />
  );
}
