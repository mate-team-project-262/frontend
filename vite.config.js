import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { SEO, SITE_URL } from './src/data/seo.ts';

const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

/** index.html with the title, description, canonical link and Open Graph tags of one page. */
export function withPageSeo(html, page) {
  const url = `${SITE_URL}${page.path}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const setContent = (source, attribute, key, value) =>
    source.replace(
      new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`),
      (_, start, end) => `${start}${value}${end}`,
    );

  let result = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  result = result.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  result = setContent(result, 'name', 'description', description);
  result = setContent(result, 'property', 'og:title', title);
  result = setContent(result, 'property', 'og:description', description);
  result = setContent(result, 'property', 'og:url', url);
  result = setContent(result, 'property', 'og:image', `${SITE_URL}${page.image}`);
  return result;
}

/**
 * The app is one index.html, so without this every address would be served with the home page's
 * <head>. After the build this writes a copy of index.html with its own SEO tags for each other
 * public page as a flat file (dist/create-room.html, dist/join.html); React then starts as usual.
 * Nginx serves them once its fallback is `try_files $uri $uri.html $uri/ /index.html;`
 * (nginx.conf, owned by DevOps). Until then the files are simply not used and every address
 * gets index.html, as before. Not folders on purpose: nginx would redirect /join to /join/.
 */
function seoPages() {
  let outDir = 'dist';
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const html = readFileSync(join(outDir, 'index.html'), 'utf8');
      for (const page of Object.values(SEO)) {
        if (page.path === '/') continue;
        writeFileSync(join(outDir, `${page.path}.html`), withPageSeo(html, page));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The backend does not configure CORS, so in development (and `vite preview`) the browser talks
  // to this server and `/api/...` is forwarded to the backend: /api/rooms -> http://localhost:8080/rooms
  // Another backend address: BACKEND_URL=http://host:port npm run dev (or put it in a .env file)
  const env = loadEnv(mode, '.', 'BACKEND_');
  const backendProxy = {
    '/api': {
      target: env.BACKEND_URL ?? 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react(), seoPages()],
    server: { proxy: backendProxy },
    preview: { proxy: backendProxy },
    // Vitest: unit tests for utils/api/hooks and a few page flows (npm test)
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  };
});
