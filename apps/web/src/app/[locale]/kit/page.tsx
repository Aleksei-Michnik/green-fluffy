import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KitShowcase } from '@/components/kit/KitShowcase';

export const metadata: Metadata = {
  title: 'UI kit — Green and Fluffy',
  robots: { index: false, follow: false },
};

/**
 * Developer showcase of every kit primitive in every state. Exists in
 * development and staging only; production answers 404. The Playwright
 * scan in `e2e/kit.spec.ts` runs axe over it in all four locales and both themes.
 */
export default function KitPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <KitShowcase />;
}
