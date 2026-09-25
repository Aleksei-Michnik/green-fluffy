import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

function Harness({
  dismissible = true,
  onClose = () => undefined,
  initiallyOpen = false,
}: {
  dismissible?: boolean;
  onClose?: () => void;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    onClose();
    setOpen(false);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog
        open={open}
        onClose={close}
        title="Archive Muffin?"
        description="Leaves every list."
        dismissible={dismissible}
        initialFocusRef={cancelRef}
        footer={
          <Button ref={cancelRef} variant="ghost" onClick={close}>
            Cancel
          </Button>
        }
      >
        <p>Body</p>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('is closed until opened, then modal with a name and description', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleName('Archive Muffin?');
    expect(dialog).toHaveAccessibleDescription('Leaves every list.');
    expect(screen.getByRole('heading', { level: 2, name: 'Archive Muffin?' })).toBeInTheDocument();
  });

  it('moves focus to the requested element on open', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('closes from the localised close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} initiallyOpen />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
  });

  it('closes on Escape (the native cancel event)', () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} initiallyOpen />);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on a backdrop click but not on a click inside the panel', () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} initiallyOpen />);
    fireEvent.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores Escape, backdrop and hides the close button when not dismissible', () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} dismissible={false} initiallyOpen />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('localises the close button', () => {
    renderWithIntl(<Harness initiallyOpen />, { locale: 'ru' });
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const { container } = renderWithIntl(<Harness initiallyOpen />);
    await expectNoA11yViolations(container);
  });
});
