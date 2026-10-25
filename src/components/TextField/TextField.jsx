import { useId } from 'react';
import { cx } from '../../utils/classNames.js';
import './TextField.css';

/** Text input with a label above it and an optional error message below. variant: 'compact' = 16px side padding. */
export default function TextField({ label, hint, error, variant, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cx('text-field', variant && `text-field--${variant}`)}>
      <label className="text-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        className="text-field__input"
        id={id}
        type="text"
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...inputProps}
      />
      {error ? (
        <p className="text-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-field__hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
