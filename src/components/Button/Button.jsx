import { cx } from '../../utils/classNames.js';
import './Button.css';

/**
 * variant: undefined (solid) | 'ghost'. `block`: full-width 56px-tall button (form submit).
 * `as="a"` renders a link that looks like a button.
 */
export default function Button({ as: Tag = 'button', variant, block = false, className, ...props }) {
  return (
    <Tag
      {...(Tag === 'button' && { type: 'button' })}
      className={cx('button', variant && `button--${variant}`, block && 'button--block', className)}
      {...props}
    />
  );
}
