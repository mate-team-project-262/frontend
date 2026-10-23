import { cx } from '../../utils/classNames.js';
import './Chip.css';

export default function Chip({ label, selected = false, onToggle }) {
  return (
    <button
      type="button"
      className={cx('chip', selected && 'chip--selected')}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}
