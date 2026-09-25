import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';
import { Button } from './Button';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Alert', () => {
  it('is a polite status by default, with the tone spoken as a prefix', () => {
    renderWithIntl(<Alert>Saved.</Alert>);
    const alert = screen.getByRole('status');
    expect(alert).toHaveTextContent('Information: Saved.');
    expect(alert.className).toContain('bg-info-soft');
  });

  it('is assertive for danger', () => {
    renderWithIntl(
      <Alert tone="danger" title="Toxic">
        Keep apart.
      </Alert>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/^Danger: Toxic/);
    expect(alert).toHaveTextContent('Keep apart.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each([
    ['success', 'Success'],
    ['caution', 'Warning'],
  ] as const)('prefixes %s', (tone, prefix) => {
    renderWithIntl(<Alert tone={tone}>x</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent(`${prefix}: x`);
  });

  it('lets the caller override the spoken prefix', () => {
    renderWithIntl(
      <Alert tone="danger" tonePrefix="Error">
        Could not save.
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/^Error: Could not save/);
  });

  it('speaks the prefix in Ukrainian', () => {
    renderWithIntl(<Alert tone="caution">x</Alert>, { locale: 'uk' });
    expect(screen.getByRole('status')).toHaveTextContent('Попередження: x');
  });

  it('adds a full border for strong emphasis', () => {
    renderWithIntl(<Alert emphasis="strong">x</Alert>);
    expect(screen.getByRole('status').className).not.toContain('border-transparent');
  });

  it('renders actions and a localised dismiss button', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderWithIntl(
      <Alert onDismiss={onDismiss} actions={<Button size="sm">Undo</Button>}>
        Archived.
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('localises the dismiss label', () => {
    renderWithIntl(<Alert onDismiss={() => undefined}>x</Alert>, { locale: 'he' });
    expect(screen.getByRole('button', { name: 'סגירת ההודעה' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <>
        <Alert title="Info">Body</Alert>
        <Alert tone="danger" emphasis="strong" onDismiss={() => undefined}>
          Danger
        </Alert>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
