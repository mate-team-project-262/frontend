/**
 * Titles and descriptions of the public pages (texts come from the marketer; the three pages
 * are also listed in public/sitemap.xml). The home page's pair is repeated in index.html, so
 * crawlers that do not run JavaScript still get a title and a description.
 */
export interface PageSeo {
  title: string;
  description: string;
}

export const SITE_NAME = 'What To Watch';

export const SEO = {
  home: {
    title: 'What To Watch – Choose Movies with Friends',
    description:
      'Find a movie everyone wants to watch! Create a room, invite your friends and discover the perfect movie for your next movie night. No account required.',
  },
  createRoom: {
    title: 'Create a Movie Room with Friends | What To Watch',
    description:
      'Create a movie room, invite your friends and find a film everyone agrees on. Start your next movie night together with What To Watch!',
  },
  join: {
    title: 'Join a Movie Room with Friends | What To Watch',
    description:
      'Join your friends’ movie room, explore movie options and help your group decide what to watch. No account required!',
  },
} satisfies Record<string, PageSeo>;
