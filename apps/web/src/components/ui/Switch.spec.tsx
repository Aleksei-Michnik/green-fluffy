import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

function Controlled({ onChange }: { onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(false);
  return (
    <Switch
      checked={on}
      onCheckedChange={(next) => {
        setOn(next);
        onChange?.(next);
      }}
      label="Public profile"
      description="Anyone with the link can see it."
    />
  );
}

describe('Switch', () => {
  it('is a switch named by its label and described by the description', () => {
    renderWithIntl(<Controlled />);
    const toggle = screen.getByRole('switch', { name: 'Public profile' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAccessibleDescription('Anyone with the link can see it.');
  });

  it('toggles by click on the control and on the label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(<Controlled onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByText('Public profile'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });

  it('toggles with Space and Enter', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Controlled />);
    await user.tab();
    expect(screen.getByRole('switch')).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('moves the thumb with logical direction classes', () => {
    renderWithIntl(<Switch checked onCheckedChange={() => undefined} label="On" />);
    const thumb = screen.getByRole('switch').firstElementChild as HTMLElement;
    expect(thumb).toHaveAttribute('aria-hidden', 'true');
    expect(thumb.className).toContain('rtl:-translate-x-5.5');
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(<Switch checked={false} onCheckedChange={onChange} label="Off" disabled />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(<Controlled />);
    await expectNoA11yViolations(container);
  });
});
