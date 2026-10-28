import { useState } from 'react';
import { RoomApiError, joinRoom } from '../../api/roomsApi.js';
import { extractRoomCode } from '../../utils/roomLinks.js';
import { DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../../utils/validation.js';
import Button from '../Button/Button.jsx';
import Header from '../Header/Header.jsx';
import TextField from '../TextField/TextField.jsx';
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
    <div className="join-room-page">
      <Header variant="back" />
      <main className="join-room">
        <h1 className="join-room__title">{title}</h1>
        <p className="join-room__subtitle">
          Join to swipe through the same 20 movies as your friends
        </p>

        <form className="join-room__form" onSubmit={handleSubmit} noValidate>
          <div className="join-room__fields">
            {!code && (
              <TextField
                label="Room link"
                hint="You can paste the full invite link from Telegram, Messenger or any other chat."
                error={errors.link}
                maxLength={300}
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                  clearError('link');
                }}
              />
            )}
            <TextField
              label="Your name"
              error={errors.name}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearError('name');
              }}
            />
          </div>
          <Button type="submit" className="join-room__submit" disabled={isSubmitting}>
            Join room
          </Button>
        </form>
      </main>
    </div>
  );
}
