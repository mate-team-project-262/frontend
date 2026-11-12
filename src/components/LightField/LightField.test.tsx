import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LightField from './LightField.tsx';

describe('LightField', () => {
  it('ties the label, the hint and the input together', () => {
    render(<LightField label="Email address" hint="We never share it" />);
    const input = screen.getByLabelText('Email address');
    expect(input).toHaveAccessibleDescription('We never share it');
    expect(input).not.toBeInvalid();
  });

  it('shows the error instead of the hint and marks the field invalid', () => {
    render(
      <LightField label="Email address" hint="We never share it" error="Enter a valid email" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInvalid();
  });

  it('offers show / hide only once a password is typed', async () => {
    const user = userEvent.setup();
    render(<LightField label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    await user.type(input, 'secret12');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
