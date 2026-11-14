import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import illustration from '../../assets/landing/account-illustration.webp';
import { ACCOUNT_BENEFITS } from '../../data/content.ts';
import { ROUTES } from '../../routes.ts';
import './AccountBenefits.css';

function StarIcon() {
  return (
    <svg className="benefit__star" width="20" height="20" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 0c.5 3.6 2.4 5.9 7 7-4.6 1.1-6.5 3.4-7 7-.5-3.6-2.4-5.9-7-7 4.6-1.1 6.5-3.4 7-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

const LANDING_TITLE = (
  <>
    Your picks get <span className="account__title-accent">more</span> personal over time
  </>
);

/**
 * "Create an account" section of the landing page. The results page reuses it with its own texts
 * (`title`, `lead`, `buttonLabel`, `signInText`) and variant="stacked" (wide button, "Sign In" under
 * it); without props it shows the landing texts.
 */
export default function AccountBenefits({
  id = 'account-benefits',
  title = LANDING_TITLE,
  lead = 'Create an account to save your sessions, avoid repeats, and build a movie identity from the choices you make.',
  buttonLabel = 'Create free account',
  signInText = 'Already have one?',
  variant,
}: {
  id?: string;
  title?: ReactNode;
  lead?: string;
  buttonLabel?: string;
  signInText?: string;
  variant?: 'stacked';
}) {
  const navigate = useNavigate();

  return (
    <section className={variant === 'stacked' ? 'account account--stacked' : 'account'} id={id}>
      <div className="container account__inner">
        <div className="account__content">
          <h2 className="account__title">{title}</h2>
          <p className="account__lead">{lead}</p>
          <div className="account__actions">
            <BrandButton className="account__button" onClick={() => navigate(ROUTES.signUp)}>
              {buttonLabel}
            </BrandButton>
            <p className="account__sign-in">
              {signInText}{' '}
              <button
                type="button"
                className="account__sign-in-link"
                onClick={() => navigate(ROUTES.signIn)}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <img
          className="account__illustration"
          src={illustration}
          width="710"
          height="722"
          alt="Taste profile illustration: a 92% match ring with Drama, Romance, Comedy, Thriller and Adventure tags"
          loading="lazy"
        />

        <ul className="account__benefits">
          {ACCOUNT_BENEFITS.map(({ title, text }) => (
            <li key={title} className="benefit">
              <StarIcon />
              <h3 className="benefit__title">{title}</h3>
              <p className="benefit__text">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
