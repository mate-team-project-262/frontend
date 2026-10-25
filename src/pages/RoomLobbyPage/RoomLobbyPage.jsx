import { useState } from 'react';
import { RoomApiError, startSession } from '../../api/roomsApi.js';
import Button from '../../components/Button/Button.jsx';
import Header from '../../components/Header/Header.jsx';
import Participant from '../../components/Participant/Participant.jsx';
import QrCode from '../../components/QrCode/QrCode.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import { onSessionStarted } from '../../handlers.js';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';
import { getInviteLink, getTelegramShareUrl } from '../../utils/roomLinks.js';
import './RoomLobbyPage.css';

/** A session needs the host and at least one friend. */
const MIN_PARTICIPANTS_TO_START = 2;

const COPY_BUTTON_LABELS = { idle: 'Copy link', copied: 'Copied!', failed: 'Copy failed' };

/** Host view of a room in the lobby. `room` comes from RoomPage. */
export default function RoomLobbyPage({ code, room }) {
  const { status: copyStatus, copy } = useCopyToClipboard();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const inviteLink = getInviteLink(code);
  const participants = room.participants;
  const canStart = participants.length >= MIN_PARTICIPANTS_TO_START;

  const handleStartSession = async () => {
    setIsStarting(true);
    setStartError('');
    try {
      await startSession(code);
      onSessionStarted(room);
    } catch (error) {
      setStartError(
        error instanceof RoomApiError
          ? error.message
          : 'Could not start the session. Please try again.',
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="room-lobby-page">
      <Header variant="back" />
      <main className="container room-lobby">
        <h1 className="room-lobby__title">Movie room</h1>
        <p className="room-lobby__subtitle">Invite at least one friend to start a session.</p>

        <div className="room-lobby__top">
          <section className="room-lobby__share">
            <TextField
              label="Share this link"
              variant="compact"
              readOnly
              maxLength={200}
              value={inviteLink}
              onFocus={(event) => event.target.select()}
            />
            <div className="room-lobby__actions">
              <Button
                variant="ghost"
                className="room-lobby__action"
                aria-live="polite"
                onClick={() => copy(inviteLink)}
              >
                {COPY_BUTTON_LABELS[copyStatus]}
              </Button>
              <Button
                as="a"
                className="room-lobby__action"
                href={getTelegramShareUrl(inviteLink)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on Telegram
              </Button>
            </div>
          </section>

          <section className="room-lobby__qr">
            <div className="room-lobby__qr-label">or scan QR</div>
            <QrCode value={inviteLink} />
          </section>
        </div>

        <section className="room-lobby__people">
          <h2 className="room-lobby__label">People in room ({participants.length})</h2>
          <ul className="room-lobby__list">
            {participants.map((person) => (
              <Participant
                key={person.id}
                name={person.name}
                isMe={person.isMe}
                isHost={person.isHost}
              />
            ))}
          </ul>
          <Button
            block
            className="room-lobby__start"
            disabled={!canStart || isStarting}
            onClick={handleStartSession}
          >
            Start session
          </Button>
          {startError && (
            <p className="room-lobby__error" role="alert">
              {startError}
            </p>
          )}
          <p className="room-lobby__hint">Host starts when everyone has joined</p>
        </section>
      </main>
    </div>
  );
}
