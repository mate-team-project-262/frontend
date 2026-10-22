import { onNavAccountBenefits, onNavHowItWorks, onSignIn } from '../../handlers.js';
import LinkButton from '../LinkButton/LinkButton.jsx';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <span className="header__logo">LOGO</span>
        <nav className="header__nav">
          <LinkButton className="header__nav-link" onClick={onNavHowItWorks}>
            How it works
          </LinkButton>
          <LinkButton className="header__nav-link" onClick={onNavAccountBenefits}>
            Account benefits
          </LinkButton>
          <LinkButton bold className="header__sign-in" onClick={onSignIn}>
            Sign in
          </LinkButton>
        </nav>
      </div>
    </header>
  );
}
