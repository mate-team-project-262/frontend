import { invitePath } from '../routes.js';

const TELEGRAM_SHARE_TEXT = 'Join my movie room and swipe with me!';

/** Link that friends open to join the room, e.g. https://example.com/join/K7M2QX */
export const getInviteLink = (code) => `${window.location.origin}${invitePath(code)}`;

export const getTelegramShareUrl = (inviteLink) =>
  `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(TELEGRAM_SHARE_TEXT)}`;

/**
 * Accepts a full invite link (https://example.com/join/K7M2QX) or just the room code
 * and returns the code, or null when the text does not look like either.
 */
export function extractRoomCode(input) {
  const text = input.trim();
  if (!text) return null;

  let candidate = text;
  if (text.includes('/')) {
    const match = text.match(/\/(?:join|room)\/([^/?#\s]+)/i);
    if (!match) return null;
    candidate = match[1];
  }
  return /^[A-Za-z0-9_-]{3,32}$/.test(candidate) ? candidate : null;
}
