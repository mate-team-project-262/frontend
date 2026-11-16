import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../routes.ts';

/** The round lilac badge above the title of a short status card ("Check your email" ...). */
export function AuthBadge({ children }: { children: ReactNode }) {
  return (
    <span className="auth-badge" aria-hidden="true">
      {children}
    </span>
  );
}

export function MailIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="6" y="11" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="m7 13 13 10 13-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="10" r="4.5" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="m12 22.5 7 7 14-15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.5 10H3M8.5 4.5 3 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** "← Back to Sign In" under the reset forms. */
export function BackToSignIn() {
  return (
    <p className="auth-card__back">
      <Link className="auth-card__link auth-card__link--back" to={ROUTES.signIn}>
        <ArrowLeftIcon />
        Back to Sign In
      </Link>
    </p>
  );
}
