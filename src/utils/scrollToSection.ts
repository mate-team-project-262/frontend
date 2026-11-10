/** Smoothly scrolls to the element with this id (instantly if the user prefers reduced motion). */
export function scrollToSection(id: string): void {
  const section = document.getElementById(id);
  if (!section) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}
