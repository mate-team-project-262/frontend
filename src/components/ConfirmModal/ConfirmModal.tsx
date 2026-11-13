import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/classNames.ts';
import BrandButton from '../BrandButton/BrandButton.tsx';
import '../../styles/landing.css'; // theme tokens (the dialog is rendered outside the page)
import './ConfirmModal.css';

/** UI kit "leave / log out" icon: a box with an arrow going into it (40 x 40). */
export function ExitIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M5 13V5h30v30H5v-8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 20h20M17 14l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

interface Props {
  title: string;
  text: ReactNode;
  /** extra line in a grey box under the text */
  note?: ReactNode;
  /** an error of the confirmed action (e.g. the server could not be reached) */
  error?: string;
  icon?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  /** the confirmed action is running: the confirm button is disabled */
  isBusy?: boolean;
  /** 488px instead of 472px (the variant with a note) */
  wide?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation dialog over a blurred page. `onCancel` closes it (✕, Esc, a click outside, the
 * outlined button), `onConfirm` does the action. Focus starts on the cancel button, so Enter
 * never confirms by accident, and stays inside the dialog.
 */
export default function ConfirmModal({
  title,
  text,
  note,
  error,
  icon = <ExitIcon />,
  cancelLabel,
  confirmLabel,
  isBusy = false,
  wide = false,
  onCancel,
  onConfirm,
}: Props) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep Tab inside the dialog
      const items = [
        ...(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
      ];
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

  // rendered at the end of <body>, so it covers the page wherever it was opened from (e.g. the header)
  return createPortal(
    <div
      className="confirm-modal"
      role="presentation" /* a click on the dimmed backdrop closes it, Esc does the same */
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <section
        ref={panelRef}
        className={cx('confirm-modal__panel', wide && 'confirm-modal__panel--wide')}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
      >
        <button
          type="button"
          className="confirm-modal__close"
          aria-label="Close"
          onClick={onCancel}
        >
          <CloseIcon />
        </button>
        <div className="confirm-modal__icon">{icon}</div>
        <h2 className="confirm-modal__title" id={`${id}-title`}>
          {title}
        </h2>
        <p className="confirm-modal__text" id={`${id}-text`}>
          {text}
        </p>
        {note && <p className="confirm-modal__note">{note}</p>}
        {error && (
          <p className="confirm-modal__error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-modal__actions">
          <BrandButton
            ref={cancelRef}
            variant="ghost"
            className="confirm-modal__button confirm-modal__button--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </BrandButton>
          <BrandButton
            className="confirm-modal__button confirm-modal__button--confirm"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </BrandButton>
        </div>
      </section>
    </div>,
    document.body,
  );
}
