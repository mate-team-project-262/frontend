import { type FormEvent, useState } from 'react';
import { RoomApiError } from '../../api/roomsApi.ts';
import BrandField from '../../components/BrandField/BrandField.tsx';
import { PASSWORD_MAX_LENGTH } from '../../utils/validation.ts';

export function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M13.5 3.5 16.5 6.5 7 16H4v-3l9.5-9.5ZM11.5 5.5l3 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FAILED = 'Could not save. Check your connection and try again.';

interface Props {
  label: string;
  value: string;
  /** the button that opens the field: "Edit" for the name, "Change" for the email */
  editLabel: string;
  type?: 'text' | 'email';
  autoComplete?: string;
  maxLength?: number;
  /** a hint while editing, e.g. "You will sign in with this name" */
  hint?: string;
  validate: (value: string) => string;
  /** a changed value is saved only with the current password (the email) */
  needsPassword?: boolean;
  /** saves the new value; throws RoomApiError on a problem */
  onSave: (value: string, currentPassword: string) => Promise<void>;
}

/**
 * One line of "Personal information": the value in a read-only field and "Edit" next to it.
 * "Edit" opens the field with "Save" / "Cancel"; for the email a "Current password" field
 * appears as soon as the value changes. Backend errors land under the field they are about.
 */
export default function EditableField({
  label,
  value,
  editLabel,
  type = 'text',
  autoComplete,
  maxLength,
  hint,
  validate,
  needsPassword = false,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ value?: string; password?: string; form?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isEditing = draft !== null;
  const isChanged = isEditing && draft.trim() !== value;
  const askPassword = needsPassword && isChanged;

  const close = () => {
    setDraft(null);
    setPassword('');
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (draft === null || isSaving) return;
    if (!isChanged) {
      close();
      return;
    }
    const problem = validate(draft);
    const passwordProblem = askPassword && !password ? 'Please enter your current password' : '';
    if (problem || passwordProblem) {
      setErrors({ value: problem || undefined, password: passwordProblem || undefined });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(draft.trim(), password);
      close();
      setIsSaved(true);
    } catch (error) {
      const message = error instanceof RoomApiError ? error.message : FAILED;
      const field = error instanceof RoomApiError ? error.field : null;
      if (field === 'password') setErrors({ password: message });
      else if (field === 'name' || field === 'email') setErrors({ value: message });
      else setErrors({ form: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="account-row" noValidate onSubmit={handleSubmit}>
      <div className="account-row__fields">
        <BrandField
          label={label}
          type={type}
          value={draft ?? value}
          readOnly={!isEditing}
          autoComplete={autoComplete}
          maxLength={maxLength}
          hint={isEditing ? hint : isSaved ? 'Saved' : undefined}
          success={!isEditing && isSaved}
          error={errors.value}
          className={isEditing ? undefined : 'account-row__field--locked'}
          onChange={(event) => {
            setDraft(event.target.value);
            setErrors({});
          }}
        />
        {askPassword && (
          <BrandField
            label="Current password"
            type="password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
            hint="Needed to change your email"
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined, form: undefined }));
            }}
          />
        )}
        {errors.form && (
          <p className="account-row__error" role="alert">
            {errors.form}
          </p>
        )}
      </div>
      <div className="account-row__actions">
        {isEditing ? (
          <>
            {/* own keys: React must not turn the pressed "Edit" button into this submit button
                while the click is still running (the browser would then submit the form) */}
            <button key="save" type="submit" className="account-action" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              key="cancel"
              type="button"
              className="account-action account-action--quiet"
              onClick={close}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            key="edit"
            type="button"
            className="account-action"
            aria-label={`${editLabel} ${label.toLowerCase()}`}
            onClick={(event) => {
              setDraft(value);
              setIsSaved(false);
              // the field becomes editable on this render: focus it right after
              const row = event.currentTarget.closest('form');
              requestAnimationFrame(() => row?.querySelector('input')?.focus());
            }}
          >
            {editLabel}
            <PencilIcon />
          </button>
        )}
      </div>
    </form>
  );
}
