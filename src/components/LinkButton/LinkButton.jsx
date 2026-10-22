import { cx } from '../../utils/classNames.js';
import './LinkButton.css';

export default function LinkButton({ bold = false, className, ...props }) {
  return (
    <button
      type="button"
      className={cx('link-button', bold && 'link-button--bold', className)}
      {...props}
    />
  );
}
