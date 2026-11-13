import ConfirmModal from '../ConfirmModal/ConfirmModal.tsx';

interface Props {
  isLoggingOut: boolean;
  error?: string;
  onCancel: () => void;
  onLogout: () => void;
}

/** "Log out?" confirmation, opened from the user menu. */
export default function LogoutModal({ isLoggingOut, error, onCancel, onLogout }: Props) {
  return (
    <ConfirmModal
      title="Log out?"
      text={
        <>
          Are you sure you want to log out of your account?
          <br />
          You can sign back in anytime
        </>
      }
      error={error}
      cancelLabel="Cancel"
      confirmLabel="Log out"
      isBusy={isLoggingOut}
      onCancel={onCancel}
      onConfirm={onLogout}
    />
  );
}
