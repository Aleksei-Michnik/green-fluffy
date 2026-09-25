import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Checkbox', () => {
  it('is a native checkbox named by its label', () => {
    renderWithIntl(<Checkbox name="consent" label="I agree" />);
    const box = screen.getByRole('checkbox', { name: 'I agree' });
    expect(box).toHaveAttribute('type', 'checkbox');
    expect(box).not.toBeChecked();
  });

  it('toggles from the label text and the box', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(<Checkbox name="consent" label="I agree" onChange={onChange} />);
    await user.click(screen.getByText('I agree'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('toggles with the keyboard', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Checkbox name="consent" label="I agree" />);
    await user.tab();
    expect(screen.getByRole('checkbox')).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('describes with description and error', () => {
    renderWithIntl(
      <Checkbox name="consent" label="I agree" description="Required." error="Please confirm." />,
    );
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAccessibleDescription('Required. Please confirm.');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Please confirm.');
  });

  it('disables', () => {
    renderWithIntl(<Checkbox name="off" label="Off" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <>
        <Checkbox name="a" label="A" description="Desc" />
        <Checkbox name="b" label="B" error="Err" defaultChecked />
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
