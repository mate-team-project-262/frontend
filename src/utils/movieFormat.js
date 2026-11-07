/** Text for the movie card and the details view (English UI). Missing values give null. */

/** 167 -> "2h 47m", 45 -> "45m", 120 -> "2h". */
export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** ['Sci-Fi', 'Action', 'Adventure'] -> "Sci-Fi, Action, and Adventure". */
export const formatList = (items) => (items.length ? listFormat.format(items) : null);

/** 7.94 -> "7.9". */
export const formatRating = (rating) =>
  rating === null || rating === undefined || rating <= 0 ? null : rating.toFixed(1);

const moneyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** 190000000 -> "$190,000,000". */
export const formatMoney = (amount) => (amount ? moneyFormat.format(amount) : null);

let languageNames = null;
try {
  languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
} catch {
  // Old browsers: the code is shown as it is.
}

/** 'en' -> "English" (the code itself when the browser does not know it). */
export function formatLanguage(code) {
  if (!code) return null;
  try {
    return languageNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "2026 • 2h 25m • Sci-Fi, Action, and Adventure" parts, without the empty ones. */
export const getMetaParts = (card) =>
  [card.year ? String(card.year) : null, formatRuntime(card.runtimeMin), formatList(card.genres)].filter(
    Boolean,
  );
