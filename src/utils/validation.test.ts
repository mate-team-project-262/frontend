import { getNameFeedback, validateDisplayName } from './validation.ts';

describe('validateDisplayName', () => {
  it.each(['Ann', 'Анна', "O'Neil", 'Mary-Jane', 'Player 2', 'a'.repeat(20)])(
    'accepts %s',
    (name) => {
      expect(validateDisplayName(name)).toBe('');
    },
  );

  it('asks for a name when it is empty', () => {
    expect(validateDisplayName('   ')).toBe('Please enter your name');
  });

  it.each(['Al', 'a'.repeat(21)])('rejects the length of %s', (name) => {
    expect(validateDisplayName(name)).toMatch(/3-20 characters/);
  });

  it.each(['Ann😀', 'Ann!', '-Ann', 'Ann<b>'])('rejects special characters in %s', (name) => {
    expect(validateDisplayName(name)).toMatch(/only letters/);
  });

  it('trims spaces before checking', () => {
    expect(validateDisplayName('  Ann  ')).toBe('');
  });
});

describe('getNameFeedback', () => {
  it('says nothing for an empty field', () => {
    expect(getNameFeedback('')).toBe('');
  });

  it('shows the error while typing', () => {
    expect(getNameFeedback('A')).toMatch(/3-20/);
  });
});
