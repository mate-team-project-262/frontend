import { useLayoutEffect, useRef } from 'react';

/**
 * A text that takes whatever room is left in a fixed-height column and ends with "…".
 *
 * Used for the overview of a winner card: the column is as tall as the poster and the button sits
 * at its bottom, so a short title leaves more lines for the overview and a long one fewer. The
 * text gets as many whole lines as fit between its top and the next element (the button).
 * At least `minLines` are always shown: then the column grows below the poster instead (the CSS
 * gives it a min-height, not a height).
 * Where `query` does not match (phones: everything is stacked), the CSS limit stays.
 */
export function useFitLines<T extends HTMLElement>(query: string, minLines = 0) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const text = ref.current;
    const column = text?.parentElement;
    const below = text?.nextElementSibling;
    if (!text || !column || !below) return undefined;
    if (typeof ResizeObserver === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const media = window.matchMedia(query);

    const reset = () => {
      text.style.removeProperty('height');
      text.style.removeProperty('-webkit-line-clamp');
      text.style.removeProperty('line-clamp');
    };

    const fit = () => {
      if (!media.matches) {
        reset();
        return;
      }
      const style = getComputedStyle(text);
      const lineHeight = parseFloat(style.lineHeight);
      if (!lineHeight) return;
      // measure the room with the text empty, so its old height does not stretch the column
      text.style.height = '0px';
      // the button is pinned to the bottom of the column, so this is the room left for the text
      const room =
        below.getBoundingClientRect().top -
        text.getBoundingClientRect().top -
        parseFloat(style.marginBottom || '0');
      const lines = Math.max(minLines, Math.floor((room + 1) / lineHeight));
      text.style.height = `${lines * lineHeight}px`;
      text.style.setProperty('-webkit-line-clamp', String(Math.max(lines, 1)));
      text.style.setProperty('line-clamp', String(Math.max(lines, 1)));
    };

    fit();
    // the column changes width with the window; the title and the details change height when
    // the fonts arrive
    const observer = new ResizeObserver(fit);
    observer.observe(column);
    for (const child of Array.from(column.children)) {
      if (child !== text) observer.observe(child);
    }
    media.addEventListener('change', fit);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', fit);
      reset();
    };
  }, [query, minLines]);

  return ref;
}
