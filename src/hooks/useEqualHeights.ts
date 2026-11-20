import { type RefObject, useLayoutEffect } from 'react';

/**
 * Gives every `selector` element inside the container the height of the tallest one.
 *
 * Used for the titles of the winner cards: a one-line title next to a three-line one pushed the
 * details, the rating and the overview of the two cards to different heights. With equal titles
 * every row of the two cards lines up. Only where `query` matches (cards side by side).
 */
export function useEqualHeights(
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  query: string,
  /** re-measure when this changes (e.g. the list of cards) */
  key: unknown,
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof ResizeObserver === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const media = window.matchMedia(query);

    const equalize = () => {
      const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
      items.forEach((item) => item.style.removeProperty('min-height'));
      if (!media.matches || items.length < 2) return;
      const tallest = Math.max(...items.map((item) => item.getBoundingClientRect().height));
      items.forEach((item) => {
        item.style.minHeight = `${tallest}px`;
      });
    };

    equalize();
    // a narrower window or the web fonts arriving change how many lines a title takes
    const observer = new ResizeObserver(equalize);
    observer.observe(container);
    media.addEventListener('change', equalize);
    let isActive = true;
    void document.fonts?.ready.then(() => {
      if (isActive) equalize();
    });
    return () => {
      isActive = false;
      observer.disconnect();
      media.removeEventListener('change', equalize);
      container
        .querySelectorAll<HTMLElement>(selector)
        .forEach((item) => item.style.removeProperty('min-height'));
    };
  }, [containerRef, selector, query, key]);
}
