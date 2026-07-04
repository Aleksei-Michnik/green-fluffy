/**
 * Application-wide constants shared between all apps.
 */

/** API version prefix */
export const API_VERSION = 'v1' as const;

/** Default pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/** Supported locales (he is RTL) */
export const LOCALES = ['en', 'he', 'ru', 'uk'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
