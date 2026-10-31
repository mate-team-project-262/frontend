export const HOW_IT_WORKS_STEPS = [
  { title: 'Create a room', text: 'Host starts a room in one click or sets preferences.' },
  { title: 'Invite friends', text: 'Share the room link. Guests join without registration.' },
  { title: 'Swipe together', text: 'Everyone gets the same deck and votes Yes / No.' },
  { title: 'See the winner', text: 'The most-liked movie wins when everyone finishes.' },
];

export const ACCOUNT_BENEFITS = [
  { title: 'Save your sessions', text: 'Past rooms and winners' },
  { title: 'Avoid repeats', text: 'Fewer movies you’ve seen' },
  { title: 'Learn your taste', text: 'Genres, actors & patterns' },
  { title: 'Get better picks', text: 'More relevant over time' },
];

// "Create your movie room" form options
export const CONTENT_TYPES = [
  { value: 'MOVIES', label: 'Movies' },
  { value: 'TV_SERIES', label: 'TV Shows' },
];

/**
 * Genres per content type, exactly as the backend defines them (the request sends only `id`).
 * The lists differ: for example Action is 28 for movies, but TV shows have "Action & Adventure".
 */
export const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

/** Keyed by the content type value sent to the backend ('MOVIES' | 'TV_SERIES'). */
export const GENRES_BY_CONTENT_TYPE = { MOVIES: MOVIE_GENRES, TV_SERIES: TV_GENRES };

export const MAX_DURATIONS_MIN = [90, 120, 150];

/** The most genres a host can pick for one room. */
export const MAX_GENRES = 5;

export const STREAMING_SERVICES = ['Netflix', 'Amazon Prime Video', 'Disney +', 'Apple TV'];
