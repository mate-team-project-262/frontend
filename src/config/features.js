/**
 * Features that are designed but not part of the MVP. Switch one on when the backend supports it.
 *
 * streamingServices - "Streaming services" filter on the Create room page and in the room
 *                     preferences ("Where to watch" is not in the MVP).
 *
 * durationRanges   - send the exact movie-length ranges of the ticked durations (see utils/duration.js)
 *                     to the backend. Until it accepts them only the longest time is sent.
 */
export const FEATURES = {
  streamingServices: false,
  durationRanges: false,
};
