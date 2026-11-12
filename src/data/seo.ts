/**
 * Titles, descriptions and share images of the public pages (texts come from the marketer; the
 * three pages are also listed in public/sitemap.xml). Used in two places:
 *  - src/hooks/usePageMeta.ts updates <head> when the person moves between pages;
 *  - vite.config.js writes them into the built HTML of each page (dist/index.html,
 *    dist/create-room.html, dist/join.html), so crawlers and link previews that do not run
 *    JavaScript get the right tags too.
 */
export interface PageSeo {
  /** the page's address on the site */
  path: string;
  title: string;
  description: string;
  /** 1200x630 picture for link previews (public/og/) */
  image: string;
}

export const SITE_NAME = 'What To Watch';
/** The public address of the site: canonical links and Open Graph need absolute URLs. */
export const SITE_URL = 'https://what2watch.duckdns.org';

export const SEO = {
  home: {
    path: '/',
    title: 'What To Watch – Choose Movies with Friends',
    description:
      'Find a movie everyone wants to watch! Create a room, invite your friends and discover the perfect movie for your next movie night. No account required.',
    image: '/og/home.jpg',
  },
  createRoom: {
    path: '/create-room',
    title: 'Create a Movie Room with Friends | What To Watch',
    description:
      'Create a movie room, invite your friends and find a film everyone agrees on. Start your next movie night together with What To Watch!',
    image: '/og/create-room.jpg',
  },
  join: {
    path: '/join',
    title: 'Join a Movie Room with Friends | What To Watch',
    description:
      'Join your friends’ movie room, explore movie options and help your group decide what to watch. No account required!',
    image: '/og/join.jpg',
  },
} satisfies Record<string, PageSeo>;
