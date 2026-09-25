import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Footer', () => {
  it('shows the copyright with the current year', () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      `© ${new Date().getFullYear()} Green and Fluffy`,
    );
  });

  it('is localised', () => {
    renderWithIntl(<Footer />, { locale: 'ru' });
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Зелёные и пушистые');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(<Footer />);
    await expectNoA11yViolations(container);
  });
});
