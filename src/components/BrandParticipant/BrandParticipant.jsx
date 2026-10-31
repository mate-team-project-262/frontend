import { cx } from '../../utils/classNames.js';
import './BrandParticipant.css';

/** Avatar colours in the order people join (the host is first). Figma: lilac, green, khaki, blue. */
const AVATARS = [
  { background: '#b18aff', color: '#7a4cf0' },
  { background: '#8dc9ad', color: '#1d1650' },
  { background: '#cac38a', color: '#1d1650' },
  { background: '#7996df', color: '#1d1650' },
  { background: '#e3a3b8', color: '#1d1650' },
];

/** One person in the room list: round avatar with the first letter, name, "Host" badge. */
export default function BrandParticipant({ name, index = 0, isMe = false, isHost = false }) {
  const avatar = AVATARS[index % AVATARS.length];

  return (
    <li className={cx('brand-participant', isHost && 'brand-participant--host')}>
      <span className="brand-participant__avatar" style={avatar} aria-hidden="true">
        {name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="brand-participant__name">
        {name}
        {isMe && !isHost && ' (you)'}
      </span>
      {isHost && <span className="brand-participant__badge">Host</span>}
    </li>
  );
}
