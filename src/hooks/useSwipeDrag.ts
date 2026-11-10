import { type PointerEvent, useRef, useState } from 'react';

const SWIPE_DISTANCE = 110; // px of dragging that count as a vote

/**
 * Dragging the card with the mouse or a finger. Past SWIPE_DISTANCE `onSwipe(true)` (right = like)
 * or `onSwipe(false)` is called, otherwise the card snaps back. Spread `handlers` on the card.
 */
export function useSwipeDrag({
  disabled,
  onSwipe,
}: {
  disabled: boolean;
  onSwipe: (liked: boolean) => void;
}) {
  const [drag, setDrag] = useState({ dx: 0, active: false });
  const start = useRef<{ x: number; id: number } | null>(null);

  const reset = () => setDrag({ dx: 0, active: false });

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (start.current?.id !== event.pointerId) return;
    start.current = null;
    if (Math.abs(drag.dx) >= SWIPE_DISTANCE) onSwipe(drag.dx > 0);
    else reset();
  };
  const handlers = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (disabled || event.button > 0 || (event.target as Element).closest('button')) return;
      start.current = { x: event.clientX, id: event.pointerId };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDrag({ dx: 0, active: true });
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (start.current?.id !== event.pointerId) return;
      setDrag({ dx: event.clientX - start.current.x, active: true });
    },
    onPointerUp,
    onPointerCancel: onPointerUp,
  };

  return { dx: drag.dx, isDragging: drag.active, handlers, reset };
}
