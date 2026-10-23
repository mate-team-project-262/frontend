import { cx } from '../../utils/classNames.js';
import './Button.css';

export default function Button({ variant, block = false, className, ...props }) {
  return (
    <button
      type="button"
      className={cx('button', variant && `button--${variant}`, block && 'button--block', className)}
      {...props}
    />
  );
}
