'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Spinner } from './Spinner';
import { stateLayerClassName } from './styles';
import { useRipple } from '@/hooks/useRipple';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-soft',
  secondary: 'bg-surface-sunken text-ink',
  tonal: 'bg-primary-soft text-primary-ink',
  outline: 'border-2 border-line-strong bg-transparent text-ink hover:border-primary',
  ghost: 'bg-transparent text-primary-ink',
  danger: 'bg-danger text-on-danger shadow-soft',
};

/* Heights are touch targets: 36 / 44 / 52px. Icons scale with the size. */
const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm [&_svg]:size-4',
  md: 'h-11 px-5 text-base [&_svg]:size-5',
  lg: 'h-13 px-6 text-lg [&_svg]:size-6',
};

/** The button look for any host — used by Button, LinkButton and custom hosts. */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    'pressable focus-ring inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none',
    stateLayerClassName,
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-default',
    '[&_svg]:shrink-0',
    variantClassNames[variant],
    sizeClassNames[size],
    fullWidth && 'w-full',
    className,
  );
}

export interface ButtonContentProps {
  children: ReactNode;
  loading?: boolean;
  /** Decorative icon before the label (lucide element, no aria-label needed). */
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/** Label plus icon slots; shared by Button and LinkButton. */
export function ButtonContent({
  children,
  loading,
  leadingIcon,
  trailingIcon,
}: ButtonContentProps) {
  return (
    <>
      {loading ? (
        <Spinner size="sm" />
      ) : leadingIcon ? (
        <span aria-hidden="true" className="inline-flex">
          {leadingIcon}
        </span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span aria-hidden="true" className="inline-flex">
          {trailingIcon}
        </span>
      ) : null}
    </>
  );
}

export interface ButtonProps
  extends
    ComponentProps<'button'>,
    Omit<ButtonStyleOptions, 'className'>,
    Omit<ButtonContentProps, 'children'> {
  children: ReactNode;
}

/**
 * The primary pressable. `type="button"` by default so a stray button never
 * submits a form. `loading` keeps the label and focus, shows a spinner, sets
 * `aria-busy` and swallows clicks — unlike `disabled`, which removes the
 * control from the tab order.
 */
export function Button({
  children,
  variant,
  size,
  fullWidth,
  className,
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  type = 'button',
  onClick,
  onPointerDown,
  onKeyDown,
  ...props
}: ButtonProps) {
  const ripple = useRipple<HTMLButtonElement>();
  const inert = loading || disabled;

  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!inert && !event.defaultPrevented) ripple.onPointerDown(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!inert) ripple.onKeyDown(event);
      }}
      {...props}
    >
      {ripple.rippleLayer}
      <ButtonContent loading={loading} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </ButtonContent>
    </button>
  );
}
