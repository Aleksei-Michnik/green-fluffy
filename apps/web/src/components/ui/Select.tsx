'use client';

import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useFieldControl } from './Field';
import { controlClassName } from './styles';
import { cn } from '@/lib/cn';

export type SelectProps = ComponentProps<'select'>;

/**
 * Native select with the kit's look — keyboard, screen-reader and mobile
 * behaviour come from the platform. Children are plain <option>s.
 */
export function Select({
  className,
  id,
  required,
  children,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const field = useFieldControl({
    id,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  return (
    <div className="relative">
      <select
        id={field.id}
        required={field.required || undefined}
        aria-invalid={field.invalid}
        aria-describedby={field.describedBy}
        className={cn(controlClassName, 'h-11 cursor-pointer appearance-none pe-11', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
}
