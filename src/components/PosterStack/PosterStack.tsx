import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.ts';
import housemaid from '../../assets/landing/hero-housemaid.webp';
import hungerGames from '../../assets/landing/hero-hunger-games.webp';
import odyssey from '../../assets/landing/hero-odyssey.webp';
import spiderMan from '../../assets/landing/hero-spider-man.webp';
import verity from '../../assets/landing/hero-verity.webp';
import wicker from '../../assets/landing/hero-wicker.webp';
import './PosterStack.css';

interface Poster {
  src: string;
  zoom?: number;
  focusX?: number;
  focusY?: number;
}

// Original posters from the designer (2:3, no effects): the front card shows the poster as it
// is, the dimming of the cards behind it is done here (SLOTS). There are more posters than
// places in the stack: the extra ones wait, invisible, behind the last card.
// zoom / focusX / focusY frame a poster inside its card (focus = the point of the image kept in
// the middle, 0-1); Verity is framed as in the Figma frame.
const POSTERS: Poster[] = [
  { src: verity, zoom: 1.12, focusX: 0.493, focusY: 0.507 },
  { src: housemaid },
  { src: hungerGames },
  { src: odyssey },
  { src: spiderMan },
  { src: wicker },
];

function getImageFrame({ zoom = 1, focusX = 0.5, focusY = 0.5 }: Poster) {
  return {
    width: `${zoom * 100}%`,
    height: `${zoom * 100}%`,
    left: `${50 - focusX * zoom * 100}%`,
    top: `${50 - focusY * zoom * 100}%`,
  };
}

/**
 * Card boxes from the Figma frame, relative to the front card's top-left corner, plus how the
 * "hierarchy" looks: only the front card has the cream frame and full brightness; every card
 * behind it is a little more transparent and darker (`dim` = brightness) and has a quieter frame.
 */
const SLOTS = [
  { x: 0, y: 0, w: 468, h: 638, radius: 40, opacity: 1, dim: 1, border: '#fff9ea' },
  { x: 113, y: -75, w: 418, h: 572, radius: 36, opacity: 0.96, dim: 0.82, border: '#9688a5' },
  { x: 196, y: -140, w: 370, h: 505, radius: 32, opacity: 0.92, dim: 0.72, border: '#9b95b8' },
  { x: 263, y: -198, w: 313, h: 470, radius: 28, opacity: 0.8, dim: 0.62, border: '#9b95b8' },
  { x: 316, y: -255, w: 260, h: 414, radius: 24, opacity: 0.78, dim: 0.55, border: '#7e75a2' },
];
/**
 * Mobile mockup (390px): a 260 x 354 front card and two cards peeking out above it, centred.
 * The other posters wait behind the last one.
 */
const MOBILE_SLOTS: typeof SLOTS = [
  { x: 0, y: 0, w: 260, h: 354, radius: 28, opacity: 1, dim: 1, border: '#fff9ea' },
  { x: 14, y: -28, w: 232, h: 316, radius: 24, opacity: 0.96, dim: 0.78, border: '#9688a5' },
  { x: 28, y: -55, w: 204, h: 278, radius: 22, opacity: 0.9, dim: 0.62, border: '#9b95b8' },
];
const MOBILE_QUERY = '(max-width: 600px)';
const FRONT_SHADOW = '0 24px 48px rgba(0, 0, 0, 0.45)';

const SHUFFLE_EVERY_MS = 5200;
const MOVE_MS = 1100; // the old front card travels to the back of the stack
const SLIDE_MS = 900; // the other cards come forward
const STAGGER_MS = 45; // each card starts a little after the one in front of it
const TUCK_AFTER_MS = 480; // the travelling card passes behind the others at this moment

/**
 * Decorative stack of movie posters. Every few seconds the front poster flies up and tucks in
 * behind the others while the rest come forward. Disabled for users who prefer reduced motion.
 */
export default function PosterStack() {
  const [order, setOrder] = useState(() => POSTERS.map((_, index) => index)); // front card first
  const [movingId, setMovingId] = useState<number | null>(null);
  const [isBehind, setIsBehind] = useState(false);
  const orderRef = useRef(order);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const slots = isMobile ? MOBILE_SLOTS : SLOTS;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const shuffle = () => {
      if (document.hidden) return;
      const [front, ...rest] = orderRef.current;
      orderRef.current = [...rest, front];
      setOrder(orderRef.current);
      setMovingId(front);
      setIsBehind(false);
      timers.push(setTimeout(() => setIsBehind(true), TUCK_AFTER_MS));
      timers.push(setTimeout(() => setMovingId(null), MOVE_MS + 100));
    };

    const interval = setInterval(shuffle, SHUFFLE_EVERY_MS);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="poster-stack"
      aria-hidden="true"
      style={{ width: slots[0].w, height: slots[0].h }}
    >
      {POSTERS.map((poster, posterId) => {
        const position = order.indexOf(posterId);
        // posters beyond the last place wait behind it, invisible
        const isWaiting = position >= slots.length;
        const slot = slots[Math.min(position, slots.length - 1)];
        const isMoving = posterId === movingId;
        // The travelling card stays on top until it has flown over the others, then goes behind.
        const zIndex = isMoving && !isBehind ? POSTERS.length + 1 : POSTERS.length - position;

        return (
          <div
            key={posterId}
            className="poster-stack__card"
            style={{
              width: slot.w,
              height: slot.h,
              borderRadius: slot.radius,
              borderColor: isWaiting ? 'transparent' : slot.border,
              boxShadow: position === 0 ? FRONT_SHADOW : 'none',
              transform: `translate(${slot.x}px, ${slot.y}px)`,
              transitionDuration: `${isMoving ? MOVE_MS : SLIDE_MS}ms`,
              transitionDelay: `${isMoving ? 0 : position * STAGGER_MS}ms`,
              zIndex,
            }}
          >
            <img
              className="poster-stack__image"
              src={poster.src}
              alt=""
              draggable={false}
              style={{
                ...getImageFrame(poster),
                opacity: isWaiting ? 0 : slot.opacity,
                filter: `brightness(${slot.dim})`,
                transitionDuration: `${SLIDE_MS}ms`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
