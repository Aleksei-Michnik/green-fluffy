'use client';

import { Check } from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type' | 'size'> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
}

/** Native checkbox with a drawn box; the whole label row is the tap target. */
export function Checkbox({
  label,
  description,
  error,
  id,
  className,
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [description ? descriptionId : null, error ? errorId : null, ariaDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'flex cursor-pointer items-start gap-3 py-1.5',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className="peer focus-ring size-6 cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-surface transition-colors duration-200 ease-soft checked:border-primary checked:bg-primary hover:border-primary disabled:cursor-not-allowed aria-invalid:border-danger"
            {...props}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="pointer-events-none absolute size-4 text-on-primary opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
          />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-base leading-6 text-ink">{label}</span>
          {description && (
            <span id={descriptionId} className="text-sm text-ink-muted">
              {description}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
