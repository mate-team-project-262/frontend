import type { ComponentPropsWithoutRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import logo from '../../assets/landing/w2w-logo.svg';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';
import { cx } from '../../utils/classNames.ts';
import { scrollToSection } from '../../utils/scrollToSection.ts';
import BrandButton from '../BrandButton/BrandButton.tsx';
import UserMenu from '../UserMenu/UserMenu.tsx';
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Logo + navigation of the landing page and the account screens (96px tall, as in the design).
 * "How it works" and "Account benefits" scroll to their section; from another page they open the
 * landing page first (LandingPage scrolls when it gets `state.scrollTo`).
 * For a signed-in person the links are replaced by "Create a room" and the user menu.
 */
export default function LandingHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAccount();

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
        {user ? (
          <div className="landing-header__account">
            <BrandButton
              className="landing-header__create"
              onClick={() => navigate(ROUTES.createRoom)}
            >
              <span className="landing-header__create-label">Create a room</span>
              <PlusIcon />
            </BrandButton>
            <UserMenu user={user} />
          </div>
        ) : (
          <nav className="landing-header__nav" aria-label="Main">
            <NavButton onClick={() => goToSection('how-it-works')}>How it works</NavButton>
            <NavButton onClick={() => goToSection('account-benefits')}>Account benefits</NavButton>
            <NavButton bold onClick={() => navigate(ROUTES.signIn)}>
              Sign In
            </NavButton>
          </nav>
        )}
      </div>
    </header>
  );
}
