import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { useFormFields } from './useFormFields.ts';

const typed = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>;
const setup = () =>
  renderHook(() =>
    useFormFields({
      name: (value: string) => (value ? '' : 'Enter a name'),
      password: (value: string) => (value.length >= 8 ? '' : 'Too short'),
    }),
  );

describe('useFormFields', () => {
  it('shows an error only after the person leaves the field', () => {
    const { result } = setup();
    expect(result.current.isValid).toBe(false);
    expect(result.current.field('password').error).toBeUndefined();

    act(() => result.current.field('password').onChange(typed('abc')));
    expect(result.current.field('password').error).toBeUndefined();

    act(() => result.current.field('password').onBlur());
    expect(result.current.field('password').error).toBe('Too short');
    // the other field was not visited
    expect(result.current.field('name').error).toBeUndefined();
  });

  it('shows every error after a submit attempt', () => {
    const { result } = setup();

    act(() => result.current.touchAll());

    expect(result.current.field('name').error).toBe('Enter a name');
    expect(result.current.field('password').error).toBe('Too short');
  });

  it('becomes valid when every field passes', () => {
    const { result } = setup();

    act(() => result.current.field('name').onChange(typed('Anna')));
    act(() => result.current.field('password').onChange(typed('secret12')));

    expect(result.current.isValid).toBe(true);
    expect(result.current.values).toEqual({ name: 'Anna', password: 'secret12' });
  });

  it('shows a backend error until the person edits that field', () => {
    const { result } = setup();
    act(() => result.current.field('name').onChange(typed('Anna')));

    act(() => result.current.setServerErrors({ name: 'This name is already taken' }));
    expect(result.current.field('name').error).toBe('This name is already taken');

    act(() => result.current.field('name').onChange(typed('Anna2')));
    expect(result.current.field('name').error).toBeUndefined();
  });
});
