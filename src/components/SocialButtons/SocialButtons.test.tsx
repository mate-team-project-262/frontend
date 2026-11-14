import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialButtons from './SocialButtons.tsx';

describe('SocialButtons', () => {
  it('says "coming soon" while the backend has no social login', async () => {
    render(<SocialButtons />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('button', { name: 'Facebook' }));
    expect(screen.getByRole('status')).toHaveTextContent('Sign in with Facebook is coming soon');
  });

  it('reports the chosen provider once a handler is given', async () => {
    const onSelect = vi.fn();
    render(<SocialButtons onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Google' }));
    expect(onSelect).toHaveBeenCalledWith('google');
  });
});
