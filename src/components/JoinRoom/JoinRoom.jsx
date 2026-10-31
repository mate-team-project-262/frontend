import { useState } from 'react';
import { RoomApiError, joinRoom } from '../../api/roomsApi.js';
import { cx } from '../../utils/classNames.js';
import { extractRoomCode } from '../../utils/roomLinks.js';
import { DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../../utils/validation.js';
import BrandButton from '../BrandButton/BrandButton.jsx';
import BrandField from '../BrandField/BrandField.jsx';
import BrandHeader from '../BrandHeader/BrandHeader.jsx';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './JoinRoom.css';

const JOIN_FAILED_MESSAGE = 'We could not join this room. Check the link and try again.';

/**
 * Whole "join" screen. Without `code` it asks for a room link (page "Join a movie room");
 * with `code` the room is already known (page opened from an invite link or QR code).
 * `onJoined({ code, name })` is called after the backend let the guest in.
 */
export default function JoinRoom({ title, code, onJoined }) {
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The button is disabled until all visible fields are filled (the room link only when it is asked).
  const isFilled = (code || link.trim() !== '') && name.trim() !== '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const guestName = name.trim();
    const roomCode = code ?? extractRoomCode(link);

    const nextErrors = {};
    if (!code && !link.trim()) nextErrors.link = 'Paste the room link or code';
    else if (!roomCode)
      nextErrors.link = 'That does not look like a room link. Check it and try again.';
    const nameError = validateDisplayName(guestName);
    if (nameError) nextErrors.name = nameError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const joined = await joinRoom(roomCode, { name: guestName });
      onJoined({ code: joined.code, name: guestName });
    } catch (error) {
      const message = error instanceof RoomApiError ? error.message : JOIN_FAILED_MESSAGE;
      // Room problems belong under the room link (or under the name when there is no link field).
      const field = error.field === 'room' && !code ? 'link' : 'name';
      setErrors({ [field]: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

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
                  tone="raised"
                  label="Room link"
                  placeholder="Paste the invite link or the room code"
                  error={errors.link}
                  maxLength={300}
                  value={link}
                  onChange={(event) => {
                    setLink(event.target.value);
                    clearError('link');
                  }}
                />
              )}
              <BrandField
                tone={code ? undefined : 'raised'}
                label="Your name"
                placeholder="Enter your name"
                hint={code ? undefined : 'This is how other participants will see you.'}
                error={errors.name}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearError('name');
                }}
              />
            </div>
            <BrandButton
              type="submit"
              className="join-room__submit"
              disabled={!isFilled || isSubmitting}
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
