import { Link, useNavigate } from 'react-router';
import logo from '../../assets/landing/w2w-logo.svg';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';
import { cx } from '../../utils/classNames.ts';
import UserMenu from '../UserMenu/UserMenu.tsx';
import './BrandHeader.css';

function ArrowLeft() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path
        d="M17 7H1.5M7.5 1 1.5 7l6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** UI kit "leave" icon: a box with an arrow going into it (16 x 16). */
function LeaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M.6 5V.6h14.8v14.8H.6V11" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M1 8h8.5M6.5 5l3 3-3 3"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Header of the dark pages: W2W logo and a "Back" button. Without `onBack` it goes to the
 * landing page; pass `onBack` when going back must do something first (e.g. leave the room).
 * `action="leave"` shows "Leave room" with the leave icon instead (swipe session).
 * A signed-in person also gets the menu with their name (mockup "Create room (Signed In)").
 */
export default function BrandHeader({
  onBack,
  action = 'back',
  backLabel = 'Back',
}: {
  onBack?: () => void;
  action?: 'back' | 'leave';
  /** the text of the "Back" button, e.g. "Back to Home" */
  backLabel?: string;
}) {
  const navigate = useNavigate();
  const { user } = useAccount();

  return (
    <header className={cx('brand-header', action === 'leave' && 'brand-header--leave')}>
      <div className="container brand-header__inner">
        <Link to={ROUTES.home} className="brand-header__logo" title="Home page">
          <img src={logo} width="106" height="48" alt="W2W – What To Watch" />
        </Link>
        <div className={cx('brand-header__actions', user && 'brand-header__actions--account')}>
          <button
            type="button"
            className={cx(
              'brand-header__back',
              // a long label next to the user menu does not fit a phone: only the arrow stays there
              action === 'back' &&
                backLabel !== 'Back' &&
                user &&
                'brand-header__back--short-on-phone',
            )}
            aria-label={action === 'leave' ? 'Leave room' : backLabel}
            onClick={onBack ?? (() => navigate(user ? ROUTES.dashboard : ROUTES.home))}
          >
            {action === 'leave' ? <LeaveIcon /> : <ArrowLeft />}
            <span className="brand-header__back-text">
              {action === 'leave' ? 'Leave room' : backLabel}
            </span>
          </button>
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
