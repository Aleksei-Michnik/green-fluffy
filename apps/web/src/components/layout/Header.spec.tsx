import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: mockRefresh }),
}));

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock @/i18n/navigation (Link, etc.)
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock @/i18n/routing
vi.mock('@/i18n/routing', () => ({
  locales: ['en', 'he', 'ru', 'uk'] as const,
  defaultLocale: 'en',
  rtlLocales: ['he'] as const,
  routing: {
    locales: ['en', 'he', 'ru', 'uk'],
    defaultLocale: 'en',
  },
}));

describe('Header', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
  });

  it('renders the app name linking to home', () => {
    render(<Header />);
    const appName = screen.getByText('common.appName');
    expect(appName).toBeInTheDocument();
    expect(appName.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the home nav link', () => {
    render(<Header />);
    expect(screen.getByText('nav.home')).toBeInTheDocument();
  });

  it('renders the locale switcher with all four locales', () => {
    render(<Header />);
    const select = screen.getByLabelText('Select language');
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(4);
    expect([...options].map((o) => o.value)).toEqual(['en', 'he', 'ru', 'uk']);
  });

  it('shows native locale names', () => {
    render(<Header />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('עברית')).toBeInTheDocument();
    expect(screen.getByText('Русский')).toBeInTheDocument();
    expect(screen.getByText('Українська')).toBeInTheDocument();
  });

  it('sets the locale cookie and refreshes on switch', () => {
    render(<Header />);
    const select = screen.getByLabelText('Select language');
    fireEvent.change(select, { target: { value: 'uk' } });
    expect(document.cookie).toContain('NEXT_LOCALE=uk');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders the theme toggle', () => {
    render(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});
