# AGENTS.md — W2W (What to Watch) frontend

Guide for AI coding agents and new teammates. Read it before changing code.

## Commands

Node.js 20.19+ is required (20 is what CI and the Dockerfile use). Before upgrading Vitest, jsdom,
lint-staged or jest-dom to a new major version, check its `engines.node`: the newest majors need Node 22.

| Command             | What it does                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `npm install`       | install dependencies                                                    |
| `npm run dev`       | dev server on http://localhost:5173, `/api/*` is proxied to the backend |
| `npm run lint`      | ESLint (React hooks, accessibility, TypeScript rules)                   |
| `npm run format`    | Prettier over the whole project (`format:check` only checks)            |
| `npm run typecheck` | TypeScript (strict) for the whole `src/`                                |
| `npm test`          | Vitest + React Testing Library (`npm run test:watch` while coding)      |
| `npm run build`     | production bundle in `dist/`                                            |
| `npm run check`     | format:check + lint + typecheck + test + build — run it before every PR |

A pre-commit hook (Husky + lint-staged) formats and lints the staged files; it is installed by
`npm install`.

## Folder map

```
src/
  api/          backend calls only; pages import from api/roomsApi.ts
    rooms.ts      create / join / read / leave a room, start the session
    game.ts       deck, votes, voting progress, results
    auth.ts       accounts: register, sign in, sign out, current user (cookie session + CSRF)
    account.ts    the account's session history and movie identity (GET /me/...)
    types.ts      Room, MovieCard, RoundResults ... and the backend JSON shapes (*Dto)
    client.ts     call() + requireSession(); errors.ts maps backend codes to user messages
    http.ts       fetch wrapper (base /api, X-Participant-Token header)
    queryClient.ts  TanStack Query settings, query keys, POLL_INTERVAL_MS (3 s)
    roomSession.ts  the participant token per room (sessionStorage)
  analytics/    Google Analytics 4: track('event', params) is the only thing pages call
  hooks/        state logic of pages: useRoom, useDeck, useRoundResults ... load
                data with TanStack Query (useQuery / useMutation)
  pages/        one folder per route; RoomPage picks Lobby / Waiting / Swipe / Results by room status
  components/   reusable UI; Brand* = the W2W UI kit (buttons, fields, chips ...);
                AuthLayout + LightField + SocialButtons = the account screens (cream card);
                ConfirmModal = "Leave room?" / "Log out?"; UserMenu = the name pill in the header;
                RequireAccount = wrapper for pages that need a signed-in person;
                AccountLayout = greeting + tabs + cream panel of the signed-in pages (/home...)
  sections/     big landing blocks, also reused on the results page
  utils/        pure functions (formatting, validation, links) — easy to unit-test
  config/       feature flags (FEATURES)
  data/         static content (genres with backend ids, texts); seo.ts = titles, descriptions
                and share images of the public pages
  styles/       base.css, landing.css (theme tokens --l-*), cinema.css (photo backgrounds)
  test/         Vitest setup, fixtures (mockBackend, backendCard, signIn), renderWithQuery
design/         Figma exports — the source of truth for sizes and colours
docs/           architecture, Docker and deployment notes, screenshots
```

## Conventions

- One component per folder: `Name/Name.tsx` + `Name/Name.css`, BEM class names (`block__element--modifier`).
- New screens use the `Brand*` components and the tokens from `styles/landing.css`; match the
  1440px Figma frame in `design/` to the pixel (measure, don't guess).
- Typography: Geologica (headings, buttons) and Inter (text), see `design/README.md`.
- Everything is TypeScript in strict mode: logic in `.ts`, components and pages in `.tsx`. No `any`;
  every component types its props (an `interface Props` or an inline type). Imports carry the real
  extension (`'./rooms.ts'`, `'./Name.tsx'`).
- Never call `fetch` from components: add a function to `api/rooms.ts` or `api/game.ts` that maps
  the backend fields (`*Dto` in `api/types.ts`) to the frontend shape (e.g. `displayName` -> `name`).
- Server data is read through TanStack Query in a hook (`useQuery` with a key from `queryKeys`);
  no `useEffect` + `fetch` + `useState` for loading data.
- Show users `RoomApiError.message` (already user-safe); decide by `error.code`, never by text.
- Do not retry POST requests automatically (no idempotency keys on the backend).
- Accounts: the session is an HttpOnly cookie, nothing is stored in the browser. Read the user with
  `useAccount()`; every POST under `/auth` and `/me` goes through `accountPost()` (it adds the CSRF
  token). Room pages still use the participant token; `useLinkRoomToAccount` in `RoomPage` ties it
  to the account so the session is saved to the history.
- Polling = `refetchInterval: POLL_INTERVAL_MS` on the query (see `useRoom`); TanStack Query stops
  it when the component unmounts.
- Respect `prefers-reduced-motion` in animations.
- Analytics: send events only through `track()` from `analytics/analytics.ts` (typed list of
  events). Never send names or room codes; it runs only on the real site, not on localhost.
- A new public page needs an entry in `data/seo.ts` (+ `usePageMeta(SEO.x)` in the page, a line in
  `public/sitemap.xml`, a picture in `public/og/`); private pages call `usePageMeta()`.
- UI text is English. Comments explain _why_.
- Tests sit next to the code (`*.test.ts` / `*.test.tsx`); mock the backend with `mockBackend()`
  from `src/test/fixtures.ts` (`testRoom()`, `backendCard()`), not by mocking React components. Render anything that loads data
  with `renderWithQuery()` / `renderHookWithQuery()` from `src/test/render.tsx`.

## Backend and environments

- API contract: backend repo `docs/frontend-api.md` and Swagger (`/swagger-ui/index.html`).
- Room flow: `LOBBY` -> `POST /start` -> `VOTING` -> last vote -> `FINISHED` -> `GET /results`.
- Local: `npm run dev` proxies `/api` to `BACKEND_URL` (see `.env.example`).
- Production: the Nginx gateway in the **infra** repo routes `/api/*` to the backend and `/` to this
  container; the compose file and server `.env` live there, not here.

## Don't touch without asking

- `.github/workflows/*`, `Dockerfile`, `nginx.conf` (owned by DevOps).
- `design/` (exports from the designer).
- `src/data/content.ts` genre ids (they must match the backend/TMDB ids).
- `package-lock.json` by hand — use `npm install`.
