'use client';

import type { ComponentProps, ReactNode } from 'react';
import { useFieldControl } from './Field';
import { controlClassName } from './styles';
import { cn } from '@/lib/cn';

export interface InputProps extends ComponentProps<'input'> {
  /** Decorative icon at the start edge (pointer-transparent). */
  startAdornment?: ReactNode;
  /** Icon or a small control at the end edge; interactive content adds `pointer-events-auto`. */
  endAdornment?: ReactNode;
}

const adornmentClassName =
  'pointer-events-none absolute inset-y-0 flex w-11 items-center justify-center text-ink-subtle [&_svg]:size-5';

/** Single-line text control. Wrap in `Field` for its label, hint and error. */
export function Input({
  className,
  startAdornment,
  endAdornment,
  id,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const field = useFieldControl({
    id,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  const input = (
    <input
      id={field.id}
      required={field.required || undefined}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={cn(
        controlClassName,
        'h-11',
        startAdornment && 'ps-11',
        endAdornment && 'pe-11',
        className,
      )}
      {...props}
    />
  );

  if (!startAdornment && !endAdornment) return input;

  return (
    <div className="relative">
      {startAdornment && (
        <span aria-hidden="true" className={cn(adornmentClassName, 'start-0')}>
          {startAdornment}
        </span>
      )}
      {input}
      {endAdornment && <span className={cn(adornmentClassName, 'end-0')}>{endAdornment}</span>}
    </div>
  );
}
