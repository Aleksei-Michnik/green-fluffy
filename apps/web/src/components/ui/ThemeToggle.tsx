'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * Dark/light theme toggle. The active theme lives in `<html data-theme>`,
 * initialized before hydration by the inline script in the locale layout
 * (persisted choice from localStorage, falling back to the system scheme).
 */
export function ThemeToggle() {
  const t = useTranslations('theme');
  // Render a stable placeholder until mounted — the real theme is only known client-side.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  const toggle = () => {
    const next: Theme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage unavailable (private mode) — theme still applies for this page.
    }
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
      data-testid="theme-toggle"
      className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:text-primary-600 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:text-primary-400"
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}
