import { FEATURES } from '../config/features.js';
import { CONTENT_TYPES, GENRES_BY_CONTENT_TYPE } from '../data/content.js';

/**
 * Turns the host's preferences (as the backend returns them) into labelled groups, e.g.
 * [['Movies'], ['Comedy', 'Thriller']]. Genre ids are turned back into names; ids that are
 * not in our lists are skipped. Groups the host left empty are skipped too.
 */
export function getPreferenceGroups({
  contentType = null,
  genreIds = [],
  maxDurationMin = null,
  streamingServices = [],
} = {}) {
  const typeLabel = CONTENT_TYPES.find((type) => type.value === contentType)?.label;
  const knownGenres = GENRES_BY_CONTENT_TYPE[contentType] ?? [];
  const genreNames = genreIds
    .map((id) => knownGenres.find((genre) => genre.id === id)?.name)
    .filter(Boolean);

  return [
    typeLabel ? [typeLabel] : [],
    genreNames,
    maxDurationMin ? [`${maxDurationMin} min`] : [],
    FEATURES.streamingServices ? streamingServices : [],
  ].filter((group) => group.length > 0);
}
