import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';
import { getFirstName } from '../../utils/userName.ts';
import '../../styles/landing.css';
import LandingHeader from '../LandingHeader/LandingHeader.tsx';
import { HeadIcon, HistoryIcon, HomeIcon } from './icons.tsx';
import './AccountLayout.css';

const TABS = [
  { to: ROUTES.dashboard, label: 'Home', icon: <HomeIcon />, end: true },
  { to: ROUTES.sessions, label: 'Sessions', icon: <HistoryIcon size={18} /> },
  { to: ROUTES.movieIdentity, label: 'Movie identity', icon: <HeadIcon size={18} /> },
];

interface Props {
  children: ReactNode;
}

/**
 * Shared frame of the signed-in pages (Home, Sessions, Movie identity): the header, the greeting
 * with the person's name, the three tabs and the cream panel with the page itself.
 */
export default function AccountLayout({ children }: Props) {
  const { user } = useAccount();

  return (
    <div className="account-page landing">
      <LandingHeader />
      <div className="account-page__intro">
        {/* the same greeting on every tab (designer): "Welcome" and the first name */}
        <h1 className="account-page__title account-page__title--welcome">
          Welcome, <span className="account-page__name">{getFirstName(user?.name ?? '')}</span>{' '}
          <span aria-hidden="true">👋</span>
        </h1>
        <p className="account-page__subtitle">
          Create rooms, view past sessions and explore your movie taste.
        </p>
        <nav className="account-tabs" aria-label="Account sections">
          {TABS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'account-tabs__tab account-tabs__tab--active' : 'account-tabs__tab'
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <main className="account-page__panel">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
