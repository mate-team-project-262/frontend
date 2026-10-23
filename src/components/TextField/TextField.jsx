import { useId } from 'react';
import './TextField.css';

export default function TextField({ label, error, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="text-field">
      <label className="text-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        className="text-field__input"
        id={id}
        type="text"
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p className="text-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
