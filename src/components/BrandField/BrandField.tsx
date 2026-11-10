import { type ComponentPropsWithoutRef, useId } from 'react';
import { cx } from '../../utils/classNames.ts';
import './BrandField.css';

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
 */
export default function BrandField({
  label,
  hint,
  error,
  success,
  size,
  className,
  ...inputProps
}: Props) {
  const id = useId();
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
          className="brand-field__input"
          id={id}
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
      </div>
      {message && (
        <p className="brand-field__message" id={messageId} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
