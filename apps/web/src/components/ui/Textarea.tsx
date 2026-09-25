'use client';

import type { ComponentProps } from 'react';
import { useFieldControl } from './Field';
import { controlClassName } from './styles';
import { cn } from '@/lib/cn';

export type TextareaProps = ComponentProps<'textarea'>;

/** Multi-line text control; grows by dragging, never below three lines. Wrap in `Field`. */
export function Textarea({
  className,
  id,
  required,
  rows = 3,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  const field = useFieldControl({
    id,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  return (
    <textarea
      id={field.id}
      rows={rows}
      required={field.required || undefined}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={cn(controlClassName, 'min-h-11 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
}
