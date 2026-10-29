import { useRef, useState } from 'react';
import { cx } from '../../utils/classNames.js';
import './StepsCarousel.css';

const DRAG_START_PX = 6; // below this a press is a click, not a drag
const SWIPE_DISTANCE_PX = 70; // dragged further than this -> go to the next/previous step
const WHEEL_COOLDOWN_MS = 600;
const VISIBLE_BEFORE = 2;
const VISIBLE_AFTER = 3;

const mod = (value, length) => ((value % length) + length) % length;

/**
 * Looping carousel: the active step is shown large, the neighbours peek in from the sides.
 * Controls: swipe / mouse drag, arrow keys, horizontal wheel or trackpad, click on a neighbour.
 * `steps`: [{ number, title, text, image, scale, x, y, shade }] (photo framing, see HowItWorks). No autoplay.
 */
export default function StepsCarousel({ steps, label }) {
  const [index, setIndex] = useState(0); // grows and shrinks without limit, cards wrap around
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const press = useRef(null); // { startX, moved }
  const lastWheel = useRef(0);

  const go = (delta) => setIndex((current) => current + delta);
  const activeStep = mod(index, steps.length);

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Pointer capture redirects the click to the viewport, so remember which card was pressed.
    const pressedSlide = event.target.closest('[data-index]');
    press.current = {
      startX: event.clientX,
      moved: false,
      slideIndex: pressedSlide ? Number(pressedSlide.dataset.index) : null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
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

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  };

  const handleWheel = (event) => {
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
    <section
      className="steps-carousel"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <div
        className="steps-carousel__viewport"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
      >
        <div
          className={cx('steps-carousel__track', isDragging && 'steps-carousel__track--dragging')}
          style={{ '--index': index, '--drag': `${dragX}px` }}
        >
          {virtualIndexes.map((virtualIndex) => {
            const step = steps[mod(virtualIndex, steps.length)];
            const isActive = virtualIndex === index;
            return (
              <article
                key={virtualIndex}
                className={cx('step-card', isActive && 'step-card--active')}
                style={{
                  '--i': virtualIndex,
                  '--img-scale': step.scale,
                  '--img-x': step.x,
                  '--img-y': step.y,
                  '--shade': step.shade,
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`Step ${step.number} of ${steps.length}`}
                aria-hidden={!isActive}
                data-index={virtualIndex}
              >
                <img className="step-card__image" src={step.image} alt="" draggable={false} />
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

      {/* Controls for keyboard and screen-reader users; they appear on focus. */}
      <div className="steps-carousel__controls">
        <button type="button" className="steps-carousel__control" onClick={() => go(-1)}>
          Previous step
        </button>
        <button type="button" className="steps-carousel__control" onClick={() => go(1)}>
          Next step
        </button>
      </div>
      <p className="steps-carousel__status" aria-live="polite">
        Step {steps[activeStep].number} of {steps.length}: {steps[activeStep].title}
      </p>
    </section>
  );
}
