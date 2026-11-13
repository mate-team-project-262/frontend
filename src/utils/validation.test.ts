import {
  getNameFeedback,
  validateAccountName,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
} from './validation.ts';

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

describe('account form rules', () => {
  it('checks the email', () => {
    expect(validateEmail('anna@example.com')).toBe('');
    expect(validateEmail('  anna@example.com ')).toBe('');
    expect(validateEmail('')).toMatch(/enter your email/);
    expect(validateEmail('anna@example')).toBe('Enter a valid email address');
    expect(validateEmail('anna example.com')).toBe('Enter a valid email address');
  });

  it('asks for 8+ characters with a letter and a number in a new password', () => {
    const rule = 'Use 8+ characters, including a letter and a number';
    expect(validateNewPassword('secret12')).toBe('');
    expect(validateNewPassword('  spaces 1 ')).toBe(''); // never trimmed
    expect(validateNewPassword('short1')).toBe(rule);
    expect(validateNewPassword('onlyletters')).toBe(rule);
    expect(validateNewPassword('12345678')).toBe(rule);
    expect(validateNewPassword('a1'.repeat(40))).toBe(rule); // longer than 72
  });

  it('accepts any account name of 3-20 characters', () => {
    expect(validateAccountName('Anna_95!')).toBe('');
    expect(validateAccountName(' Al ')).toMatch(/3-20/);
    expect(validateAccountName('x'.repeat(21))).toMatch(/3-20/);
    expect(validateAccountName('')).toMatch(/enter your name/);
  });
});
