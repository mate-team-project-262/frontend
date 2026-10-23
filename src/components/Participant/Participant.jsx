import './Participant.css';

/** One person in the room list. */
export default function Participant({ name, isMe = false, isHost = false }) {
  return (
    <li className="participant">
      <span className="participant__name">
        {name}
        {isMe && ' (you)'}
      </span>
      {isHost && <span className="participant__badge">Host</span>}
    </li>
  );
}
