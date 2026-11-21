import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { logEvent } from '../../analytics/productEvents.ts';
import { RoomApiError, type User, signOut } from '../../api/roomsApi.ts';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';
import { cx } from '../../utils/classNames.ts';
import { getFirstName } from '../../utils/userName.ts';
import LogoutModal from '../LogoutModal/LogoutModal.tsx';
import './UserMenu.css';

function Chevron() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
      <path
        d="m1.5 1.5 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A person (head and shoulders): stands for the name on phones (designer, 20.11) */
function PersonIcon() {
  return (
    <svg
      className="user-menu__icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="5.5" r="3.4" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.5 16.5c.4-3.4 3.1-5.6 6.5-5.6s6.1 2.2 6.5 5.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const LOGOUT_FAILED = 'Could not log out. Check your connection and try again.';

/**
 * The pill with the user's name in the header (UI kit "user menu"); on phones a person icon
 * instead of the name. It opens a small menu:
 * "My account" and "Log out", which asks first.
 * The menu closes on Esc, on a click outside and when focus leaves it.
 */
export default function UserMenu({ user }: { user: User }) {
  const navigate = useNavigate();
  const { setUser } = useAccount();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [logout, setLogout] = useState<{ isBusy: boolean; error: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      rootRef.current?.querySelector<HTMLElement>('.user-menu__toggle')?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const confirmLogout = async () => {
    setLogout({ isBusy: true, error: '' });
    try {
      await signOut();
      setUser(null);
      navigate(ROUTES.home);
    } catch (error) {
      setLogout({
        isBusy: false,
        error: error instanceof RoomApiError ? error.message : LOGOUT_FAILED,
      });
    }
  };

  return (
    <div
      ref={rootRef}
      className="user-menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <button
        type="button"
        className={cx('user-menu__toggle', isOpen && 'user-menu__toggle--open')}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((value) => !value)}
      >
        {user.avatarUrl ? (
          <img className="user-menu__icon user-menu__photo" src={user.avatarUrl} alt="" />
        ) : (
          <PersonIcon />
        )}
        {/* on phones only the icon is seen; the name stays for screen readers */}
        <span className="user-menu__name" title={user.name}>
          {getFirstName(user.name)}
        </span>
        <Chevron />
      </button>
      {isOpen && (
        <ul className="user-menu__list" id={menuId}>
          <li>
            <button
              type="button"
              className="user-menu__item"
              onClick={() => {
                setIsOpen(false);
                logEvent('settings_clicked');
                navigate(ROUTES.account);
              }}
            >
              My account
            </button>
          </li>
          <li>
            <button
              type="button"
              className="user-menu__item"
              onClick={() => {
                setIsOpen(false);
                setLogout({ isBusy: false, error: '' });
              }}
            >
              Log out
            </button>
          </li>
        </ul>
      )}
      {logout && (
        <LogoutModal
          isLoggingOut={logout.isBusy}
          error={logout.error}
          onCancel={() => setLogout(null)}
          onLogout={confirmLogout}
        />
      )}
    </div>
  );
}
