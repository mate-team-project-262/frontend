import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAccount } from '../../hooks/useAccount.ts';
import { ROUTES } from '../../routes.ts';

/**
 * Wraps a page that only a signed-in person may open: a guest is sent to the Sign In page.
 * While the app is still asking the backend who is signed in, nothing is shown (a moment).
 */
export default function RequireAccount({ children }: { children: ReactNode }) {
  const { status } = useAccount();
  if (status === 'loading') return null;
  if (status === 'guest') return <Navigate to={ROUTES.signIn} replace />;
  return children;
}
