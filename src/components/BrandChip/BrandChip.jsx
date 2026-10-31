import { cx } from '../../utils/classNames.js';
import './BrandChip.css';

/** Toggle chip of the dark theme (UI kit: default / hover / selected / disabled). */
export default function BrandChip({ label, selected = false, disabled = false, onToggle }) {
  return (
    <button
      type="button"
      className={cx('brand-chip', selected && 'brand-chip--selected')}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}
