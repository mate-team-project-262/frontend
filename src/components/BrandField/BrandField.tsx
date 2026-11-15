import { type ComponentPropsWithoutRef, useId, useState } from 'react';
import { cx } from '../../utils/classNames.ts';
import './BrandField.css';

/** UI kit eye: crossed while the password is hidden. */
function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z" />
      <circle cx="10" cy="10" r="2.6" />
      {crossed && <path d="m3.5 3.5 13 13" />}
    </svg>
  );
}

interface Props extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  label: string;
  hint?: string;
  /** error text; replaces the hint */
  error?: string;
  success?: boolean;
  size?: 'lg';
}

/**
 * Text input of the dark theme: label above, hint under the input (replaced by the error
 * message when there is one). States: default / hover / focus / filled / error / success /
 * disabled. `success` paints the border green (e.g. a valid name); an error wins over it.
 * `type="password"` adds the eye button that shows / hides the password.
 */
export default function BrandField({
  label,
  hint,
  error,
  success,
  size,
  className,
  type = 'text',
  ...inputProps
}: Props) {
  const id = useId();
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === 'password';
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div
      className={cx(
        'brand-field',
        size === 'lg' && 'brand-field--lg',
        error && 'brand-field--error',
        !error && success && 'brand-field--success',
        className,
      )}
    >
      <label className="brand-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="brand-field__control">
        <input
          className={cx('brand-field__input', isPassword && 'brand-field__input--with-toggle')}
          id={id}
          type={isPassword && isRevealed ? 'text' : type}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="brand-field__toggle"
            aria-label={isRevealed ? 'Hide password' : 'Show password'}
            aria-pressed={isRevealed}
            disabled={inputProps.disabled}
            onClick={() => setIsRevealed((value) => !value)}
          >
            <EyeIcon crossed={!isRevealed} />
          </button>
        )}
      </div>
      {message && (
        <p className="brand-field__message" id={messageId} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
