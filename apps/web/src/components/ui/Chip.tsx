'use client';

import { Check } from 'lucide-react';
import { useFormatter } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { stateLayerClassName } from './styles';
import { useRipple } from '@/hooks/useRipple';
import { cn } from '@/lib/cn';

export interface ChipProps extends Omit<ComponentProps<'button'>, 'children'> {
  children: ReactNode;
  /** Pressed state, exposed as `aria-pressed`. */
  selected?: boolean;
  icon?: ReactNode;
  /** Item count, formatted for the locale. */
  count?: number;
}

/** A toggle for filters and quick choices; a row of Chips is a set of `aria-pressed` buttons. */
export function Chip({
  children,
  selected = false,
  icon,
  count,
  className,
  disabled,
  type = 'button',
  onPointerDown,
  onKeyDown,
  ...props
}: ChipProps) {
  const format = useFormatter();
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      type={type}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'pressable focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-medium whitespace-nowrap select-none',
        stateLayerClassName,
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        selected
          ? 'border-primary bg-primary-soft text-primary-ink'
          : 'border-line-strong bg-surface text-ink-muted hover:text-ink',
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!disabled && !event.defaultPrevented) ripple.onPointerDown(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!disabled) ripple.onKeyDown(event);
      }}
      {...props}
    >
      {ripple.rippleLayer}
      <span aria-hidden="true" className="inline-flex">
        {selected ? <Check strokeWidth={3} /> : icon}
      </span>
      <span>{children}</span>
      {count !== undefined && (
        <span className="rounded-full bg-surface-sunken px-1.5 text-xs text-ink-muted">
          {format.number(count)}
        </span>
      )}
    </button>
  );
}
