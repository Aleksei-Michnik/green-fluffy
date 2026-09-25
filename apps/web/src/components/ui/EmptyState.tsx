import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Decorative illustration or lucide icon. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The one thing to do next — usually a Button or LinkButton. */
  action?: ReactNode;
  /** Heading level that fits the page outline. */
  headingLevel?: 2 | 3;
}

/** The friendly "nothing here yet" that sells the next step. Server-safe. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
  className,
  ...props
}: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section
      className={cn(
        'flex flex-col items-center gap-4 rounded-card bg-surface-sunken px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-ink [&_svg]:size-8"
        >
          {icon}
        </span>
      )}
      <Heading className="text-xl font-semibold text-ink">{title}</Heading>
      {description && <p className="max-w-prose text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
