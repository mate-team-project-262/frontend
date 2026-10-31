export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 20;

// Letters of any alphabet, digits, spaces, hyphens and apostrophes. No emojis or special characters.
const ALLOWED_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’-]*$/u;

/**
 * Checks a guest's / host's name. Returns an error text, or '' when the name is valid.
 * Rules: 3-20 characters (an emoji counts as one), only letters, digits, spaces, "-" and "'".
 */
export function validateDisplayName(name) {
  const trimmed = name.trim().normalize('NFC');
  if (!trimmed) return 'Please enter your name';
  const length = [...trimmed].length;
  if (length < DISPLAY_NAME_MIN_LENGTH || length > DISPLAY_NAME_MAX_LENGTH) {
    return `Your name must be ${DISPLAY_NAME_MIN_LENGTH}-${DISPLAY_NAME_MAX_LENGTH} characters long`;
  }
  if (!ALLOWED_NAME.test(trimmed)) {
    return 'Use only letters, numbers, spaces, hyphens and apostrophes';
  }
  return '';
}

/** Name shown live while typing: nothing for an empty field, otherwise the validation error. */
export const getNameFeedback = (name) => (name.trim() ? validateDisplayName(name) : '');
