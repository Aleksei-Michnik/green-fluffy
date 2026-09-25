import { fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from './Header';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: mockRefresh }),
}));

// next-intl's Link needs the App Router; a plain anchor is enough here.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
  });

  it('renders the app name linking to home', () => {
    renderWithIntl(<Header />);
    expect(screen.getByRole('link', { name: 'Green and Fluffy' })).toHaveAttribute('href', '/');
  });

  it('renders the home nav link', () => {
    renderWithIntl(<Header />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders a labelled locale switcher with all four locales in their own names', () => {
    renderWithIntl(<Header />);
    const select = screen.getByRole('combobox', { name: 'Language' });
    const options = select.querySelectorAll('option');
    expect([...options].map((o) => o.value)).toEqual(['en', 'he', 'ru', 'uk']);
    expect([...options].map((o) => o.textContent)).toEqual([
      'English',
      'עברית',
      'Русский',
      'Українська',
    ]);
  });

  it('labels the switcher in the current locale', () => {
    renderWithIntl(<Header />, { locale: 'uk' });
    expect(screen.getByRole('combobox', { name: 'Мова' })).toBeInTheDocument();
  });

  it('sets the locale cookie and refreshes on switch', () => {
    renderWithIntl(<Header />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'uk' },
    });
    expect(document.cookie).toContain('NEXT_LOCALE=uk');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders the theme toggle', () => {
    renderWithIntl(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(<Header />);
    await expectNoA11yViolations(container);
  });
});
