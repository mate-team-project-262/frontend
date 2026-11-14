/**
 * Entry point of the backend API for the pages. The code lives in:
 *  - rooms.ts   - create / join / read / leave a room, start the session
 *  - game.ts    - deck, votes, voting progress, results
 *  - auth.ts    - accounts: register, sign in, sign out, the current user
 *  - account.ts - the account's history of sessions and movie identity (taste statistics)
 *  - types.ts   - the shapes pages use (Room, MovieCard...) and the backend JSON (`*Dto`)
 *  - client.ts, http.ts, errors.ts, roomSession.ts - shared plumbing
 * Loading, caching and re-asking (polling) is done by TanStack Query in the hooks (src/hooks).
 */
export { RoomApiError, errorCode, errorMessage } from './errors.ts';
export { isSessionError } from './client.ts';
export * from './rooms.ts';
export * from './game.ts';
export * from './auth.ts';
export * from './account.ts';
export type * from './types.ts';
