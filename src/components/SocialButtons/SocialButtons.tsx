import { useState } from 'react';
import './SocialButtons.css';

// The providers' official marks are assets from the designer (see assets/social/README.md):
// every svg in that folder is picked up by its file name, so adding one needs no code change.
const ICONS = import.meta.glob<string>('../../assets/social/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});
const iconOf = (id: string): string | undefined => ICONS[`../../assets/social/${id}.svg`];

interface Provider {
  id: 'google' | 'facebook';
  label: string;
}

const PROVIDERS: Provider[] = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
];

/**
 * "or continue with" + the Google and Facebook buttons of the account cards. They look as in the
 * mockup, but the backend has no social login yet: without `onSelect` a press only shows
 * "coming soon" under the buttons. Pass `onSelect` once the backend supports it.
 */
export default function SocialButtons({ onSelect }: { onSelect?: (id: Provider['id']) => void }) {
  const [notice, setNotice] = useState('');

  return (
    <div className="social-buttons">
      <p className="social-buttons__divider">
        <span>or continue with</span>
      </p>
      <div className="social-buttons__row">
        {PROVIDERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="social-buttons__button"
            onClick={() => {
              if (onSelect) onSelect(id);
              else
                setNotice(
                  `Sign in with ${label} is coming soon. Please use your name and password.`,
                );
            }}
          >
            {iconOf(id) && <img src={iconOf(id)} width="24" height="24" alt="" />}
            {label}
          </button>
        ))}
      </div>
      <p className="social-buttons__notice" role="status">
        {notice}
      </p>
    </div>
  );
}
