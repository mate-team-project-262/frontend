import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { track } from '../../analytics/analytics.ts';
import { RoomApiError, register } from '../../api/roomsApi.ts';
import AuthLayout from '../../components/AuthLayout/AuthLayout.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import LightField from '../../components/LightField/LightField.tsx';
import SocialButtons from '../../components/SocialButtons/SocialButtons.tsx';
import { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import { useAccount } from '../../hooks/useAccount.ts';
import { useFormFields } from '../../hooks/useFormFields.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  validateAccountName,
  validateEmail,
  validateNewPassword,
} from '../../utils/validation.ts';

const PASSWORD_HINT = 'Use 8+ characters, including a letter and a number';
const FAILED = 'We could not create the account. Please try again.';

/**
 * /sign-up - "Sign Up": name, email and password. The account is created and the person is
 * signed in at once (POST /auth/register). Rules are the backend's: a unique name of 3-20
 * characters (it is also the sign-in name), a valid email, a password of 8+ characters with a
 * letter and a number.
 */
export default function SignUpPage() {
  usePageMeta();
  const navigate = useNavigate();
  const { status, setUser } = useAccount();
  const form = useFormFields({
    name: validateAccountName,
    email: validateEmail,
    password: validateNewPassword,
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
      const user = await register({
        name: form.values.name.trim(),
        email: form.values.email.trim(),
        password: form.values.password,
      });
      track('sign_up', { method: 'password' });
      setUser(user);
      navigate(ROUTES.home);
    } catch (error) {
      const message = error instanceof RoomApiError ? error.message : FAILED;
      const field = error instanceof RoomApiError ? error.field : null;
      if (field === 'name' || field === 'email' || field === 'password') {
        form.setServerErrors({ [field]: message });
      } else {
        setFormError(message);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign Up"
      subtitle="Save your results, track your movie identity and get personalised recommendations"
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <LightField
          label="Full name"
          icon="user"
          placeholder="Peter Potter"
          autoComplete="username"
          maxLength={60}
          hint="You will sign in with this name"
          {...form.field('name')}
        />
        <LightField
          label="Email address"
          type="email"
          icon="mail"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          {...form.field('email')}
        />
        <LightField
          label="Password"
          type="password"
          icon="lock"
          placeholder="Create password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          hint={PASSWORD_HINT}
          {...form.field('password')}
        />
        {formError && (
          <p className="auth-form__error" role="alert">
            {formError}
          </p>
        )}
        <BrandButton type="submit" className="auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
          <ArrowRightIcon />
        </BrandButton>
      </form>
      <SocialButtons />
      <p className="auth-card__footer">
        Already have an account?
        <Link className="auth-card__link" to={ROUTES.signIn}>
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
