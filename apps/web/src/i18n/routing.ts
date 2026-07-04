import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'he', 'ru', 'uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Locales rendered right-to-left */
export const rtlLocales: readonly Locale[] = ['he'];

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'never',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365 * 1, // 1 year
  },
  localeDetection: true,
});
