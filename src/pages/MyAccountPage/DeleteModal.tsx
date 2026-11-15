import { useState } from 'react';
import { RoomApiError, deleteAccount } from '../../api/roomsApi.ts';
import BrandField from '../../components/BrandField/BrandField.tsx';
import FormModal from '../../components/FormModal/FormModal.tsx';
import { PASSWORD_MAX_LENGTH } from '../../utils/validation.ts';

const CONFIRM_WORD = 'DELETE';
const FAILED = 'Could not delete the account. Check your connection and try again.';

interface Props {
  onCancel: () => void;
  /** the account is gone and the backend has ended the session */
  onDeleted: () => void;
}

/**
 * Mockup "Delete account": the person types DELETE. The backend also asks for the current
 * password, so there is a second field; the red button wakes up when both are filled.
 */
export default function DeleteModal({ onCancel, onDeleted }: Props) {
  const [word, setWord] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; form?: string }>({});
  const [isBusy, setIsBusy] = useState(false);

  const isConfirmed = word.trim().toUpperCase() === CONFIRM_WORD;

  const submit = async () => {
    setIsBusy(true);
    try {
      await deleteAccount(password);
      onDeleted();
    } catch (error) {
      const message = error instanceof RoomApiError ? error.message : FAILED;
      const isPassword = error instanceof RoomApiError && error.field === 'password';
      setErrors(isPassword ? { password: message } : { form: message });
      setIsBusy(false);
    }
  };

  return (
    <FormModal
      title="Delete account"
      text="This action will permanently delete your account and all your saved data will be removed forever"
      submitLabel={isBusy ? 'Deleting…' : 'Delete account'}
      canSubmit={isConfirmed && Boolean(password)}
      isBusy={isBusy}
      danger
      error={errors.form}
      onCancel={onCancel}
      onSubmit={submit}
    >
      <BrandField
        label={`Type ${CONFIRM_WORD} to confirm`}
        placeholder={CONFIRM_WORD}
        autoComplete="off"
        maxLength={20}
        value={word}
        hint={isConfirmed ? undefined : `Please type ${CONFIRM_WORD} to enable account deletion`}
        success={isConfirmed}
        onChange={(event) => setWord(event.target.value)}
      />
      <BrandField
        label="Current password"
        type="password"
        placeholder="Enter your current password"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={password}
        error={errors.password}
        onChange={(event) => {
          setPassword(event.target.value);
          setErrors({});
        }}
      />
    </FormModal>
  );
}
