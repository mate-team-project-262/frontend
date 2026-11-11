import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
  useId,
  useRef,
  useState,
} from 'react';
import { cx } from '../../utils/classNames.ts';
import './StepsCarousel.css';

const DRAG_START_PX = 6; // below this a press is a click, not a drag
const SWIPE_DISTANCE_PX = 70; // dragged further than this -> go to the next/previous step
const WHEEL_COOLDOWN_MS = 600;
const VISIBLE_BEFORE = 2;
const VISIBLE_AFTER = 3;

const mod = (value: number, length: number) => ((value % length) + length) % length;

export interface Step {
  number: number;
  title: string;
  text: string;
  image: string;
  /** photo framing, see HowItWorks */
  scale: number;
  x: number;
  y: number;
  shade: number;
}

interface Press {
  startX: number;
  moved: boolean;
  slideIndex: number | null;
}

/** Round arrow button of the design: a lavender disc with the arrow cut out of it. */
function ArrowDisc({ direction }: { direction: 'left' | 'right' }) {
  const maskId = useId();
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <mask id={maskId}>
        <rect width="48" height="48" fill="#fff" />
        <path
          d={direction === 'left' ? 'M32 24H17.5M23.5 17l-7 7 7 7' : 'M16 24h14.5M24.5 17l7 7-7 7'}
          fill="none"
          stroke="#000"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
      <circle cx="24" cy="24" r="24" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/**
 * Looping carousel: the active step is shown large, the neighbours peek in from the sides.
 * Controls: the round arrows, swipe / mouse drag, arrow keys, horizontal wheel or trackpad,
 * click on a neighbour.
 * `steps`: [{ number, title, text, image, scale, x, y, shade }] (photo framing, see HowItWorks). No autoplay.
 */
export default function StepsCarousel({ steps, label }: { steps: Step[]; label: string }) {
  const [index, setIndex] = useState(0); // grows and shrinks without limit, cards wrap around
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const press = useRef<Press | null>(null);
  const lastWheel = useRef(0);

  const go = (delta: number) => setIndex((current) => current + delta);
  const activeStep = mod(index, steps.length);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Pointer capture redirects the click to the viewport, so remember which card was pressed.
    const pressedSlide = (event.target as Element).closest<HTMLElement>('[data-index]');
    press.current = {
      startX: event.clientX,
      moved: false,
      slideIndex: pressedSlide ? Number(pressedSlide.dataset.index) : null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = press.current;
    if (!current) return;
    const delta = event.clientX - current.startX;
    if (!current.moved && Math.abs(delta) > DRAG_START_PX) {
      current.moved = true;
      setIsDragging(true);
    }
    if (current.moved) setDragX(delta);
  };

  const handlePointerEnd = () => {
    const current = press.current;
    press.current = null;
    if (!current) return;
    if (!current.moved) {
      // A click on a neighbouring card brings it to the front.
      if (current.slideIndex !== null && current.slideIndex !== index) setIndex(current.slideIndex);
      return;
    }
    setIsDragging(false);
    if (Math.abs(dragX) > SWIPE_DISTANCE_PX) go(dragX < 0 ? 1 : -1);
    setDragX(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (Math.abs(event.deltaX) < 30 || Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
    if (now - lastWheel.current < WHEEL_COOLDOWN_MS) return;
    lastWheel.current = now;
    go(event.deltaX > 0 ? 1 : -1);
  };

  const virtualIndexes = Array.from(
    { length: VISIBLE_BEFORE + 1 + VISIBLE_AFTER },
    (_, offset) => index - VISIBLE_BEFORE + offset,
  );

  return (
    <section className="steps-carousel" aria-roledescription="carousel" aria-label={label}>
      <div
        className="steps-carousel__viewport"
        role="region"
        aria-label={`${label}: use the arrow keys to switch slides`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
      >
        <div
          className={cx('steps-carousel__track', isDragging && 'steps-carousel__track--dragging')}
          style={{ '--index': index, '--drag': `${dragX}px` } as CSSProperties}
        >
          {virtualIndexes.map((virtualIndex) => {
            const step = steps[mod(virtualIndex, steps.length)];
            const isActive = virtualIndex === index;
            return (
              <article
                key={virtualIndex}
                className={cx('step-card', isActive && 'step-card--active')}
                style={
                  {
                    '--i': virtualIndex,
                    '--img-scale': step.scale,
                    '--img-x': step.x,
                    '--img-y': step.y,
                    '--shade': step.shade,
                  } as CSSProperties
                }
                role="group"
                aria-roledescription="slide"
                aria-label={`Step ${step.number} of ${steps.length}`}
                aria-hidden={!isActive}
                data-index={virtualIndex}
              >
                <img
                  className="step-card__image"
                  src={step.image}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
                <div className="step-card__content">
                  <p className="step-card__number">{step.number}</p>
                  <h3 className="step-card__title">{step.title}</h3>
                  <p className="step-card__text">{step.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="steps-carousel__arrow steps-carousel__arrow--prev"
        aria-label="Previous step"
        onClick={() => go(-1)}
      >
        <ArrowDisc direction="left" />
      </button>
      <button
        type="button"
        className="steps-carousel__arrow steps-carousel__arrow--next"
        aria-label="Next step"
        onClick={() => go(1)}
      >
        <ArrowDisc direction="right" />
      </button>
      <p className="steps-carousel__status" aria-live="polite">
        Step {steps[activeStep].number} of {steps.length}: {steps[activeStep].title}
      </p>
    </section>
  );
}
