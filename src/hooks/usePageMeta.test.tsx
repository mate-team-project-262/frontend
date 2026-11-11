import { renderHook } from '@testing-library/react';
import { SEO } from '../data/seo.ts';
import { usePageMeta } from './usePageMeta.ts';

const meta = (name: string) =>
  document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? null;
const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;

describe('usePageMeta', () => {
  it('writes the title, description and canonical link of a public page', () => {
    renderHook(() => usePageMeta(SEO.createRoom, '/create-room'));
    expect(document.title).toBe('Create a Movie Room with Friends | What To Watch');
    expect(meta('description')).toBe(SEO.createRoom.description);
    expect(canonical()).toBe(`${window.location.origin}/create-room`);
    expect(meta('robots')).toBeNull();
  });

  it('replaces the tags when another page opens (never duplicates them)', () => {
    renderHook(() => usePageMeta(SEO.home, '/'));
    renderHook(() => usePageMeta(SEO.join, '/join'));
    expect(document.title).toBe(SEO.join.title);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(canonical()).toBe(`${window.location.origin}/join`);
  });

  it('keeps private pages (rooms, invite links) out of search engines', () => {
    renderHook(() => usePageMeta(SEO.home, '/'));
    renderHook(() => usePageMeta());
    expect(document.title).toBe('What To Watch');
    expect(meta('robots')).toBe('noindex');
    expect(meta('description')).toBeNull();
    expect(canonical()).toBeNull();
  });

  it('every public page has its own title and description', () => {
    const pages = Object.values(SEO);
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(pages.length);
  });
});
