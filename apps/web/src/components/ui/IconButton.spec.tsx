import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { X } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('IconButton', () => {
  it('takes its accessible name from the label and hides the icon', () => {
    renderWithIntl(
      <IconButton label="Close">
        <X data-testid="icon" />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('title', 'Close');
    expect(button).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('is round and at least 44px in the default size', () => {
    renderWithIntl(
      <IconButton label="Close">
        <X />
      </IconButton>,
    );
    const className = screen.getByRole('button').className;
    expect(className).toContain('rounded-full');
    expect(className).toContain('size-11');
  });

  it('clicks and ripples', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithIntl(
      <IconButton label="Close" onClick={onClick}>
        <X />
      </IconButton>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByTestId('ripple-host')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <IconButton label="Close" variant="primary">
        <X />
      </IconButton>,
    );
    await expectNoA11yViolations(container);
  });
});
