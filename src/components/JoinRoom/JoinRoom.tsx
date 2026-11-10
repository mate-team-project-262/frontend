import { type FormEvent, useState } from 'react';
import { RoomApiError, joinRoom } from '../../api/roomsApi.ts';
import { cx } from '../../utils/classNames.ts';
import { extractRoomCode } from '../../utils/roomLinks.ts';
import { getNameFeedback, validateDisplayName } from '../../utils/validation.ts';
import BrandButton from '../BrandButton/BrandButton.tsx';
import BrandField from '../BrandField/BrandField.tsx';
import BrandHeader from '../BrandHeader/BrandHeader.tsx';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './JoinRoom.css';

const JOIN_FAILED_MESSAGE = 'We could not join this room. Check the link and try again.';
const BAD_LINK_MESSAGE = 'That does not look like a room link. Check it and try again.';
const MAX_INPUT_LENGTH = 60; // only a safety limit: a too long name must be typeable to show the error

interface Props {
  title: string;
  /** the room from the invite link; without it the form asks for a link */
  code?: string;
  onJoined: (joined: { code: string; name: string }) => void;
}

/**
 * Whole "join" screen. Without `code` it asks for a room link (page "Join a movie room");
 * with `code` the room is already known (page opened from an invite link or QR code).
 * `onJoined({ code, name })` is called after the backend let the guest in.
 *
 * The name is checked while typing; "Join room" stays disabled until the name is valid and
 * (when asked) the room link is a real link or code. The link error appears when the field
 * loses focus. Errors from the backend (name taken, room full ...) replace the hint.
 */
export default function JoinRoom({ title, code, onJoined }: Props) {
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [isLinkTouched, setIsLinkTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ link?: string; name?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomCode = code ?? extractRoomCode(link);
  const isNameValid = !validateDisplayName(name);
  const isValid = Boolean(roomCode) && isNameValid;

  const linkError =
    !code && isLinkTouched && link.trim() && !roomCode ? BAD_LINK_MESSAGE : serverErrors.link;
  const nameError = getNameFeedback(name) || serverErrors.name;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!roomCode || !isNameValid) return;

    setIsSubmitting(true);
    try {
      const joined = await joinRoom(roomCode, { name: name.trim() });
      onJoined({ code: joined.code, name: name.trim() });
    } catch (error) {
      const message = error instanceof RoomApiError ? error.message : JOIN_FAILED_MESSAGE;
      // Room problems belong under the room link (or under the name when there is no link field).
      const isRoomError = error instanceof RoomApiError && error.field === 'room';
      const field = isRoomError && !code ? 'link' : 'name';
      setServerErrors({ [field]: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearServerError = () => setServerErrors({});

  return (
    <div className="join-room-page cinema-page cinema-page--theatre landing">
      <BrandHeader />
      <main className="join-room">
        <section
          className={cx('join-room__panel', code && 'join-room__panel--invite')}
          aria-labelledby="join-room-title"
        >
          <h1 className="join-room__title" id="join-room-title">
            {title}
          </h1>
          <p className="join-room__subtitle">
            Join to swipe through the same 20 movies as your friends
          </p>

          <form className="join-room__form" onSubmit={handleSubmit} noValidate>
            <div className="join-room__fields">
              {!code && (
                <BrandField
                  label="Room link"
                  placeholder="Paste the invite link or the room code"
                  error={linkError}
                  success={Boolean(roomCode)}
                  maxLength={300}
                  value={link}
                  onBlur={() => setIsLinkTouched(true)}
                  onChange={(event) => {
                    setLink(event.target.value);
                    clearServerError();
                  }}
                />
              )}
              <BrandField
                label="Your name"
                placeholder="Enter your name"
                hint={code ? undefined : 'This is how other participants will see you.'}
                error={nameError}
                success={isNameValid}
                maxLength={MAX_INPUT_LENGTH}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearServerError();
                }}
              />
            </div>
            <BrandButton
              type="submit"
              className="join-room__submit"
              disabled={!isValid || isSubmitting}
            >
              Join room
            </BrandButton>
            <p className="join-room__note">No account needed to join</p>
          </form>
        </section>
      </main>
    </div>
  );
}
