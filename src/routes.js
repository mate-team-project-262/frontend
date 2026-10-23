/** All application routes in one place. */
export const ROUTES = {
  home: '/',
  createRoom: '/create-room',
  room: '/room/:code', // room lobby (host view); the invite link points here too
};

export const roomPath = (code) => `/room/${encodeURIComponent(code)}`;
