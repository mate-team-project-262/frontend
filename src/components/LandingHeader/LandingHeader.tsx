import type { ComponentPropsWithoutRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import logo from '../../assets/landing/w2w-logo.svg';
import { ROUTES } from '../../routes.ts';
import { cx } from '../../utils/classNames.ts';
import { scrollToSection } from '../../utils/scrollToSection.ts';
import './LandingHeader.css';

function NavButton({
  bold = false,
  ...props
}: ComponentPropsWithoutRef<'button'> & { bold?: boolean }) {
  return (
    <button
      type="button"
      className={cx('landing-header__link', bold && 'landing-header__link--bold')}
      {...props}
    />
  );
}

/**
 * Logo + navigation of the landing page and the account screens (96px tall, as in the design).
 * "How it works" and "Account benefits" scroll to their section; from another page they open the
 * landing page first (LandingPage scrolls when it gets `state.scrollTo`).
 */
export default function LandingHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goToSection = (id: string) => {
    if (pathname === ROUTES.home) scrollToSection(id);
    else navigate(ROUTES.home, { state: { scrollTo: id } });
  };

  return (
    <header className="landing-header">
      <div className="container landing-header__inner">
        <Link
          to={ROUTES.home}
          className="landing-header__logo"
          aria-label="W2W – What To Watch, home page"
        >
          <img src={logo} width="106" height="48" alt="" />
        </Link>
        <nav className="landing-header__nav" aria-label="Main">
          <NavButton onClick={() => goToSection('how-it-works')}>How it works</NavButton>
          <NavButton onClick={() => goToSection('account-benefits')}>Account benefits</NavButton>
          <NavButton bold onClick={() => navigate(ROUTES.signIn)}>
            Sign In
          </NavButton>
        </nav>
      </div>
    </header>
  );
}
