/** All application routes in one place. */
export const ROUTES = {
  home: '/',
  createRoom: '/create-room',
  join: '/join', // "Join a movie room": paste a link and a name
  invite: '/join/:code', // the link the host shares (the backend asks for /join/{code})
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password', // ask for a password reset link
  resetPassword: '/reset-password', // the link from the email: ?token=...
  // pages of a signed-in person
  dashboard: '/home',
  sessions: '/home/sessions',
  sessionDetails: '/home/sessions/:sessionId',
  movieIdentity: '/home/movie-identity',
  account: '/account', // "My account": name, email, password, delete the account
  room: '/room/:code', // inside a room: host lobby or guest waiting room (needs a token)
} as const;

export const invitePath = (code: string): string => `/join/${encodeURIComponent(code)}`;
export const sessionDetailsPath = (sessionId: number): string => `/home/sessions/${sessionId}`;
export const roomPath = (code: string): string => `/room/${encodeURIComponent(code)}`;
