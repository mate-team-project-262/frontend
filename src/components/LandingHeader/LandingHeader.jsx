import { onNavAccountBenefits, onNavHowItWorks, onSignIn } from '../../handlers.js';
import { cx } from '../../utils/classNames.js';
import logo from '../../assets/landing/w2w-logo.svg';
import './LandingHeader.css';

function NavButton({ bold = false, ...props }) {
  return (
    <button
      type="button"
      className={cx('landing-header__link', bold && 'landing-header__link--bold')}
      {...props}
    />
  );
}

/** Logo + navigation, lies on top of the hero background (96px tall, as in the design). */
export default function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="container landing-header__inner">
        <img className="landing-header__logo" src={logo} width="106" height="48" alt="W2W" />
        <nav className="landing-header__nav" aria-label="Main">
          <NavButton onClick={onNavHowItWorks}>How it works</NavButton>
          <NavButton onClick={onNavAccountBenefits}>Account benefits</NavButton>
          <NavButton bold onClick={onSignIn}>
            Sign In
          </NavButton>
        </nav>
      </div>
    </header>
  );
}
