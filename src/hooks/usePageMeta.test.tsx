import { renderHook } from '@testing-library/react';
import { SEO } from '../data/seo.ts';
import { usePageMeta } from './usePageMeta.ts';

const meta = (key: string) =>
  document.head.querySelector<HTMLMetaElement>(`meta[name="${key}"], meta[property="${key}"]`)
    ?.content ?? null;
const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;

describe('usePageMeta', () => {
  it('writes the title, description, canonical link and Open Graph tags of a public page', () => {
    renderHook(() => usePageMeta(SEO.createRoom));
    expect(document.title).toBe('Create a Movie Room with Friends | What To Watch');
    expect(meta('description')).toBe(SEO.createRoom.description);
    expect(canonical()).toBe('https://what2watch.duckdns.org/create-room');
    expect(meta('og:title')).toBe(SEO.createRoom.title);
    expect(meta('og:description')).toBe(SEO.createRoom.description);
    expect(meta('og:url')).toBe('https://what2watch.duckdns.org/create-room');
    expect(meta('og:image')).toBe('https://what2watch.duckdns.org/og/create-room.jpg');
    expect(meta('robots')).toBeNull();
  });

  it('replaces the tags when another page opens (never duplicates them)', () => {
    renderHook(() => usePageMeta(SEO.home));
    renderHook(() => usePageMeta(SEO.join));
    expect(document.title).toBe(SEO.join.title);
    for (const selector of [
      'meta[name="description"]',
      'link[rel="canonical"]',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
    ]) {
      expect(document.head.querySelectorAll(selector)).toHaveLength(1);
    }
    expect(canonical()).toBe('https://what2watch.duckdns.org/join');
  });

  it('keeps private pages (rooms, invite links) out of search engines and link previews', () => {
    renderHook(() => usePageMeta(SEO.home));
    renderHook(() => usePageMeta());
    expect(document.title).toBe('What To Watch');
    expect(meta('robots')).toBe('noindex');
    expect(meta('description')).toBeNull();
    expect(meta('og:url')).toBeNull();
    expect(canonical()).toBeNull();
  });

  it('every public page has its own title, description, address and picture', () => {
    const pages = Object.values(SEO);
    for (const field of ['title', 'description', 'path', 'image'] as const) {
      expect(new Set(pages.map((page) => page[field])).size).toBe(pages.length);
    }
  });
});
