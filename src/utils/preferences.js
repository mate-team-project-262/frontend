import { CONTENT_TYPES } from '../data/content.js';

/**
 * Turns the host's preferences into labelled groups, e.g.
 * [['Movies'], ['Comedy', 'Thriller'], ['Netflix']]. Groups the host left empty are skipped.
 */
export function getPreferenceGroups({
  contentType = null,
  genres = [],
  maxDurationMin = null,
  streamingServices = [],
} = {}) {
  const typeLabel = CONTENT_TYPES.find((type) => type.value === contentType)?.label;
  return [
    typeLabel ? [typeLabel] : [],
    genres,
    maxDurationMin ? [`Up to ${maxDurationMin} min`] : [],
    streamingServices,
  ].filter((group) => group.length > 0);
}
