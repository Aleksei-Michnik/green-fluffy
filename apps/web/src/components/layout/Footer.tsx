'use client';

import { useTranslations } from 'next-intl';

/**
 * Footer with copyright. Legal links (terms, privacy) are added in Phase 1.10
 * together with the pages themselves.
 */
export function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
