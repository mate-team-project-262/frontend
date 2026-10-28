export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 20;

/** The backend accepts names of 3-20 characters. Returns an error text, or '' when valid. */
export function validateDisplayName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Please enter your name';
  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH || trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Your name must be ${DISPLAY_NAME_MIN_LENGTH}-${DISPLAY_NAME_MAX_LENGTH} characters long`;
  }
  return '';
}
