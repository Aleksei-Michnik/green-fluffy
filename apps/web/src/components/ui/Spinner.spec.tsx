import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Spinner', () => {
  it('is decorative by default', () => {
    renderWithIntl(<Spinner />);
    expect(screen.getByTestId('spinner')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('announces a localised loading state when asked', () => {
    renderWithIntl(<Spinner announce />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('announces in Hebrew', () => {
    renderWithIntl(<Spinner announce />, { locale: 'he' });
    expect(screen.getByRole('status')).toHaveTextContent('בטעינה…');
  });

  it('accepts a custom announcement', () => {
    renderWithIntl(<Spinner label="Saving…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });

  it('scales with size', () => {
    renderWithIntl(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner').getAttribute('class')).toContain('size-8');
  });

  it('has no axe violations when announcing', async () => {
    const { container } = renderWithIntl(<Spinner announce />);
    await expectNoA11yViolations(container);
  });
});
