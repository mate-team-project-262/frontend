import { cx } from '../../utils/classNames.js';
import BrandSpinner from '../BrandSpinner/BrandSpinner.jsx';
import './BrandParticipant.css';

/** Avatar colours in the order people join (the host is first). Figma: lilac, green, khaki, blue. */
const AVATARS = [
  { background: '#b18aff', color: '#7a4cf0' },
  { background: '#8dc9ad', color: '#1d1650' },
  { background: '#cac38a', color: '#1d1650' },
  { background: '#7996df', color: '#1d1650' },
  { background: '#e3a3b8', color: '#1d1650' },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="m2 7.5 3.2 3L12 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** UI kit "participant progress states": Done (green) / Swiping... (spinner). */
function ProgressChip({ status }) {
  return status === 'done' ? (
    <span className="brand-participant__status brand-participant__status--done">
      <CheckIcon />
      Done
    </span>
  ) : (
    <span className="brand-participant__status">
      <BrandSpinner />
      Swiping…
    </span>
  );
}

/**
 * One person in the room list: round avatar with the first letter, name, "Host" badge and,
 * on the voting progress screen, `status` 'done' | 'swiping' (then "(you)" is shown for the host too).
 */
export default function BrandParticipant({ name, index = 0, isMe = false, isHost = false, status }) {
  const avatar = AVATARS[index % AVATARS.length];

  return (
    <li className={cx('brand-participant', isHost && 'brand-participant--host')}>
      <span className="brand-participant__avatar" style={avatar} aria-hidden="true">
        {name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="brand-participant__name">
        {name}
        {isMe && (!isHost || status) && ' (you)'}
      </span>
      {isHost && <span className="brand-participant__badge">Host</span>}
      {status && <ProgressChip status={status} />}
    </li>
  );
}
