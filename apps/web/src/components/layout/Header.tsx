'use client';

import { Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Link } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';

/** Native name display for each locale (add new ones here when scaling) */
const localeNames: Record<Locale, string> = {
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
  uk: 'Українська',
};

/**
 * Header with app name, navigation, locale switcher, and theme toggle.
 * Auth-aware navigation (sign in/up, user menu) is added in Phase 1.
 */
export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleSwitch = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 rounded-control text-base font-semibold text-primary-ink sm:text-lg"
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-primary-soft"
          >
            <Leaf className="size-5" />
          </span>
          {t('common.appName')}
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="focus-ring hidden rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink md:inline-flex"
          >
            {t('nav.home')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <label htmlFor="locale-switcher" className="sr-only">
            {t('nav.language')}
          </label>
          <Select
            id="locale-switcher"
            value={locale}
            onChange={(event) => handleLocaleSwitch(event.target.value)}
            className="h-10 w-auto ps-3 pe-9 text-sm"
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {localeNames[loc]}
              </option>
            ))}
          </Select>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
