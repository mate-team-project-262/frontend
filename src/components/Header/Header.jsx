import { Link, useNavigate } from 'react-router';
import { onNavAccountBenefits, onNavHowItWorks, onSignIn } from '../../handlers.js';
import { ROUTES } from '../../routes.js';
import { cx } from '../../utils/classNames.js';
import LinkButton from '../LinkButton/LinkButton.jsx';
import './Header.css';

/**
 * variant: 'landing' (navigation + Sign in) | 'back' (only a "Back to home" link)
 *          | 'leave' (only a "Leave room" button that calls `onLeave`).
 */
export default function Header({ variant = 'landing', onLeave }) {
  const navigate = useNavigate();
  const isBack = variant === 'back';

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to={ROUTES.home} className="header__logo">
          LOGO
        </Link>
        <nav className={cx('header__nav', isBack && 'header__nav--back')}>
          {variant === 'leave' ? (
            <LinkButton onClick={onLeave}>Leave room</LinkButton>
          ) : isBack ? (
            <LinkButton onClick={() => navigate(ROUTES.home)}>Back to home</LinkButton>
          ) : (
            <>
              <LinkButton className="header__nav-link" onClick={onNavHowItWorks}>
                How it works
              </LinkButton>
              <LinkButton className="header__nav-link" onClick={onNavAccountBenefits}>
                Account benefits
              </LinkButton>
              <LinkButton bold className="header__sign-in" onClick={onSignIn}>
                Sign in
              </LinkButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
