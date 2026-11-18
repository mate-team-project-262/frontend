import { getFirstName } from './userName.ts';

describe('getFirstName', () => {
  it('takes the first word of the name', () => {
    expect(getFirstName('Sofiia Shcherba')).toBe('Sofiia');
    expect(getFirstName('  Anna  ')).toBe('Anna');
    expect(getFirstName('Sofiia')).toBe('Sofiia');
  });
});
