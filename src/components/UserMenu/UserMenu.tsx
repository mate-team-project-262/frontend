import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, type User, signOut } from '../../api/roomsApi.ts';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';
import { cx } from '../../utils/classNames.ts';
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

const LOGOUT_FAILED = 'Could not log out. Check your connection and try again.';

/**
 * The pill with the user's name in the header (UI kit "user menu"). It opens a small menu:
 * "My account" (inactive until that page exists) and "Log out", which asks first.
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
        <span className="user-menu__name">{user.name}</span>
        <Chevron />
      </button>
      {isOpen && (
        <ul className="user-menu__list" id={menuId}>
          <li>
            <button type="button" className="user-menu__item" disabled title="Coming soon">
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
