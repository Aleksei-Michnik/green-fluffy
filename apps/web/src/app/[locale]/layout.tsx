import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider, ToastContainer } from '@/components/ui/Toast';
import { routing, rtlLocales, type Locale } from '@/i18n/routing';

import '../globals.css';

export const metadata: Metadata = {
  title: 'Green and Fluffy — care for animals and plants',
  description:
    'Profiles, photo albums, health diaries, care reminders, and safety recommendations for every living being you love — animals and plants alike.',
};

// Applies the persisted (or system) theme before first paint to avoid a flash.
const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var t=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})();`;

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Provide all messages to the client
  const messages = await getMessages();

  const dir = rtlLocales.includes(locale as Locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <Header />
            <ErrorBoundary>{children}</ErrorBoundary>
            <Footer />
            <ToastContainer />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
