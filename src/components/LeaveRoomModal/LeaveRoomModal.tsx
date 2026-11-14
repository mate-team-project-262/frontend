import ConfirmModal from '../ConfirmModal/ConfirmModal.tsx';

/** Texts of the two variants (Figma: "leave room as PARTICIPANT" / "leave room as HOST"). */
function getTexts(isHost: boolean, isAlone: boolean) {
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

interface Props {
  isHost: boolean;
  /** the host is the only person in the room: leaving closes it */
  isAlone: boolean;
  isLeaving: boolean;
  error?: string;
  onStay: () => void;
  onLeave: () => void;
}

/**
 * "Leave room?" confirmation. `onStay` closes it (✕, Esc, a click outside, "Stay in room"),
 * `onLeave` leaves the room.
 */
export default function LeaveRoomModal({
  isHost,
  isAlone,
  isLeaving,
  error,
  onStay,
  onLeave,
}: Props) {
  const { text, note } = getTexts(isHost, isAlone);
  return (
    <ConfirmModal
      title="Leave room?"
      text={text}
      note={note}
      error={error}
      cancelLabel="Stay in room"
      confirmLabel="Leave room"
      isBusy={isLeaving}
      wide={isHost}
      onCancel={onStay}
      onConfirm={onLeave}
    />
  );
}
