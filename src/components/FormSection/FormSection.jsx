import { useId } from 'react';
import './FormSection.css';

export default function FormSection({ title, children }) {
  const titleId = useId();
  return (
    <div className="form-section" role="group" aria-labelledby={titleId}>
      <div className="form-section__label" id={titleId}>
        {title}
      </div>
      <div className="form-section__options">{children}</div>
    </div>
  );
}
