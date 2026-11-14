import { type ReactNode, useState } from 'react';
import { Navigate } from 'react-router';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';

/**
 * Wraps a page that only a signed-in person may open: a guest is sent to the Sign In page.
 * While the app is still asking the backend who is signed in, nothing is shown (a moment).
 * Someone who was signed in on this page and no longer is has just logged out: they go to the
 * landing page, not to Sign In (otherwise this redirect races with the one of "Log out").
 */
export default function RequireAccount({ children }: { children: ReactNode }) {
  const { status } = useAccount();
  const [wasSignedIn, setWasSignedIn] = useState(false);
  if (status === 'signed-in' && !wasSignedIn) setWasSignedIn(true);

  if (status === 'loading') return null;
  if (status === 'guest') {
    return <Navigate to={wasSignedIn ? ROUTES.home : ROUTES.signIn} replace />;
  }
  return children;
}
