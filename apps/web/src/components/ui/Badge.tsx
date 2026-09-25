import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone =
  'neutral' | 'primary' | 'accent' | 'info' | 'success' | 'caution' | 'danger';

const toneClassNames: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted',
  primary: 'bg-primary-soft text-primary-ink',
  accent: 'bg-accent-soft text-accent-ink',
  info: 'bg-info-soft text-info-ink',
  success: 'bg-success-soft text-success-ink',
  caution: 'bg-caution-soft text-caution-ink',
  danger: 'bg-danger-soft text-danger-ink',
};

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  /** Decorative icon; the text carries the meaning. */
  icon?: ReactNode;
  children: ReactNode;
}

/** A static label: status, visibility, severity, kingdom. Not clickable — that is Chip. */
export function Badge({
  tone = 'neutral',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'h-6 px-2.5 text-xs [&_svg]:size-3.5' : 'h-7 px-3 text-sm [&_svg]:size-4',
        toneClassNames[tone],
        className,
      )}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
