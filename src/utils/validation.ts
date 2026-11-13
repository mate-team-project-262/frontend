export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 20;

// Letters of any alphabet, digits, spaces, hyphens and apostrophes. No emojis or special characters.
const ALLOWED_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’-]*$/u;

/**
 * Checks a guest's / host's name. Returns an error text, or '' when the name is valid.
 * Rules: 3-20 characters (an emoji counts as one), only letters, digits, spaces, "-" and "'".
 */
export function validateDisplayName(name: string): string {
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
export const getNameFeedback = (name: string): string =>
  name.trim() ? validateDisplayName(name) : '';

/* ---- Account forms (the same rules as the backend: docs/account-contract.md) ---- */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const EMAIL_MAX_LENGTH = 254;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns an error text, or '' when the email looks valid. */
export function validateEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return 'Please enter your email address';
  if (trimmed.length > EMAIL_MAX_LENGTH || !EMAIL.test(trimmed)) {
    return 'Enter a valid email address';
  }
  return '';
}

/** A new password: 8-72 characters with at least one letter and one number. Never trimmed. */
export function validateNewPassword(password: string): string {
  if (!password) return 'Please create a password';
  const isLongEnough =
    password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  if (!isLongEnough || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Use 8+ characters, including a letter and a number';
  }
  return '';
}

/** Account name: 3-20 characters after trimming (the backend sets no other rule). */
export function validateAccountName(name: string): string {
  const length = [...name.trim()].length;
  if (!length) return 'Please enter your name';
  if (length < DISPLAY_NAME_MIN_LENGTH || length > DISPLAY_NAME_MAX_LENGTH) {
    return `Your name must be ${DISPLAY_NAME_MIN_LENGTH}-${DISPLAY_NAME_MAX_LENGTH} characters long`;
  }
  return '';
}
