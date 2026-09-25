import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Chip', () => {
  it('is a toggle button exposing its pressed state', () => {
    renderWithIntl(<Chip>All</Chip>);
    const chip = screen.getByRole('button', { name: 'All' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).toHaveAttribute('type', 'button');
  });

  it('shows the selected look with a check mark', () => {
    renderWithIntl(<Chip selected>Plants</Chip>);
    const chip = screen.getByRole('button', { name: 'Plants' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip.className).toContain('border-primary');
    expect(chip.querySelector('svg')).not.toBeNull();
  });

  it('formats the count for the locale', () => {
    renderWithIntl(<Chip count={1234}>Animals</Chip>, { locale: 'ru' });
    expect(screen.getByRole('button')).toHaveTextContent(/1.234/);
    expect(screen.getByRole('button')).not.toHaveTextContent('1,234');
  });

  it('clicks and ripples', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithIntl(<Chip onClick={onClick}>All</Chip>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByTestId('ripple-host')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <>
        <Chip selected count={3}>
          All
        </Chip>
        <Chip>Plants</Chip>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
