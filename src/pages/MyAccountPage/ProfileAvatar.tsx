import { useRef, useState } from 'react';
import { logEvent } from '../../analytics/productEvents.ts';
import {
  AVATAR_FILE_RULES,
  RoomApiError,
  type User,
  removeAvatar,
  uploadAvatar,
} from '../../api/roomsApi.ts';
import { useAccount } from '../../hooks/useAccount.ts';
import { AVATAR_TYPES, checkAvatarFile, shrinkAvatar } from '../../utils/avatarImage.ts';
import { getInitial } from '../../utils/sessionFormat.ts';

const FAILED = 'Could not save the photo. Please try again.';

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 5.2c0-.7.5-1.2 1.2-1.2h1.6l1-1.5h4.4l1 1.5h1.6c.7 0 1.2.5 1.2 1.2v6.6c0 .7-.5 1.2-1.2 1.2H3.2c-.7 0-1.2-.5-1.2-1.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8.3" r="2.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * The round avatar of My account: the photo or the first letter of the name.
 * A click on it (or "Add photo") opens the file picker; the photo is checked and shrunk in the
 * browser (utils/avatarImage.ts) and sent with PUT /me/avatar. "Remove photo" brings the letter back.
 */
export default function ProfileAvatar({ user }: { user: User }) {
  const { setUser } = useAccount();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  // a photo that does not load (deleted on the server, network) is shown as the letter
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const photo = user.avatarUrl && user.avatarUrl !== brokenUrl ? user.avatarUrl : null;

  const pick = () => {
    logEvent('profile_photo_upload_clicked');
    setError('');
    inputRef.current?.click();
  };

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setError('');
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof RoomApiError ? caught.message : FAILED);
    } finally {
      setIsBusy(false);
    }
  };

  const upload = (file: File) => {
    if (checkAvatarFile(file)) {
      setError(AVATAR_FILE_RULES);
      return;
    }
    void run(async () => {
      const { blob, name } = await shrinkAvatar(file);
      setUser(await uploadAvatar(blob, name));
    });
  };

  const remove = () =>
    run(async () => {
      await removeAvatar();
      setUser({ ...user, avatarUrl: null });
    });

  return (
    <div className="profile-avatar">
      <button
        type="button"
        className="profile-avatar__circle my-account__avatar"
        aria-label={photo ? 'Change profile photo' : 'Add profile photo'}
        aria-busy={isBusy}
        disabled={isBusy}
        onClick={pick}
      >
        {photo ? (
          // onError is not a user interaction: a photo that does not load turns into the letter
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
          <img
            className="profile-avatar__photo"
            src={photo}
            alt=""
            onError={() => setBrokenUrl(photo)}
          />
        ) : (
          <span aria-hidden="true">{getInitial(user.name)}</span>
        )}
        <span className="profile-avatar__badge" aria-hidden="true">
          <CameraIcon />
        </span>
      </button>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={AVATAR_TYPES.join(',')}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ''; // the same file can be picked again after an error
          if (file) upload(file);
        }}
      />
      <div className="profile-avatar__actions">
        <button type="button" className="profile-avatar__action" disabled={isBusy} onClick={pick}>
          {photo ? 'Change photo' : 'Add photo'}
        </button>
        {photo && (
          <button
            type="button"
            className="profile-avatar__action profile-avatar__action--remove"
            disabled={isBusy}
            onClick={remove}
          >
            Remove
          </button>
        )}
      </div>
      <p className="profile-avatar__status" role="status">
        {isBusy ? 'Saving the photo…' : ''}
      </p>
      {error && (
        <p className="profile-avatar__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
