import { useEffect } from 'react';
import './BrandToast.css';

const AUTO_HIDE_MS = 6000;

function PeopleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.5 16c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M13 3.8a2.8 2.8 0 0 1 0 5.4M15.2 11.8c1.2.6 2 1.9 2.3 4.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 1l12 12M13 1 1 13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** UI kit "info toast": cream card with a round icon, a title and a line of text. Hides itself. */
export default function BrandToast({
  title,
  text,
  onClose,
}: {
  title: string;
  text?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [onClose, title, text]);

  return (
    <div className="brand-toast" role="status">
      <span className="brand-toast__icon">
        <PeopleIcon />
      </span>
      <div className="brand-toast__body">
        <p className="brand-toast__title">{title}</p>
        {text && <p className="brand-toast__text">{text}</p>}
      </div>
      <button type="button" className="brand-toast__close" aria-label="Close" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
}
