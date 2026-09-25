import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import en from '../../messages/en.json';
import he from '../../messages/he.json';
import ru from '../../messages/ru.json';
import uk from '../../messages/uk.json';

const messages = { en, he, ru, uk } as const;

export type TestLocale = keyof typeof messages;

/**
 * Real messages, real provider: a component that reads a missing key fails
 * the test instead of rendering the key path.
 */
export function IntlWrapper({
  locale = 'en',
  children,
}: {
  locale?: TestLocale;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      onError={(error) => {
        throw error;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/** Renders inside the intl provider; sets `lang`/`dir` on <html> like the locale layout does. */
export function renderWithIntl(
  ui: ReactElement,
  { locale = 'en', ...options }: RenderOptions & { locale?: TestLocale } = {},
): RenderResult {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
  return render(ui, {
    wrapper: ({ children }) => <IntlWrapper locale={locale}>{children}</IntlWrapper>,
    ...options,
  });
}

export { messages as testMessages };
