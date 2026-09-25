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
    <footer className="border-t border-line bg-surface-sunken">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
