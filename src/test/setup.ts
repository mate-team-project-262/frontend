import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

// jsdom has no matchMedia: behave like "reduce motion", so animations finish at once in tests.
window.matchMedia ??= ((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  addEventListener() {},
  removeEventListener() {},
})) as unknown as typeof window.matchMedia;
window.scrollTo = () => {}; // jsdom only logs "not implemented"
Element.prototype.scrollIntoView ??= () => {};
