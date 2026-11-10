import { extractRoomCode, getTelegramShareUrl } from './roomLinks.ts';

describe('extractRoomCode', () => {
  it.each([
    ['K7M2QX', 'K7M2QX'],
    ['  k7m2qx  ', 'k7m2qx'],
    ['https://what2watch.duckdns.org/join/K7M2QX', 'K7M2QX'],
    ['http://localhost/room/K7M2QX?x=1', 'K7M2QX'],
  ])('reads %s', (input, code) => {
    expect(extractRoomCode(input)).toBe(code);
  });

  it.each(['', 'https://example.com/other/K7M2QX', 'no spaces allowed', 'ab'])(
    'rejects %j',
    (input) => {
      expect(extractRoomCode(input)).toBeNull();
    },
  );
});

it('builds a Telegram share link with the encoded invite', () => {
  const url = getTelegramShareUrl('https://site/join/ABC');
  expect(url).toContain('url=https%3A%2F%2Fsite%2Fjoin%2FABC');
  expect(url.startsWith('https://t.me/share/url?')).toBe(true);
});
