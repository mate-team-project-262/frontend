import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { updateAccount } from '../../api/roomsApi.ts';
import BrandHeader from '../../components/BrandHeader/BrandHeader.tsx';
import { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import { useAccount } from '../../hooks/useAccount.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { getInitial } from '../../utils/sessionFormat.ts';
import {
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  validateAccountName,
  validateEmail,
} from '../../utils/validation.ts';
import '../../styles/landing.css';
import DeleteModal from './DeleteModal.tsx';
import EditableField from './EditableField.tsx';
import PasswordModal from './PasswordModal.tsx';
import './MyAccountPage.css';

/** Twelve dots in place of the password: the real one is never known to the page. */
const PASSWORD_DOTS = '••••••••••••';

/**
 * /account - "My account": the name and the email (each opens for editing), "Change password"
 * and "Delete account" (each asks in a dialog). A password change and a deletion end the
 * session on the backend, so the page then leaves: to Sign In and to the landing page.
 */
export default function MyAccountPage() {
  usePageMeta();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAccount();
  const [dialog, setDialog] = useState<'password' | 'delete' | null>(null);

  if (!user) return null; // RequireAccount shows the page only to a signed-in person

  /**
   * A password change ended the session on the backend: Sign In takes over and forgets the user
   * there (`signedOut`). Doing it here would make RequireAccount send the person to the landing
   * page first: the forgotten user is seen at once, the new page only after the router's transition.
   */
  const signInAgain = () => {
    queryClient.removeQueries({ queryKey: ['account'] });
    navigate(ROUTES.signIn, {
      replace: true,
      state: {
        signedOut: true,
        notice: 'Your password has been changed. Please sign in with the new one.',
      },
    });
  };

  /** The account is gone: forget it; RequireAccount then opens the landing page. */
  const forgetAccount = () => {
    queryClient.removeQueries({ queryKey: ['account'] });
    setUser(null);
  };

  return (
    <div className="my-account landing">
      <BrandHeader backLabel="Back to Home" onBack={() => navigate(ROUTES.dashboard)} />
      <main className="my-account__main">
        <h1 className="my-account__title">My account</h1>
        <p className="my-account__subtitle">Manage your personal information</p>

        <section className="my-account__profile" aria-label="Profile">
          <span className="my-account__avatar" aria-hidden="true">
            {getInitial(user.name)}
          </span>
          <div className="my-account__who">
            <p className="my-account__name">{user.name}</p>
            <p className="my-account__email">{user.email}</p>
          </div>
        </section>

        <section className="my-account__section" aria-labelledby="account-personal">
          <h2 className="my-account__section-title" id="account-personal">
            Personal information
          </h2>
          <EditableField
            label="Name"
            editLabel="Edit"
            value={user.name}
            autoComplete="username"
            maxLength={DISPLAY_NAME_MAX_LENGTH + 10}
            hint="You will sign in with this name"
            validate={validateAccountName}
            onSave={async (name) => {
              setUser(await updateAccount({ name }));
            }}
          />
          <EditableField
            label="Email address"
            editLabel="Change"
            type="email"
            value={user.email}
            autoComplete="email"
            maxLength={EMAIL_MAX_LENGTH}
            validate={validateEmail}
            needsPassword
            onSave={async (email, currentPassword) => {
              setUser(await updateAccount({ email, currentPassword }));
            }}
          />
        </section>

        <section className="my-account__section" aria-labelledby="account-security">
          <h2 className="my-account__section-title" id="account-security">
            Security
          </h2>
          <div className="account-row">
            <div className="account-row__fields">
              <div className="account-row__static">
                <span className="account-row__label">Password</span>
                <span className="account-row__value" aria-label="Hidden">
                  {PASSWORD_DOTS}
                </span>
              </div>
            </div>
            <div className="account-row__actions">
              <button
                type="button"
                className="account-action"
                onClick={() => setDialog('password')}
              >
                Change password
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </section>

        <section className="my-account__danger" aria-labelledby="account-delete">
          <div>
            <h2 className="my-account__danger-title" id="account-delete">
              Delete account
            </h2>
            <p className="my-account__danger-text">
              Permanently delete your account and saved data
            </p>
          </div>
          <button
            type="button"
            className="account-action account-action--danger"
            onClick={() => setDialog('delete')}
          >
            Delete
            <ArrowRightIcon />
          </button>
        </section>
      </main>

      {dialog === 'password' && (
        <PasswordModal onCancel={() => setDialog(null)} onChanged={signInAgain} />
      )}
      {dialog === 'delete' && (
        <DeleteModal onCancel={() => setDialog(null)} onDeleted={forgetAccount} />
      )}
    </div>
  );
}
