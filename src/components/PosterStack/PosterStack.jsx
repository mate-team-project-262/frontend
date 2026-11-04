import { useEffect, useRef, useState } from 'react';
import animals from '../../assets/landing/poster-animals-hero.webp';
import buddy from '../../assets/landing/poster-buddy.webp';
import odyssey from '../../assets/landing/poster-odyssey.webp';
import oppenheimer from '../../assets/landing/poster-oppenheimer.webp';
import verity from '../../assets/landing/poster-verity.webp';
import './PosterStack.css';

// The posters were exported from the design: the last two are cut off on the right, where the
// cards run past the edge of the frame. zoom / focusX / focusY keep the subject centred in the
// card when such a poster comes to the front (focus = the subject's position in the image, 0-1).
const POSTERS = [
  { src: verity },
  { src: animals },
  { src: buddy },
  { src: odyssey, zoom: 1.15, focusX: 0.55 },
  { src: oppenheimer, zoom: 1.4, focusX: 0.58 },
];

function getImageFrame({ zoom = 1, focusX = 0.5, focusY = 0.5 }) {
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
 * behind it is a little more transparent and has a quieter frame.
 */
const SLOTS = [
  { x: 0, y: 0, w: 468, h: 638, radius: 40, opacity: 1, border: '#fff9ea' },
  { x: 113, y: -75, w: 418, h: 572, radius: 36, opacity: 0.96, border: '#9688a5' },
  { x: 196, y: -140, w: 370, h: 505, radius: 32, opacity: 0.92, border: '#9b95b8' },
  { x: 263, y: -198, w: 313, h: 470, radius: 28, opacity: 0.8, border: '#9b95b8' },
  { x: 316, y: -255, w: 260, h: 414, radius: 24, opacity: 0.78, border: '#7e75a2' },
];
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
  const [movingId, setMovingId] = useState(null);
  const [isBehind, setIsBehind] = useState(false);
  const orderRef = useRef(order);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timers = [];
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
    <div className="poster-stack" aria-hidden="true">
      {POSTERS.map((poster, posterId) => {
        const position = order.indexOf(posterId);
        const slot = SLOTS[position];
        const isMoving = posterId === movingId;
        // The travelling card stays on top until it has flown over the others, then goes behind.
        const zIndex = isMoving && !isBehind ? SLOTS.length + 1 : SLOTS.length - position;

        return (
          <div
            key={posterId}
            className="poster-stack__card"
            style={{
              width: slot.w,
              height: slot.h,
              borderRadius: slot.radius,
              borderColor: slot.border,
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
                opacity: slot.opacity,
                transitionDuration: `${SLIDE_MS}ms`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
