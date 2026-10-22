import { cx } from '../../utils/classNames.js';
import './Button.css';

export default function Button({ variant, className, ...props }) {
  return (
    <button
      type="button"
      className={cx('button', variant && `button--${variant}`, className)}
      {...props}
    />
  );
}
