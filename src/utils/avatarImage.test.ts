import { AVATAR_MAX_SOURCE_BYTES, checkAvatarFile, fitInto, shrinkAvatar } from './avatarImage.ts';

describe('avatar image', () => {
  it('accepts JPG, PNG and WebP and refuses other files', () => {
    expect(checkAvatarFile({ type: 'image/jpeg', size: 3_000_000 })).toBeNull();
    expect(checkAvatarFile({ type: 'image/png', size: 100 })).toBeNull();
    expect(checkAvatarFile({ type: 'image/webp', size: 100 })).toBeNull();
    expect(checkAvatarFile({ type: 'image/gif', size: 100 })).toBe('type');
    expect(checkAvatarFile({ type: 'application/pdf', size: 100 })).toBe('type');
    expect(checkAvatarFile({ type: 'image/jpeg', size: AVATAR_MAX_SOURCE_BYTES + 1 })).toBe('size');
  });

  it('fits a photo into 512 x 512 without changing its shape', () => {
    expect(fitInto(4000, 3000)).toEqual({ width: 512, height: 384 });
    expect(fitInto(1080, 1920)).toEqual({ width: 288, height: 512 });
    expect(fitInto(300, 200)).toEqual({ width: 300, height: 200 }); // never made bigger
  });

  it('sends the original file where the browser cannot draw images', async () => {
    const file = new File(['x'], 'me.png', { type: 'image/png' });
    expect(await shrinkAvatar(file)).toEqual({ blob: file, name: 'me.png' });
  });
});
