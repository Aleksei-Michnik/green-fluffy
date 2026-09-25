'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createContext, useContext, useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

interface ControlProps {
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}

/**
 * Wiring for a control inside (or outside) a Field: the label's `id`, the
 * hint/error `aria-describedby`, `aria-invalid` and `required`. A control's own
 * props win over the Field's.
 */
export function useFieldControl(props: ControlProps) {
  const field = useContext(FieldContext);
  const fallbackId = useId();
  const id = props.id ?? field?.id ?? fallbackId;
  const describedBy =
    [field?.describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const invalid = props['aria-invalid'] ?? (field?.invalid ? true : undefined);
  const required = props.required ?? field?.required ?? false;
  return { id, describedBy, invalid, required };
}

export interface FieldProps {
  label: ReactNode;
  /** Helper text under the control; announced with it. */
  hint?: ReactNode;
  /** Validation message; announced immediately and marks the control invalid. */
  error?: ReactNode;
  /** Marks the control required and shows an asterisk. */
  required?: boolean;
  /** Shows the localised "(optional)" next to the label; for forms where most fields are required. */
  optional?: boolean;
  id?: string;
  className?: string;
  /** Exactly one control: Input, Textarea or Select. */
  children: ReactNode;
}

/**
 * Label, hint and error around one text-like control. The control gets its
 * id and ARIA wiring from context, so `<Field label="Name"><Input /></Field>`
 * is complete.
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  optional = false,
  id: idProp,
  className,
  children,
}: FieldProps) {
  const t = useTranslations('ui');
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <FieldContext.Provider
      value={{ id, describedBy: describedBy || undefined, invalid: Boolean(error), required }}
    >
      <div className={cn('flex flex-col gap-1.5', className)}>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-danger">
              *
            </span>
          )}
          {optional && !required && (
            <span className="ms-1.5 text-xs font-normal text-ink-subtle">({t('optional')})</span>
          )}
        </label>
        {children}
        {hint && (
          <p id={hintId} className="text-sm text-ink-muted">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1.5 text-sm font-medium text-danger-ink"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
