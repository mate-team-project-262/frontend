import { type ReactNode, useId } from 'react';
import './BrandFormSection.css';

interface Props {
  title: string;
  counter?: string;
  error?: string;
  children: ReactNode;
}

/** Labelled group of options (chips) on the dark theme. `counter` is shown next to the title. */
export default function BrandFormSection({ title, counter, error, children }: Props) {
  const titleId = useId();
  return (
    <div className="brand-form-section" role="group" aria-labelledby={titleId}>
      <div className="brand-form-section__label" id={titleId}>
        {title}
        {counter && <span> {counter}</span>}
      </div>
      <div className="brand-form-section__options">{children}</div>
      {error && (
        <p className="brand-form-section__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
