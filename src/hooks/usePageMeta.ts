import { useEffect } from 'react';
import { type PageSeo, SITE_NAME } from '../data/seo.ts';

/** Finds the tag in <head> or creates it, so there is always exactly one of each. */
function headTag<T extends HTMLElement>(selector: string, create: () => T): T {
  const found = document.head.querySelector<T>(selector);
  if (found) return found;
  const tag = create();
  document.head.appendChild(tag);
  return tag;
}

function setMeta(name: string, content: string | null) {
  if (content === null) {
    document.head.querySelector(`meta[name="${name}"]`)?.remove();
    return;
  }
  headTag(`meta[name="${name}"]`, () => {
    const meta = document.createElement('meta');
    meta.name = name;
    return meta;
  }).content = content;
}

function setCanonical(href: string | null) {
  if (href === null) {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    return;
  }
  headTag('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.rel = 'canonical';
    return link;
  }).href = href;
}

/**
 * Sets the page's <title>, meta description and canonical link (the app is a single index.html,
 * so each page writes its own). Public pages pass their texts from data/seo.ts and their path.
 * Without arguments the page is private (a room, an invite link): only the site name is shown
 * and search engines are told not to index it.
 */
export function usePageMeta(seo?: PageSeo, path?: string) {
  const title = seo?.title ?? SITE_NAME;
  const description = seo?.description ?? null;
  const isPublic = Boolean(seo && path);

  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('robots', isPublic ? null : 'noindex');
    setCanonical(isPublic ? `${window.location.origin}${path}` : null);
  }, [title, description, isPublic, path]);
}
