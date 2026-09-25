import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonClassName } from './Button';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Button', () => {
  it('renders a real button that never submits by accident', () => {
    renderWithIntl(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('passes an explicit submit type through', () => {
    renderWithIntl(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies variant and size classes (primary / md by default)', () => {
    renderWithIntl(<Button>Default</Button>);
    const className = screen.getByRole('button').className;
    expect(className).toContain('bg-primary');
    expect(className).toContain('h-11');
    expect(className).toContain('focus-ring');
    expect(className).toContain('pressable');
  });

  it.each([
    ['secondary', 'bg-surface-sunken'],
    ['tonal', 'bg-primary-soft'],
    ['outline', 'border-line-strong'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-danger'],
  ] as const)('styles the %s variant', (variant, expected) => {
    renderWithIntl(<Button variant={variant}>x</Button>);
    expect(screen.getByRole('button').className).toContain(expected);
  });

  it.each([
    ['sm', 'h-9'],
    ['lg', 'h-13'],
  ] as const)('sizes %s', (size, expected) => {
    renderWithIntl(<Button size={size}>x</Button>);
    expect(screen.getByRole('button').className).toContain(expected);
  });

  it('fills the width when asked and lets className override a default', () => {
    renderWithIntl(
      <Button fullWidth className="px-8">
        Wide
      </Button>,
    );
    const className = screen.getByRole('button').className;
    expect(className).toContain('w-full');
    expect(className).toContain('px-8');
    expect(className).not.toContain('px-5');
  });

  it('calls onClick and ripples on a real click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithIntl(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('ripple-host')).toBeInTheDocument();
  });

  it('is disabled for real when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithIntl(
      <Button disabled onClick={onClick}>
        No
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.queryByTestId('ripple-host')).not.toBeInTheDocument();
  });

  it('shows a spinner, stays focusable and swallows clicks while loading', () => {
    const onClick = vi.fn();
    renderWithIntl(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders icons as decoration only', () => {
    renderWithIntl(
      <Button leadingIcon={<Plus data-testid="icon" />} trailingIcon={<Plus />}>
        Add
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Add');
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the same look for other hosts', () => {
    expect(buttonClassName({ variant: 'tonal', size: 'sm' })).toContain('bg-primary-soft');
    expect(buttonClassName({ variant: 'tonal', size: 'sm' })).toContain('h-9');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <>
        <Button>Primary</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
