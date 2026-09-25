import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LinkButton } from './LinkButton';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

// next-intl's Link needs the App Router; a plain anchor is enough here.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('LinkButton', () => {
  it('renders a link that looks like a button', () => {
    renderWithIntl(
      <LinkButton href="/pets" variant="tonal" size="lg">
        Pets
      </LinkButton>,
    );
    const link = screen.getByRole('link', { name: 'Pets' });
    expect(link).toHaveAttribute('href', '/pets');
    expect(link.className).toContain('bg-primary-soft');
    expect(link.className).toContain('h-13');
    expect(link.className).toContain('focus-ring');
  });

  it('ripples on press', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LinkButton href="/">Home</LinkButton>);
    await user.click(screen.getByRole('link'));
    expect(screen.getByTestId('ripple-host')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(<LinkButton href="/">Home</LinkButton>);
    await expectNoA11yViolations(container);
  });
});
