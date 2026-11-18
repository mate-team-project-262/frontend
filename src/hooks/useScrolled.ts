import { useEffect, useState } from 'react';

/** True once the page has been scrolled down by more than `offset` pixels. */
export function useScrolled(offset = 8): boolean {
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > offset);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > offset);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [offset]);

  return isScrolled;
}
