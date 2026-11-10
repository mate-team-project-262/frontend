import type { ComponentPropsWithoutRef } from 'react';
import type { MovieCard as MovieCardData } from '../../api/roomsApi.ts';
import { cx } from '../../utils/classNames.ts';
import { formatList, formatRating, formatRuntime } from '../../utils/movieFormat.ts';
import './MovieCard.css';

export function StarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="m8 .9 2.1 4.6 5 .5-3.8 3.4 1.1 5L8 11.8l-4.4 2.6 1.1-5L.9 6l5-.5Z" fill="#eacf00" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2 10h15.5M11.5 4l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props extends ComponentPropsWithoutRef<'article'> {
  card: MovieCardData;
  onMoreDetails: () => void;
}

/**
 * UI kit "movie-card": poster, title, "year • runtime • genres • ★ rating", two lines of the
 * overview and "More details". Extra props (style, pointer handlers) go to the card element,
 * so the swipe page can drag it.
 */
export default function MovieCard({ card, onMoreDetails, className, ...props }: Props) {
  const rating = formatRating(card.rating);
  const parts = [
    { key: 'year', text: card.year ? String(card.year) : null },
    { key: 'runtime', text: formatRuntime(card.runtimeMin) },
    { key: 'genres', text: formatList(card.genres) },
  ].filter((part) => part.text);

  return (
    <article className={cx('movie-card', className)} aria-label={card.title} {...props}>
      <div className="movie-card__poster">
        {card.posterUrl && <img src={card.posterUrl} alt="" draggable={false} />}
      </div>
      <h2 className="movie-card__title">{card.title}</h2>
      <p className="movie-card__meta">
        {parts.map((part) => (
          <span
            key={part.key}
            className={`movie-card__meta-item movie-card__meta-item--${part.key}`}
          >
            {part.text}
          </span>
        ))}
        {rating && (
          <span className="movie-card__meta-item movie-card__meta-item--rating">
            <StarIcon size={15} />
            <span className="visually-hidden">Rating </span>
            {rating}
          </span>
        )}
      </p>
      {card.overview && <p className="movie-card__overview">{card.overview}</p>}
      <button type="button" className="movie-card__more" onClick={onMoreDetails}>
        <ArrowRight />
        More details
      </button>
    </article>
  );
}
