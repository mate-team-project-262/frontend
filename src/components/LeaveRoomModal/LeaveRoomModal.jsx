import { useEffect, useRef } from 'react';
import { cx } from '../../utils/classNames.js';
import BrandButton from '../BrandButton/BrandButton.jsx';
import './LeaveRoomModal.css';

function LeaveIcon() {
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
      <path d="M2 2l20 20M22 2 2 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Texts of the two variants (Figma: "leave room as PARTICIPANT" / "leave room as HOST"). */
function getTexts(isHost, isAlone) {
  if (!isHost) {
    return {
      text: 'Your voting progress will be lost and you won’t see the results of this session',
      note: null,
    };
  }
  return {
    text: 'Your voting progress will be lost',
    // Not in the design: a host who is alone closes the room (PM decision).
    note: isAlone
      ? 'You are the only one here, so the room will be closed'
      : 'Your host role will be transferred to another participant, and the voting will continue',
  };
}

/**
 * "Leave room?" confirmation. `onStay` closes it (✕, Esc, a click outside, "Stay in room"),
 * `onLeave` leaves the room. Focus starts on "Stay in room" and stays inside the dialog.
 */
export default function LeaveRoomModal({ isHost, isAlone, isLeaving, error, onStay, onLeave }) {
  const panelRef = useRef(null);
  const stayRef = useRef(null);
  const { text, note } = getTexts(isHost, isAlone);

  useEffect(() => {
    stayRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onStay();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep Tab inside the dialog
      const items = [...panelRef.current.querySelectorAll('button:not(:disabled)')];
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
  }, [onStay]);

  return (
    <div
      className="leave-modal"
      onClick={(event) => event.target === event.currentTarget && onStay()}
    >
      <section
        ref={panelRef}
        className={cx('leave-modal__panel', isHost && 'leave-modal__panel--host')}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-modal-title"
        aria-describedby="leave-modal-text"
      >
        <button type="button" className="leave-modal__close" aria-label="Close" onClick={onStay}>
          <CloseIcon />
        </button>
        <div className="leave-modal__icon">
          <LeaveIcon />
        </div>
        <h2 className="leave-modal__title" id="leave-modal-title">
          Leave room?
        </h2>
        <p className="leave-modal__text" id="leave-modal-text">
          {text}
        </p>
        {note && <p className="leave-modal__note">{note}</p>}
        {error && (
          <p className="leave-modal__error" role="alert">
            {error}
          </p>
        )}
        <div className="leave-modal__actions">
          <BrandButton
            ref={stayRef}
            variant="ghost"
            className="leave-modal__button leave-modal__button--stay"
            onClick={onStay}
          >
            Stay in room
          </BrandButton>
          <BrandButton
            className="leave-modal__button leave-modal__button--leave"
            disabled={isLeaving}
            onClick={onLeave}
          >
            Leave room
          </BrandButton>
        </div>
      </section>
    </div>
  );
}
