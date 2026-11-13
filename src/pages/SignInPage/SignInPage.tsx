import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { track } from '../../analytics/analytics.ts';
import { RoomApiError, signIn } from '../../api/roomsApi.ts';
import AuthLayout from '../../components/AuthLayout/AuthLayout.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import LightField from '../../components/LightField/LightField.tsx';
import SocialButtons from '../../components/SocialButtons/SocialButtons.tsx';
import { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import { useAccount } from '../../hooks/useAccount.ts';
import { useFormFields } from '../../hooks/useFormFields.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { PASSWORD_MAX_LENGTH, validateAccountName } from '../../utils/validation.ts';

const FAILED = 'We could not sign you in. Please try again.';

/**
 * /sign-in - "Sign In" by the account name and password (POST /auth/login). The backend gives
 * the same answer for a wrong name and a wrong password, so the message does not say which.
 * "Forgot password?" appears with the password reset flow (the backend has no endpoint yet).
 */
export default function SignInPage() {
  usePageMeta();
  const navigate = useNavigate();
  const { status, setUser } = useAccount();
  const form = useFormFields({
    name: validateAccountName,
    password: (value) => (value ? '' : 'Please enter your password'),
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'signed-in' && !isSubmitting) return <Navigate to={ROUTES.home} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    form.touchAll();
    if (!form.isValid) return;

    setIsSubmitting(true);
    setFormError('');
    try {
      const user = await signIn({ name: form.values.name.trim(), password: form.values.password });
      track('login', { method: 'password' });
      setUser(user);
      navigate(ROUTES.home);
    } catch (error) {
      setFormError(error instanceof RoomApiError ? error.message : FAILED);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Save your results, track your movie identity and get personalised recommendations"
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <LightField
          label="Your name"
          icon="user"
          placeholder="Enter your name"
          autoComplete="username"
          maxLength={60}
          {...form.field('name')}
        />
        <LightField
          label="Password"
          type="password"
          icon="lock"
          placeholder="Enter your password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          {...form.field('password')}
        />
        {formError && (
          <p className="auth-form__error" role="alert">
            {formError}
          </p>
        )}
        <BrandButton type="submit" className="auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
          <ArrowRightIcon />
        </BrandButton>
      </form>
      <SocialButtons />
      <p className="auth-card__footer">
        Don’t have an account?
        <Link className="auth-card__link" to={ROUTES.signUp}>
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
