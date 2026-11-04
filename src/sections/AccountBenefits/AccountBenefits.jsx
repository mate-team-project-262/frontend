import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import illustration from '../../assets/landing/account-illustration.webp';
import { ACCOUNT_BENEFITS } from '../../data/content.js';
import { onCreateAccount, onSignIn } from '../../handlers.js';
import './AccountBenefits.css';

function StarIcon() {
  return (
    <svg className="benefit__star" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 0c.5 3.6 2.4 5.9 7 7-4.6 1.1-6.5 3.4-7 7-.5-3.6-2.4-5.9-7-7 4.6-1.1 6.5-3.4 7-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AccountBenefits() {
  return (
    <section className="account" id="account-benefits">
      <div className="container account__inner">
        <div className="account__content">
          <h2 className="account__title">
            Your picks get <span className="account__title-accent">more</span> personal over time
          </h2>
          <p className="account__lead">
            Create an account to save your sessions, avoid repeats, and build a movie identity from
            the choices you make.
          </p>
          <div className="account__actions">
            <BrandButton className="account__button" onClick={onCreateAccount}>
              Create free account
            </BrandButton>
            <p className="account__sign-in">
              Already have one?{' '}
              <button type="button" className="account__sign-in-link" onClick={onSignIn}>
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
          alt=""
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
