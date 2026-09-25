'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const sizes: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /**
   * Announce the loading state (role="status" + localised "Loading…").
   * Leave off inside buttons and regions that already carry `aria-busy`.
   */
  announce?: boolean;
  /** Custom announcement text; implies `announce`. */
  label?: string;
}

export function Spinner({ size = 'md', className, announce = false, label }: SpinnerProps) {
  const t = useTranslations('ui');
  const svg = (
    <svg
      className={cn('shrink-0 animate-spin', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      data-testid="spinner"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!announce && !label) return svg;

  return (
    <span role="status" className="inline-flex items-center">
      {svg}
      <span className="sr-only">{label ?? t('loading')}</span>
    </span>
  );
}
