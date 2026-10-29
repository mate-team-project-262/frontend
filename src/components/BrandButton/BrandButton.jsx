import { cx } from '../../utils/classNames.js';
import './BrandButton.css';

export default function BrandButton({ variant = 'primary', className, ...props }) {
  return (
    <button
      type="button"
      className={cx('brand-button', `brand-button--${variant}`, className)}
      {...props}
    />
  );
}
