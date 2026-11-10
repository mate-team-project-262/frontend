import type { ResultCard } from '../../api/roomsApi.ts';
import { cx } from '../../utils/classNames.ts';
import { formatRating, getMetaParts } from '../../utils/movieFormat.ts';
import BrandButton from '../BrandButton/BrandButton.tsx';
import { StarIcon } from '../MovieCard/MovieCard.tsx';
import './WinnerCard.css';

export function CrownIcon() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
      <path d="M1 4.5 6.3 9 11 1l4.7 8L21 4.5 19 15H3Z" fill="#eacf00" />
      <rect x="3" y="15.8" width="16" height="2.2" rx="1" fill="#eacf00" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 9h13.5M10 3.5 15.5 9 10 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  card: ResultCard;
  /** people in the room */
  total: number;
  variant?: 'pair' | 'single' | 'chosen';
  highlighted?: boolean;
  onDetails: () => void;
}

/**
 * UI kit "winner-movie-card": 266 x 400 poster, "4 / 4 liked it" with a crown, title, meta, rating,
 * overview and "View details". variant: 'pair' (two side by side, outlined button), 'single'
 * (one winner, filled button) or 'chosen' (the roulette pick, glowing poster).
 * `highlighted` lights the card up while the roulette is spinning.
 */
export default function WinnerCard({
  card,
  total,
  variant = 'pair',
  highlighted = false,
  onDetails,
}: Props) {
  const rating = formatRating(card.rating);

  return (
    <article
      className={cx(
        'winner-card',
        `winner-card--${variant}`,
        highlighted && 'winner-card--highlighted',
      )}
      aria-label={card.title}
    >
      <div className="winner-card__poster">
        {card.posterUrl && <img src={card.posterUrl} alt="" />}
      </div>
      <div className="winner-card__info">
        <p className="winner-card__likes">
          <CrownIcon />
          {card.likes} / {total} liked it
        </p>
        <h3 className="winner-card__title">{card.title}</h3>
        <p className="winner-card__meta">{getMetaParts(card).join(' • ')}</p>
        {rating && (
          <p className="winner-card__rating">
            <StarIcon size={20} />
            <span className="visually-hidden">Rating </span>
            {rating} / 10
          </p>
        )}
        {card.overview && <p className="winner-card__overview">{card.overview}</p>}
        <BrandButton
          variant={variant === 'single' ? 'primary' : 'ghost'}
          className="winner-card__button"
          onClick={onDetails}
        >
          View details
          <ArrowRightIcon />
        </BrandButton>
      </div>
    </article>
  );
}
