import { type FormEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/classNames.ts';
import BrandButton from '../BrandButton/BrandButton.tsx';
import '../../styles/landing.css'; // theme tokens (the dialog is rendered outside the page)
import '../ConfirmModal/ConfirmModal.css'; // the shared backdrop and close button
import './FormModal.css';

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 2l20 20M22 2 2 22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FOCUSABLE = 'input:not(:disabled), button:not(:disabled)';

interface Props {
  title: string;
  text: ReactNode;
  /** the fields of the form */
  children: ReactNode;
  /** a problem of the whole form (e.g. the server could not be reached) */
  error?: string;
  cancelLabel?: string;
  submitLabel: string;
  /** the submit button stays disabled until the form is ready */
  canSubmit?: boolean;
  isBusy?: boolean;
  /** red submit button for an action that cannot be undone */
  danger?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * A dialog with a small form over the blurred page (mockups "Change password", "Delete account").
 * ✕, Esc, a click outside and "Cancel" close it; Enter in a field submits. Focus starts in the
 * first field and stays inside the dialog.
 */
export default function FormModal({
  title,
  text,
  children,
  error,
  cancelLabel = 'Cancel',
  submitLabel,
  canSubmit = true,
  isBusy = false,
  danger = false,
  onCancel,
  onSubmit,
}: Props) {
  const id = useId();
  const panelRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input')?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit && !isBusy) onSubmit();
  };

  return createPortal(
    <div
      className="confirm-modal"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <form
        ref={panelRef}
        className="form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
        noValidate
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="confirm-modal__close"
          aria-label="Close"
          onClick={onCancel}
        >
          <CloseIcon />
        </button>
        <h2 className="form-modal__title" id={`${id}-title`}>
          {title}
        </h2>
        <p className="form-modal__text" id={`${id}-text`}>
          {text}
        </p>
        <div className="form-modal__fields">{children}</div>
        {error && (
          <p className="form-modal__error" role="alert">
            {error}
          </p>
        )}
        <div className="form-modal__actions">
          <BrandButton variant="ghost" className="form-modal__button" onClick={onCancel}>
            {cancelLabel}
          </BrandButton>
          <BrandButton
            type="submit"
            className={cx('form-modal__button', danger && 'form-modal__button--danger')}
            disabled={!canSubmit || isBusy}
          >
            {submitLabel}
          </BrandButton>
        </div>
      </form>
    </div>,
    document.body,
  );
}
