import { Link, useNavigate } from 'react-router';
import { ROUTES } from '../../routes.js';
import { cx } from '../../utils/classNames.js';
import LinkButton from '../LinkButton/LinkButton.jsx';
import './Header.css';

/**
 * variant: 'back' (only a "Back to home" link)
 *          | 'leave' (only a "Leave room" button that calls `onLeave`).
 * The landing page has its own header (LandingHeader).
 */
export default function Header({ variant = 'back', onLeave }) {
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
          ) : (
            <LinkButton onClick={() => navigate(ROUTES.home)}>Back to home</LinkButton>
          )}
        </nav>
      </div>
    </header>
  );
}
