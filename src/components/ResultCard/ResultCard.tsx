import type { ResultCard as ResultCardData } from '../../api/roomsApi.ts';
import { formatList, formatRating, formatRuntime } from '../../utils/movieFormat.ts';
import { StarIcon } from '../MovieCard/MovieCard.tsx';
import { ArrowRightIcon } from '../WinnerCard/WinnerCard.tsx';
import './ResultCard.css';

interface Props {
  card: ResultCardData;
  /** people in the room */
  total: number;
  onDetails: () => void;
}

/**
 * UI kit "highly-rated-movie-card": the poster sticks out of the top-left corner of a dark card;
 * "3 / 4 liked it", title, year • runtime, genres, rating and "Details".
 */
export default function ResultCard({ card, total, onDetails }: Props) {
  const rating = formatRating(card.rating);
  const meta = [card.year ? String(card.year) : null, formatRuntime(card.runtimeMin)].filter(
    Boolean,
  );

  return (
    <li className="result-card">
      <div className="result-card__poster">
        {card.posterUrl && <img src={card.posterUrl} alt="" loading="lazy" />}
      </div>
      <div className="result-card__body">
        <p className="result-card__likes">
          {card.likes} / {total} liked it
        </p>
        <h3 className="result-card__title">{card.title}</h3>
        {meta.length > 0 && <p className="result-card__meta">{meta.join(' • ')}</p>}
        {card.genres.length > 0 && <p className="result-card__genres">{formatList(card.genres)}</p>}
        {rating && (
          <p className="result-card__rating">
            <StarIcon size={18} />
            <span className="visually-hidden">Rating </span>
            {rating} / 10
          </p>
        )}
        <button type="button" className="result-card__details" onClick={onDetails}>
          Details
          <ArrowRightIcon />
          <span className="visually-hidden">: {card.title}</span>
        </button>
      </div>
    </li>
  );
}
