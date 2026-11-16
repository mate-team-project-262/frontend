import { useState } from 'react';
import { RoomApiError, changePassword } from '../../api/roomsApi.ts';
import BrandField from '../../components/BrandField/BrandField.tsx';
import FormModal from '../../components/FormModal/FormModal.tsx';
import { PASSWORD_MAX_LENGTH, validateNewPassword } from '../../utils/validation.ts';

const RULE = 'Use 8+ characters, including a letter and a number';
const FAILED = 'Could not change the password. Check your connection and try again.';

interface Props {
  onCancel: () => void;
  /** the password is changed and the backend has ended the session */
  onChanged: () => void;
}

/** Mockup "Change password": the current password, the new one twice. */
export default function PasswordModal({ onCancel, onChanged }: Props) {
  const [values, setValues] = useState({ current: '', next: '', repeat: '' });
  const [errors, setErrors] = useState<{ current?: string; next?: string; form?: string }>({});
  const [isBusy, setIsBusy] = useState(false);

  const isNewValid = !validateNewPassword(values.next);
  const doesRepeatMatch = values.repeat === values.next;
  const canSubmit = Boolean(values.current) && isNewValid && doesRepeatMatch;

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors({});
  };

  const submit = async () => {
    setIsBusy(true);
    try {
      await changePassword({ currentPassword: values.current, newPassword: values.next });
      onChanged();
    } catch (error) {
      const message = error instanceof RoomApiError ? error.message : FAILED;
      const code = error instanceof RoomApiError ? error.code : null;
      if (code === 'INVALID_CURRENT_PASSWORD') setErrors({ current: message });
      else if (code === 'PASSWORD_NOT_CHANGED' || code === 'VALIDATION_ERROR') {
        setErrors({ next: message });
      } else setErrors({ form: message });
      setIsBusy(false);
    }
  };

  return (
    <FormModal
      title="Change password"
      text="Enter your current password and choose a new one"
      submitLabel={isBusy ? 'Updating…' : 'Update password'}
      canSubmit={canSubmit}
      isBusy={isBusy}
      error={errors.form}
      onCancel={onCancel}
      onSubmit={submit}
    >
      <BrandField
        label="Current password"
        type="password"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={values.current}
        error={errors.current}
        onChange={set('current')}
      />
      <BrandField
        label="New password"
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={values.next}
        hint={RULE}
        success={Boolean(values.next) && isNewValid}
        error={errors.next}
        onChange={set('next')}
      />
      <BrandField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={values.repeat}
        success={Boolean(values.repeat) && doesRepeatMatch && isNewValid}
        error={values.repeat && !doesRepeatMatch ? 'The passwords do not match' : undefined}
        onChange={set('repeat')}
      />
    </FormModal>
  );
}
