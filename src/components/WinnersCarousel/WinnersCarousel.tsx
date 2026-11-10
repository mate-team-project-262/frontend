import { useEffect, useRef } from 'react';
import type { ResultCard } from '../../api/roomsApi.ts';
import { cx } from '../../utils/classNames.ts';
import WinnerCard from '../WinnerCard/WinnerCard.tsx';
import './WinnersCarousel.css';

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={
          direction === 'left' ? 'M16 9H2.5M8 3.5 2.5 9 8 14.5' : 'M2 9h13.5M10 3.5 15.5 9 10 14.5'
        }
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  winners: ResultCard[];
  /** people in the room */
  total: number;
  /** the card the spinning roulette is on right now */
  highlightedId: number | null;
  onDetails: (card: ResultCard) => void;
}

/** Winners side by side; with more than two they scroll like a carousel (arrows, swipe, keys). */
export default function WinnersCarousel({ winners, total, highlightedId, onDetails }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const isCarousel = winners.length > 2;

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const step = track.firstElementChild?.getBoundingClientRect().width ?? track.clientWidth / 2;
    track.scrollBy({
      left: direction * (step + 40),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  // keep the spinning roulette's card in view
  useEffect(() => {
    if (!isCarousel || highlightedId === null) return;
    trackRef.current
      ?.querySelector(`[data-id="${highlightedId}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [highlightedId, isCarousel]);

  return (
    <div className={cx('results-winners', isCarousel && 'results-winners--carousel')}>
      {isCarousel && (
        <button
          type="button"
          className="results-winners__arrow results-winners__arrow--prev"
          aria-label="Previous winners"
          onClick={() => scrollBy(-1)}
        >
          <ChevronIcon direction="left" />
        </button>
      )}
      <ul
        className="results-winners__track"
        ref={trackRef}
        // a scrolling list must be reachable from the keyboard
        tabIndex={isCarousel ? 0 : undefined}
        aria-label={isCarousel ? 'Winners, scroll for more' : undefined}
      >
        {winners.map((card) => (
          <li key={card.id} data-id={card.id} className="results-winners__item">
            <WinnerCard
              card={card}
              total={total}
              variant={winners.length === 1 ? 'single' : 'pair'}
              highlighted={highlightedId === card.id}
              onDetails={() => onDetails(card)}
            />
          </li>
        ))}
      </ul>
      {isCarousel && (
        <button
          type="button"
          className="results-winners__arrow results-winners__arrow--next"
          aria-label="Next winners"
          onClick={() => scrollBy(1)}
        >
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}
