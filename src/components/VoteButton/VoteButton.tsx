import { type ComponentPropsWithoutRef, useId } from 'react';
import { cx } from '../../utils/classNames.ts';
import './VoteButton.css';

function CrossIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M4 4l20 20M24 4 4 24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  const gradientId = useId();
  return (
    <svg width="32" height="29" viewBox="0 0 32 29" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2d4ff" />
          <stop offset="0.55" stopColor="#b18bff" />
          <stop offset="1" stopColor="#8f5cff" />
        </linearGradient>
      </defs>
      <path
        className="vote-button__heart"
        d="M16 28.2c-.5 0-1-.2-1.4-.5C6.3 21.2 1 16.5 1 10.1 1 5.1 4.8 1.2 9.6 1.2c2.7 0 5 1.3 6.4 3.4 1.4-2.1 3.7-3.4 6.4-3.4 4.8 0 8.6 3.9 8.6 8.9 0 6.4-5.3 11.1-13.6 17.6-.4.3-.9.5-1.4.5Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

interface Props extends ComponentPropsWithoutRef<'button'> {
  kind: 'like' | 'skip';
}

/** Round 74px vote button of the UI kit ("button icon" / "movie-navigation"). */
export default function VoteButton({ kind, className, ...props }: Props) {
  return (
    <button
      type="button"
      className={cx('vote-button', `vote-button--${kind}`, className)}
      aria-label={kind === 'like' ? 'Like' : 'Skip'}
      {...props}
    >
      {kind === 'like' ? <HeartIcon /> : <CrossIcon />}
    </button>
  );
}
