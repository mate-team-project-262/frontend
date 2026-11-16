import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, requestPasswordReset } from '../../api/roomsApi.ts';
import AuthLayout from '../../components/AuthLayout/AuthLayout.tsx';
import { AuthBadge, BackToSignIn, MailIcon } from '../../components/AuthLayout/AuthParts.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import LightField from '../../components/LightField/LightField.tsx';
import { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import { formatCountdown, useCountdown } from '../../hooks/useCountdown.ts';
import { useFormFields } from '../../hooks/useFormFields.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { EMAIL_MAX_LENGTH, validateEmail } from '../../utils/validation.ts';

const FAILED = 'We could not send the email. Check your connection and try again.';
/** The backend sends one email a minute to the same address. */
const RESEND_AFTER_SECONDS = 60;

/**
 * /forgot-password - "Reset your password": the person types their email and gets a link
 * (POST /auth/forgot-password). Then "Check your email" with "Resend email", which waits a
 * minute between emails as the backend does.
 */
export default function ForgotPasswordPage() {
  usePageMeta();
  const navigate = useNavigate();
  const form = useFormFields({ email: validateEmail });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const cooldown = useCountdown();

  const send = async (email: string) => {
    setIsSending(true);
    setError('');
    try {
      await requestPasswordReset(email);
      setSentTo(email);
      cooldown.start(RESEND_AFTER_SECONDS);
    } catch (problem) {
      if (problem instanceof RoomApiError && problem.code === 'TOO_MANY_REQUESTS') {
        // an email was sent a moment ago: the link from it works, just wait for the next one
        setSentTo(email);
        cooldown.start(problem.retryAfter ?? RESEND_AFTER_SECONDS);
      } else {
        setError(problem instanceof RoomApiError ? problem.message : FAILED);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    form.touchAll();
    if (form.isValid) void send(form.values.email.trim());
  };

  if (sentTo) {
    const canResend = cooldown.secondsLeft === 0 && !isSending;
    return (
      <AuthLayout
        title="Check your email"
        align="center"
        badge={
          <AuthBadge>
            <MailIcon />
          </AuthBadge>
        }
      >
        <p className="auth-card__subtitle">
          We’ve sent a password reset link to
          <span className="auth-card__accent">{sentTo}</span>
        </p>
        <div className="auth-card__actions">
          <BrandButton onClick={() => navigate(ROUTES.signIn)}>
            Back to Sign In
            <ArrowRightIcon />
          </BrandButton>
          <BrandButton
            className="auth-card__secondary"
            variant="ghost"
            disabled={!canResend}
            onClick={() => void send(sentTo)}
          >
            {isSending
              ? 'Sending…'
              : cooldown.secondsLeft > 0
                ? `Resend email in ${formatCountdown(cooldown.secondsLeft)}`
                : 'Resend email'}
          </BrandButton>
        </div>
        {error && (
          <p className="auth-form__error auth-card__small" role="alert">
            {error}
          </p>
        )}
        <p className="auth-card__small">
          The link works for 20 minutes. No email? Check the spam folder or the address.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      align="center"
      subtitle="Enter your email address and we’ll send you a link to reset your password"
    >
      <form className="auth-form auth-form--left" noValidate onSubmit={handleSubmit}>
        <LightField
          label="Email address"
          type="email"
          icon="mail"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          {...form.field('email')}
        />
        {error && (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        )}
        <BrandButton type="submit" className="auth-form__submit" disabled={isSending}>
          {isSending ? 'Sending…' : 'Send reset link'}
          <ArrowRightIcon />
        </BrandButton>
      </form>
      <BackToSignIn />
    </AuthLayout>
  );
}
