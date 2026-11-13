import { type ChangeEvent, useState } from 'react';

type Validators<Name extends string> = Record<Name, (value: string) => string>;

/**
 * State of a small form: values, which fields the person has already left, and errors.
 * An error is shown only after the field loses focus (or after a submit attempt), so nobody is
 * told off while still typing. `serverErrors` come from the backend and disappear as soon as the
 * person edits that field.
 */
export function useFormFields<Name extends string>(validators: Validators<Name>) {
  const names = Object.keys(validators) as Name[];
  const empty = () => Object.fromEntries(names.map((name) => [name, ''])) as Record<Name, string>;

  const [values, setValues] = useState(empty);
  const [touched, setTouched] = useState<Partial<Record<Name, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<Name, string>>>({});

  const problems = Object.fromEntries(
    names.map((name) => [name, validators[name](values[name])]),
  ) as Record<Name, string>;
  const isValid = names.every((name) => !problems[name]);

  /** Props for the input of this field. */
  const field = (name: Name) => ({
    name,
    value: values[name],
    error: serverErrors[name] || (touched[name] ? problems[name] : '') || undefined,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      setServerErrors((current) => ({ ...current, [name]: undefined }));
    },
    onBlur: () => setTouched((current) => ({ ...current, [name]: true })),
  });

  /** Marks every field as visited, so all errors show (used on a submit attempt). */
  const touchAll = () =>
    setTouched(Object.fromEntries(names.map((name) => [name, true])) as Record<Name, boolean>);

  return { values, isValid, field, touchAll, setServerErrors };
}
