/** All application routes in one place. */
export const ROUTES = {
  home: '/',
  createRoom: '/create-room',
  join: '/join', // "Join a movie room": paste a link and a name
  room: '/room/:code', // room lobby (host view); the invite link points here too
};

export const roomPath = (code) => `/room/${encodeURIComponent(code)}`;
