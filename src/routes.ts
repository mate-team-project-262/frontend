/** All application routes in one place. */
export const ROUTES = {
  home: '/',
  createRoom: '/create-room',
  join: '/join', // "Join a movie room": paste a link and a name
  invite: '/join/:code', // the link the host shares (the backend asks for /join/{code})
  room: '/room/:code', // inside a room: host lobby or guest waiting room (needs a token)
} as const;

export const invitePath = (code: string): string => `/join/${encodeURIComponent(code)}`;
export const roomPath = (code: string): string => `/room/${encodeURIComponent(code)}`;
