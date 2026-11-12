import type { ReactNode } from 'react';
import './SocialButtons.css';

interface Provider {
  id: 'google' | 'facebook';
  label: string;
  /** the provider's official mark (an asset from the designer); the button works without it */
  icon?: ReactNode;
}

const PROVIDERS: Provider[] = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
];

/**
 * "or continue with" + the Google and Facebook buttons of the account cards. The backend has no
 * social login yet, so the buttons are disabled; pass `onSelect` once it does.
 */
export default function SocialButtons({ onSelect }: { onSelect?: (id: Provider['id']) => void }) {
  return (
    <div className="social-buttons">
      <p className="social-buttons__divider">
        <span>or continue with</span>
      </p>
      <div className="social-buttons__row">
        {PROVIDERS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className="social-buttons__button"
            disabled={!onSelect}
            title={onSelect ? undefined : 'Coming soon'}
            onClick={() => onSelect?.(id)}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
