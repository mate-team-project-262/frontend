import { useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { RoomApiError, checkResetToken, errorCode, resetPassword } from '../../api/roomsApi.ts';
import AuthLayout from '../../components/AuthLayout/AuthLayout.tsx';
import {
  AuthBadge,
  BackToSignIn,
  CheckIcon,
  MailIcon,
} from '../../components/AuthLayout/AuthParts.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import LightField from '../../components/LightField/LightField.tsx';
import { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import { useAccount } from '../../hooks/useAccount.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { PASSWORD_MAX_LENGTH, validateNewPassword } from '../../utils/validation.ts';

const RULE = 'Use 8+ characters, including a letter and a number';
const FAILED = 'We could not change the password. Check your connection and try again.';

/**
 * The token of the link: from `?token=` on the first visit, then from the history entry.
 * It is moved out of the address bar at once, so it does not stay in the browser history,
 * in a shared screenshot or in analytics; a reload still finds it in the history state.
 */
function useResetToken(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const fromQuery = new URLSearchParams(location.search).get('token');
  const token = fromQuery || (location.state as { token?: string } | null)?.token || null;

  useEffect(() => {
    if (fromQuery) navigate(ROUTES.resetPassword, { replace: true, state: { token: fromQuery } });
  }, [fromQuery, navigate]);

  return token;
}

/** The link is unknown, expired (20 minutes), used, or a newer email replaced it. */
function LinkExpired() {
  const navigate = useNavigate();
  return (
    <AuthLayout
      title="Link expired"
      align="center"
      badge={
        <AuthBadge>
          <MailIcon />
        </AuthBadge>
      }
      subtitle="This password reset link has expired or was already used. Request a new one, it works for 20 minutes."
    >
      <div className="auth-card__actions">
        <BrandButton onClick={() => navigate(ROUTES.forgotPassword)}>
          Request a new link
          <ArrowRightIcon />
        </BrandButton>
      </div>
      <BackToSignIn />
    </AuthLayout>
  );
}

function PasswordUpdated() {
  const navigate = useNavigate();
  return (
    <AuthLayout
      title="Password updated"
      align="center"
      badge={
        <AuthBadge>
          <CheckIcon />
        </AuthBadge>
      }
      subtitle={
        <>
          Your password has been successfully changed
          <span className="auth-card__strong">You can now sign in with your new password</span>
        </>
      }
    >
      <div className="auth-card__actions">
        <BrandButton onClick={() => navigate(ROUTES.signIn, { replace: true })}>
          Sign In
          <ArrowRightIcon />
        </BrandButton>
      </div>
    </AuthLayout>
  );
}

/**
 * /reset-password?token=... - the link from the email. First the link is checked
 * (GET /auth/reset-password/check), so an old link says so before anything is typed; then
 * "Create a new password" (POST /auth/reset-password) and "Password updated".
 */
export default function ResetPasswordPage() {
  usePageMeta();
  const token = useResetToken();
  const { setUser } = useAccount();
  const check = useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => checkResetToken(token as string).then(() => true),
    enabled: Boolean(token),
  });

  const [values, setValues] = useState({ password: '', repeat: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<{ password?: string; form?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<'updated' | 'expired' | null>(null);

  if (!token || result === 'expired' || errorCode(check.error) === 'RESET_TOKEN_INVALID') {
    return <LinkExpired />;
  }
  if (result === 'updated') return <PasswordUpdated />;

  if (check.isPending || check.isError) {
    return (
      <AuthLayout title="Create a new password" align="center">
        {check.isPending ? (
          <p className="auth-card__small" role="status">
            Checking your link…
          </p>
        ) : (
          <p className="auth-form__error auth-card__small" role="alert">
            We could not check the link.{' '}
            <button type="button" className="auth-card__link" onClick={() => check.refetch()}>
              Try again
            </button>
          </p>
        )}
        <BackToSignIn />
      </AuthLayout>
    );
  }

  const passwordProblem = validateNewPassword(values.password);
  const repeatProblem = !values.repeat
    ? 'Please repeat the new password'
    : values.repeat !== values.password
      ? 'The passwords do not match'
      : '';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitted(true);
    if (passwordProblem || repeatProblem) return;

    setIsSaving(true);
    setServerError({});
    try {
      await resetPassword({ token, newPassword: values.password });
      setUser(null); // every session of the account has ended, this one too
      setResult('updated');
    } catch (problem) {
      const code = problem instanceof RoomApiError ? problem.code : null;
      const message = problem instanceof RoomApiError ? problem.message : FAILED;
      if (code === 'RESET_TOKEN_INVALID') setResult('expired');
      else if (code === 'PASSWORD_NOT_CHANGED' || code === 'VALIDATION_ERROR') {
        setServerError({ password: message });
      } else setServerError({ form: message });
      setIsSaving(false);
    }
  };

  const set = (field: 'password' | 'repeat') => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setServerError({});
  };

  return (
    <AuthLayout
      title="Create a new password"
      align="center"
      subtitle="Your new password must be different from your current password"
    >
      <form className="auth-form auth-form--left" noValidate onSubmit={handleSubmit}>
        <LightField
          label="New password"
          type="password"
          icon="lock"
          placeholder="Enter new password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          hint={RULE}
          value={values.password}
          error={serverError.password || (isSubmitted ? passwordProblem : '') || undefined}
          onChange={set('password')}
        />
        <LightField
          label="Confirm new password"
          type="password"
          icon="lock"
          placeholder="Confirm new password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.repeat}
          error={(isSubmitted ? repeatProblem : '') || undefined}
          onChange={set('repeat')}
        />
        {serverError.form && (
          <p className="auth-form__error" role="alert">
            {serverError.form}
          </p>
        )}
        <BrandButton type="submit" className="auth-form__submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Reset password'}
          <ArrowRightIcon />
        </BrandButton>
      </form>
      <BackToSignIn />
    </AuthLayout>
  );
}
