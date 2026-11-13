import type { GenreShare } from '../../api/roomsApi.ts';
import { GENRE_COLORS, toSlices } from './slices.ts';
import './GenreDonut.css';

const RADIUS = 39.7;
const LENGTH = 2 * Math.PI * RADIUS;
const GAP = 2.7; // empty arc between two segments, in the circle's own units

interface Props {
  genres: GenreShare[];
  /** the number in the middle, e.g. liked movies */
  total: number;
  totalLabel: string;
  /** px */
  size?: number;
}

/**
 * Ring chart of the liked genres with a number in the middle. Decorative for assistive
 * technology: the same numbers are in the legend next to it.
 */
export default function GenreDonut({ genres, total, totalLabel, size = 218 }: Props) {
  const slices = toSlices(genres);
  const sum = slices.reduce((acc, slice) => acc + slice.percent, 0) || 1;
  // every slice with the arc it takes and where it starts on the circle
  const arcs = slices.map((slice, index) => ({
    name: slice.name,
    length: (slice.percent / sum) * LENGTH,
    start: (slices.slice(0, index).reduce((acc, item) => acc + item.percent, 0) / sum) * LENGTH,
  }));

  return (
    <div className="genre-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {/* as in the design: the biggest slice ends at about 2 o'clock, the rest go anticlockwise */}
        <g transform="rotate(-15 50 50) translate(0 100) scale(1 -1)">
          {arcs.map((arc, index) => (
            <circle
              key={arc.name}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={GENRE_COLORS[index]}
              strokeWidth="20.5"
              strokeDasharray={`${Math.max(arc.length - GAP, 0.5)} ${LENGTH}`}
              strokeDashoffset={-arc.start}
            />
          ))}
        </g>
      </svg>
      <p className="genre-donut__total">
        <strong>{total}</strong>
        {totalLabel}
      </p>
    </div>
  );
}
