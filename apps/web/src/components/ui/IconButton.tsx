'use client';

import type { ComponentProps, ReactNode } from 'react';
import { stateLayerClassName } from './styles';
import { useRipple } from '@/hooks/useRipple';
import { cn } from '@/lib/cn';

export type IconButtonVariant = 'ghost' | 'tonal' | 'outline' | 'primary';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const variantClassNames: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-ink-muted hover:text-ink',
  tonal: 'bg-primary-soft text-primary-ink',
  outline: 'border-2 border-line-strong bg-transparent text-ink hover:border-primary',
  primary: 'bg-primary text-on-primary shadow-soft',
};

const sizeClassNames: Record<IconButtonSize, string> = {
  sm: 'size-9 [&_svg]:size-4',
  md: 'size-11 [&_svg]:size-5',
  lg: 'size-13 [&_svg]:size-6',
};

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  /** The accessible name — an icon has none of its own. Also shown as the tooltip. */
  label: string;
  /** The icon (a lucide element); it is hidden from assistive technology. */
  children: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

/** A round, icon-only button that is always labelled. */
export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 'md',
  className,
  disabled,
  type = 'button',
  onPointerDown,
  onKeyDown,
  ...props
}: IconButtonProps) {
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        'pressable focus-ring inline-flex shrink-0 items-center justify-center rounded-full',
        stateLayerClassName,
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:shrink-0',
        variantClassNames[variant],
        sizeClassNames[size],
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
        {children}
      </span>
    </button>
  );
}
