'use client';

import { CircleCheck, Info, OctagonAlert, TriangleAlert, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { IconButton } from './IconButton';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'caution' | 'danger';

const toneClassNames: Record<AlertTone, string> = {
  info: 'bg-info-soft text-info-ink border-info',
  success: 'bg-success-soft text-success-ink border-success',
  caution: 'bg-caution-soft text-caution-ink border-caution',
  danger: 'bg-danger-soft text-danger-ink border-danger',
};

const toneIcons: Record<AlertTone, typeof Info> = {
  info: Info,
  success: CircleCheck,
  caution: TriangleAlert,
  danger: OctagonAlert,
};

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  tone?: AlertTone;
  /** `strong` adds a full border — the plan's "critical" severity is `tone="danger" emphasis="strong"`. */
  emphasis?: 'soft' | 'strong';
  title?: ReactNode;
  children?: ReactNode;
  /** Overrides the tone icon. */
  icon?: ReactNode;
  /** Buttons rendered under the message. */
  actions?: ReactNode;
  /** Shows a localised dismiss button. */
  onDismiss?: () => void;
  /** Spoken prefix for screen readers; defaults to the tone's name ("Danger", "Warning" …). */
  tonePrefix?: string;
}

/**
 * An inline message. `danger` is announced assertively (`role="alert"`),
 * the other tones politely (`role="status"`); the tone is also spoken as a
 * hidden prefix because the icon alone carries no meaning for a screen reader.
 */
export function Alert({
  tone = 'info',
  emphasis = 'soft',
  title,
  children,
  icon,
  actions,
  onDismiss,
  tonePrefix,
  className,
  role,
  ...props
}: AlertProps) {
  const t = useTranslations('ui');
  const Icon = toneIcons[tone];

  return (
    <div
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      className={cn(
        'flex items-start gap-3 rounded-card border-2 p-4 text-start',
        emphasis === 'soft' && 'border-transparent',
        toneClassNames[tone],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="mt-0.5 inline-flex shrink-0 [&_svg]:size-5">
        {icon ?? <Icon />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="sr-only">{tonePrefix ?? t(`tone.${tone}`)}: </span>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-sm leading-relaxed">{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {onDismiss && (
        <IconButton
          label={t('dismiss')}
          size="sm"
          onClick={onDismiss}
          className="-me-2 -mt-2 text-current hover:text-current"
        >
          <X />
        </IconButton>
      )}
    </div>
  );
}
