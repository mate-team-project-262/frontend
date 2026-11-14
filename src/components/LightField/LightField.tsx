import { type ComponentPropsWithoutRef, type ReactNode, useId, useState } from 'react';
import { cx } from '../../utils/classNames.ts';
import './LightField.css';

type IconName = 'user' | 'mail' | 'lock';

const ICON_PATHS: Record<IconName, ReactNode> = {
  user: (
    <>
      <circle cx="9" cy="6" r="3.2" />
      <path d="M2.8 15.5c.7-3 3.1-4.6 6.2-4.6s5.5 1.6 6.2 4.6" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="3.8" width="14" height="10.4" rx="1.6" />
      <path d="m2.6 5 6.4 5 6.4-5" />
    </>
  ),
  lock: (
    <>
      <rect x="3.2" y="8" width="11.6" height="7.8" rx="1.6" />
      <path d="M5.8 8V5.8a3.2 3.2 0 0 1 6.4 0V8" />
      <circle cx="9" cy="11.9" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function ErrorIcon() {
  return (
    <Icon>
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5.3v4.4" />
      <circle cx="9" cy="12.3" r="0.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
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

interface Props extends ComponentPropsWithoutRef<'input'> {
  label: string;
  /** shown at the right of the label, e.g. the "Forgot password?" link (class `light-field__action`) */
  labelAction?: ReactNode;
  /** small icon inside the empty field, before the placeholder */
  icon?: IconName;
  hint?: string;
  /** error text; replaces the hint and paints the field red */
  error?: string;
}

/**
 * Text input for the cream surfaces (UI kit "light input"): label above, optional icon inside,
 * hint or error under it. A password field gets a show / hide button.
 */
export default function LightField({
  label,
  labelAction,
  icon,
  hint,
  error,
  type = 'text',
  className,
  ...inputProps
}: Props) {
  const id = useId();
  const messageId = `${id}-message`;
  const [isRevealed, setIsRevealed] = useState(false);
  // the show / hide button appears once something is typed (an empty field has nothing to show)
  const [hasValue, setHasValue] = useState(Boolean(inputProps.value ?? inputProps.defaultValue));
  const isPassword = type === 'password';
  const isFilled = inputProps.value !== undefined ? inputProps.value !== '' : hasValue;
  const showToggle = isPassword && isFilled;
  const message = error || hint;
  // as in the mockups, the icon belongs to the empty field (next to the placeholder)
  const hasIcon = Boolean(error) || (Boolean(icon) && !isFilled);

  return (
    <div className={cx('light-field', error && 'light-field--error', className)}>
      <div className="light-field__head">
        <label className="light-field__label" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="light-field__control">
        {hasIcon && (
          <span className="light-field__icon">
            {error ? <ErrorIcon /> : <Icon>{icon && ICON_PATHS[icon]}</Icon>}
          </span>
        )}
        <input
          className={cx(
            'light-field__input',
            hasIcon && 'light-field__input--with-icon',
            showToggle && 'light-field__input--with-toggle',
          )}
          id={id}
          type={isPassword && isRevealed ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
          onInput={(event) => {
            setHasValue(event.currentTarget.value !== '');
            inputProps.onInput?.(event);
          }}
        />
        {showToggle && (
          <button
            type="button"
            className="light-field__toggle"
            aria-label={isRevealed ? 'Hide password' : 'Show password'}
            aria-pressed={isRevealed}
            onClick={() => setIsRevealed((value) => !value)}
          >
            <EyeIcon crossed={!isRevealed} />
          </button>
        )}
      </div>
      {message && (
        <p className="light-field__message" id={messageId} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
