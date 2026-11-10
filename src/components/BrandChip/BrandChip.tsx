import { cx } from '../../utils/classNames.ts';
import './BrandChip.css';

/** Toggle chip of the dark theme (UI kit: default / hover / selected / disabled). */
interface Props {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export default function BrandChip({ label, selected = false, disabled = false, onToggle }: Props) {
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
