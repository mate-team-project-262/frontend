import Button from '../../components/Button/Button.jsx';
import LinkButton from '../../components/LinkButton/LinkButton.jsx';
import TasteProfileCard from '../../components/TasteProfileCard/TasteProfileCard.jsx';
import { ACCOUNT_BENEFITS, SAMPLE_TASTE_PROFILE } from '../../data/content.js';
import { onCreateAccount, onSignIn } from '../../handlers.js';
import './AccountBenefits.css';

export default function AccountBenefits() {
  return (
    <section className="account" id="account-benefits">
      <div className="container account__inner">
        <div className="account__content">
          <h2 className="title title--l account__title">You do not need an account to play</h2>
          <p className="account__lead">But an account can make the service smarter over time</p>

          <h3 className="account__benefits-title">Why create an account?</h3>
          <ul className="account__benefits">
            {ACCOUNT_BENEFITS.map((benefit) => (
              <li key={benefit}>• {benefit}</li>
            ))}
          </ul>

          <div className="account__actions">
            <Button onClick={onCreateAccount}>Create free account</Button>
            <span className="account__sign-in-text">Already have one?</span>
            <LinkButton bold className="account__sign-in" onClick={onSignIn}>
              Sign in
            </LinkButton>
          </div>
        </div>

        <TasteProfileCard profile={SAMPLE_TASTE_PROFILE} />
      </div>
    </section>
  );
}
