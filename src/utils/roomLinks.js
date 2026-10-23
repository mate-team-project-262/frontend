import { roomPath } from '../routes.js';

const TELEGRAM_SHARE_TEXT = 'Join my movie room and swipe with me!';

/** Link that friends open to join the room, e.g. https://example.com/room/GMX2I */
export const getInviteLink = (code) => `${window.location.origin}${roomPath(code)}`;

export const getTelegramShareUrl = (inviteLink) =>
  `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(TELEGRAM_SHARE_TEXT)}`;
