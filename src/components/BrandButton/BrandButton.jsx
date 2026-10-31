import { cx } from '../../utils/classNames.js';
import './BrandButton.css';

/**
 * Pill button of the new design. variant: 'primary' (violet gradient) | 'ghost' (outlined).
 * `as="a"` renders a link that looks the same (e.g. "Share on Telegram").
 */
export default function BrandButton({
  as: Tag = 'button',
  variant = 'primary',
  className,
  ...props
}) {
  return (
    <Tag
      {...(Tag === 'button' ? { type: 'button' } : {})}
      className={cx('brand-button', `brand-button--${variant}`, className)}
      {...props}
    />
  );
}
