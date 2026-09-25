'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps extends Omit<ComponentProps<'button'>, 'onChange' | 'children'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}

/**
 * An on/off setting: label at the start, `role="switch"` button at the end
 * (the settings-row pattern). Use for immediate effects such as visibility;
 * use Checkbox inside forms that are submitted.
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  id,
  className,
  disabled,
  type = 'button',
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = `${switchId}-description`;

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex flex-col gap-0.5 py-1">
        <label
          htmlFor={switchId}
          className={cn(
            'cursor-pointer text-base leading-6 text-ink',
            disabled && 'cursor-not-allowed',
          )}
        >
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="text-sm text-ink-muted">
            {description}
          </span>
        )}
      </div>
      <button
        id={switchId}
        type={type}
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'focus-ring relative mt-0.5 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-soft disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-line-strong',
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none block size-5 rounded-full bg-surface shadow-soft transition-transform duration-200 ease-soft',
            checked
              ? 'translate-x-5.5 rtl:-translate-x-5.5'
              : 'translate-x-0.5 rtl:-translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
