import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, leaveRoom, startSession } from '../../api/roomsApi.js';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import BrandField from '../../components/BrandField/BrandField.jsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import BrandParticipant from '../../components/BrandParticipant/BrandParticipant.jsx';
import BrandQrCode from '../../components/BrandQrCode/BrandQrCode.jsx';
import { onSessionStarted } from '../../handlers.js';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';
import { ROUTES } from '../../routes.js';
import { getInviteLink, getTelegramShareUrl } from '../../utils/roomLinks.js';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './RoomLobbyPage.css';

/** A session needs the host and at least one friend. */
const MIN_PARTICIPANTS_TO_START = 2;

const COPY_BUTTON_LABELS = { idle: 'Copy link', copied: 'Copied!', failed: 'Copy failed' };

function TelegramIcon() {
  return (
    <svg width="18" height="15" viewBox="0 0 18 15" fill="none" aria-hidden="true">
      <path
        d="M17.6.4a.8.8 0 0 0-.8-.1L.6 6.6a.8.8 0 0 0 .1 1.5l3.9 1.3 1.5 4.6a.8.8 0 0 0 1.3.3l2.2-2.1 3.7 2.8a.8.8 0 0 0 1.3-.5L17.9 1.2a.8.8 0 0 0-.3-.8ZM14.3 3.5l-7.4 6.6a.8.8 0 0 0-.2.4l-.3 2-.9-2.8 8.8-6.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Host view of a room in the lobby. `room` comes from RoomPage. */
export default function RoomLobbyPage({ code, room }) {
  const navigate = useNavigate();
  const { status: copyStatus, copy } = useCopyToClipboard();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const inviteLink = getInviteLink(code);
  const participants = room.participants;
  const isFull = participants.length >= (room.maxParticipants ?? Infinity);
  const canStart = participants.length >= MIN_PARTICIPANTS_TO_START;

  /** "Back" really leaves the room (for now only on this device, the backend has no endpoint). */
  const handleLeave = async () => {
    try {
      await leaveRoom(code);
    } catch {
      // Even if the request fails the host wants to leave this page.
    }
    navigate(ROUTES.home);
  };

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
    <div className="room-lobby-page cinema-page cinema-page--crowd landing">
      <BrandHeader onBack={handleLeave} />
      <main className="room-lobby">
        <section className="room-lobby__panel" aria-labelledby="room-lobby-title">
          <h1 className="room-lobby__title" id="room-lobby-title">
            Get everyone together
          </h1>
          <p className="room-lobby__subtitle">Invite at least one friend to start a session</p>

          <div className="room-lobby__top">
            <div className="room-lobby__share">
              <BrandField
                size="lg"
                label="Share this link"
                readOnly
                value={inviteLink}
                onFocus={(event) => event.target.select()}
              />
              <div className="room-lobby__actions">
                <BrandButton
                  variant="ghost"
                  className="room-lobby__action room-lobby__action--copy"
                  aria-live="polite"
                  onClick={() => copy(inviteLink)}
                >
                  {COPY_BUTTON_LABELS[copyStatus]}
                </BrandButton>
                <BrandButton
                  as="a"
                  className="room-lobby__action room-lobby__action--telegram"
                  href={getTelegramShareUrl(inviteLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TelegramIcon />
                  Share on Telegram
                </BrandButton>
              </div>
            </div>

            <div className="room-lobby__divider" aria-hidden="true" />

            <div className="room-lobby__qr">
              <div className="room-lobby__label">or scan QR</div>
              <BrandQrCode value={inviteLink} />
              <p className="room-lobby__caption">Scan to join the room</p>
            </div>
          </div>

          <div className="room-lobby__people">
            <h2 className="room-lobby__label">People in room ({participants.length})</h2>
            <ul className="room-lobby__list">
              {participants.map((person, index) => (
                <BrandParticipant
                  key={person.id}
                  name={person.name}
                  index={index}
                  isMe={person.isMe}
                  isHost={person.isHost}
                />
              ))}
            </ul>
          </div>

          <BrandButton
            className="room-lobby__start"
            disabled={!canStart || isStarting}
            onClick={handleStartSession}
          >
            Start session
          </BrandButton>
          {startError && (
            <p className="room-lobby__error" role="alert">
              {startError}
            </p>
          )}
          <p className="room-lobby__hint">
            {isFull ? 'The room is full' : 'Start when everyone’s here'}
          </p>
        </section>
      </main>
    </div>
  );
}