import { useEffect } from 'react';
import { type PageSeo, SITE_NAME, SITE_URL } from '../data/seo.ts';

/** Sets a <meta> of <head> (creating it when missing) or removes it when `content` is null. */
function setMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  const found = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (content === null) {
    found?.remove();
    return;
  }
  const meta = found ?? document.createElement('meta');
  meta.setAttribute(attribute, key);
  meta.content = content;
  if (!found) document.head.appendChild(meta);
}

function setCanonical(href: string | null) {
  const found = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    found?.remove();
    return;
  }
  const link = found ?? document.createElement('link');
  link.rel = 'canonical';
  link.href = href;
  if (!found) document.head.appendChild(link);
}

/**
 * Sets the page's <title>, meta description, canonical link and Open Graph tags when the person
 * moves between pages (the built HTML of each public page has them too, see vite.config.js).
 * Public pages pass their entry of data/seo.ts. Without it the page is private (a room, an
 * invite link): only the site name is shown and search engines are told not to index it.
 */
export function usePageMeta(seo?: PageSeo) {
  useEffect(() => {
    const url = seo ? `${SITE_URL}${seo.path}` : null;
    document.title = seo?.title ?? SITE_NAME;
    setMeta('name', 'description', seo?.description ?? null);
    setMeta('name', 'robots', seo ? null : 'noindex');
    setCanonical(url);
    setMeta('property', 'og:title', seo?.title ?? null);
    setMeta('property', 'og:description', seo?.description ?? null);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', seo ? `${SITE_URL}${seo.image}` : null);
  }, [seo]);
}
