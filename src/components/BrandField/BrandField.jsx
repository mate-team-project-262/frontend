import { useId } from 'react';
import { cx } from '../../utils/classNames.js';
import './BrandField.css';

function ErrorIcon() {
  return (
    <svg
      className="brand-field__error-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 5.5v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Text input of the dark theme: label above, hint under the input (replaced by the error
 * message when there is one). States: default / hover / focus / filled / error / disabled.
 */
export default function BrandField({ label, hint, error, className, ...inputProps }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={cx('brand-field', error && 'brand-field--error', className)}>
      <label className="brand-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="brand-field__control">
        <input
          className="brand-field__input"
          id={id}
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {error && <ErrorIcon />}
      </div>
      {message && (
        <p className="brand-field__message" id={messageId} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
