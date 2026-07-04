'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
 * Header component with app name, navigation, locale switcher, and theme toggle.
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
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* App name */}
        <Link href="/" className="text-xl font-bold text-primary-600">
          {t('common.appName')}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 md:gap-6">
          <Link
            href="/"
            className="hidden md:inline text-sm text-gray-600 hover:text-primary-600 transition-colors dark:text-gray-300 dark:hover:text-primary-400"
          >
            {t('nav.home')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Locale switcher — scalable dropdown */}
          <select
            value={locale}
            onChange={(e) => handleLocaleSwitch(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label="Select language"
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {localeNames[loc]}
              </option>
            ))}
          </select>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
