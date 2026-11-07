import { useEffect, useRef } from 'react';
import {
  formatLanguage,
  formatMoney,
  formatRating,
  getMetaParts,
} from '../../utils/movieFormat.js';
import { StarIcon } from '../MovieCard/MovieCard.jsx';
import './MovieDetails.css';

const MAX_CAST = 4;

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Rows of the facts table; rows without data are left out (e.g. no budget for TV shows). */
function getFacts(card) {
  const people = card.director
    ? ['Director', card.director]
    : ['Created by', card.creators.join(', ')];
  return [
    people,
    ['Cast', card.cast.slice(0, MAX_CAST).join(', ')],
    ['Age rating', card.ageRating],
    ['Budget', formatMoney(card.budget)],
    ['Revenue', formatMoney(card.revenue)],
    ['Original Language', formatLanguage(card.language)],
  ].filter(([, value]) => value);
}

/**
 * UI kit "More-details-modal": the whole movie card in a dialog over the page.
 * Esc and "Close details" close it; focus goes to the close button when it opens.
 */
export default function MovieDetails({ card, onClose }) {
  const closeRef = useRef(null);
  const rating = formatRating(card.rating);
  const facts = getFacts(card);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="movie-details" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section
        className="movie-details__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-details-title"
      >
        <div className="movie-details__top">
          <div className="movie-details__poster">
            {card.posterUrl && <img src={card.posterUrl} alt="" />}
          </div>
          <div className="movie-details__about">
            <h2 className="movie-details__title" id="movie-details-title">
              {card.title}
            </h2>
            <p className="movie-details__meta">{getMetaParts(card).join('\u2002•\u2002')}</p>
            {rating && (
              <p className="movie-details__rating">
                <StarIcon size={20} />
                <span className="visually-hidden">Rating </span>
                {rating} / 10
              </p>
            )}
            {card.overview && <p className="movie-details__overview">{card.overview}</p>}
          </div>
        </div>

        {facts.length > 0 && (
          <dl className="movie-details__facts">
            {facts.map(([label, value]) => (
              <div key={label} className="movie-details__fact">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <button ref={closeRef} type="button" className="movie-details__close" onClick={onClose}>
          <CloseIcon />
          Close details
        </button>
      </section>
    </div>
  );
}
