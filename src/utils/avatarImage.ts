/**
 * Profile photo before upload: check it and shrink it in the browser.
 *
 * A phone photo is 2-6 MB; the avatar is shown at 72-120px. The server is small (1 GB RAM) and
 * the gateway accepts 1 MB, so the photo is cut to at most 512 x 512 px and saved as WebP (JPEG
 * where WebP cannot be made): about 50-150 KB. The backend still checks type and the 2 MB limit.
 */

/** what the backend accepts */
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** the backend's limit for the file it stores */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
/** a bigger original is not worth decoding in the browser (and is not a normal photo) */
export const AVATAR_MAX_SOURCE_BYTES = 20 * 1024 * 1024;
/** the longest side after shrinking */
export const AVATAR_SIZE = 512;

export type AvatarProblem = 'type' | 'size' | null;

/** Why a picked file cannot be a profile photo, or null when it can. */
export function checkAvatarFile(file: { type: string; size: number }): AvatarProblem {
  if (!AVATAR_TYPES.includes(file.type)) return 'type';
  if (file.size > AVATAR_MAX_SOURCE_BYTES) return 'size';
  return null;
}

/** The width and height that fit into `max` x `max` without changing the proportions. */
export function fitInto(width: number, height: number, max = AVATAR_SIZE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * The photo at most 512 x 512 px, as WebP (or JPEG). Returns the original file when the browser
 * cannot draw images (old browsers, tests): the backend still checks it.
 */
export async function shrinkAvatar(file: File): Promise<{ blob: Blob; name: string }> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return { blob: file, name: file.name };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { blob: file, name: file.name };
  }
  const size = fitInto(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return { blob: file, name: file.name };
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  // Safari cannot make WebP and quietly returns PNG: then JPEG is smaller
  const webp = await toBlob(canvas, 'image/webp', 0.85);
  if (webp && webp.type === 'image/webp') return { blob: webp, name: 'avatar.webp' };
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.85);
  return jpeg ? { blob: jpeg, name: 'avatar.jpg' } : { blob: file, name: file.name };
}
