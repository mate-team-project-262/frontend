import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialButtons from './SocialButtons.tsx';

describe('SocialButtons', () => {
  it('is disabled while the backend has no social login', () => {
    render(<SocialButtons />);
    expect(screen.getByRole('button', { name: 'Google' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Facebook' })).toBeDisabled();
  });

  it('reports the chosen provider once a handler is given', async () => {
    const onSelect = vi.fn();
    render(<SocialButtons onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Google' }));
    expect(onSelect).toHaveBeenCalledWith('google');
  });
});
