import type { GenreShare } from '../../api/roomsApi.ts';
import { GENRE_COLORS, toSlices } from './slices.ts';
import './GenreDonut.css';

const RADIUS = 39.7; // the middle line of the ring, in the 100 x 100 view box
const THICKNESS = 20.5;
const LENGTH = 2 * Math.PI * RADIUS;
const GAP = 2.7; // empty arc between two segments, measured on the middle line
const CORNER = 2.2; // corner radius of a segment (the design rounds them)

const point = (radius: number, angle: number) =>
  `${(50 + radius * Math.cos(angle)).toFixed(3)} ${(50 + radius * Math.sin(angle)).toFixed(3)}`;

/**
 * One segment of the ring from `start` to `end` (radians) with rounded corners: the shape is drawn
 * `corner` smaller on every side and then outlined with a round-joined stroke `2 * corner` wide,
 * which brings it back to full size with round corners.
 */
function segmentPath(start: number, end: number, corner: number): string {
  const outer = RADIUS + THICKNESS / 2 - corner;
  const inner = RADIUS - THICKNESS / 2 + corner;
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${point(outer, start + corner / outer)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(outer, end - corner / outer)}`,
    `L ${point(inner, end - corner / inner)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(inner, start + corner / inner)}`,
    'Z',
  ].join(' ');
}

interface Props {
  genres: GenreShare[];
  /** the number in the middle, e.g. liked movies */
  total: number;
  totalLabel: string;
  /** px */
  size?: number;
  /** grey-lilac ring without numbers, for "No data yet" (then `genres` is not used) */
  isPlaceholder?: boolean;
}

/** The shape of the "No data yet" ring: eight pieces of one colour. */
const PLACEHOLDER = [21, 9, 9, 11, 13, 14, 10, 13].map((percent, index) => ({
  name: `placeholder-${index}`,
  percent,
}));
const PLACEHOLDER_COLOR = '#e0d4ff';

/**
 * Ring chart of the liked genres with a number in the middle. Decorative for assistive
 * technology: the same numbers are in the legend next to it.
 */
export default function GenreDonut({
  genres,
  total,
  totalLabel,
  size = 218,
  isPlaceholder = false,
}: Props) {
  const slices = isPlaceholder ? PLACEHOLDER : toSlices(genres);
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
          {arcs.map((arc, index) => {
            const color = isPlaceholder ? PLACEHOLDER_COLOR : GENRE_COLORS[index];
            const visible = Math.max(arc.length - GAP, 0.5);
            // a very thin slice gets no rounding: there is no room for the corners
            const corner = visible > 4 * CORNER ? CORNER : 0;
            return (
              <path
                key={arc.name}
                d={segmentPath(arc.start / RADIUS, (arc.start + visible) / RADIUS, corner)}
                fill={color}
                stroke={color}
                strokeWidth={corner * 2}
                strokeLinejoin="round"
              />
            );
          })}
        </g>
      </svg>
      <p className="genre-donut__total">
        {!isPlaceholder && <strong>{total}</strong>}
        {totalLabel}
      </p>
    </div>
  );
}
