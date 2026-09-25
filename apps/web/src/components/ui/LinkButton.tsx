'use client';

import type { ComponentProps } from 'react';
import {
  ButtonContent,
  buttonClassName,
  type ButtonContentProps,
  type ButtonStyleOptions,
} from './Button';
import { useRipple } from '@/hooks/useRipple';
import { Link } from '@/i18n/navigation';

export interface LinkButtonProps
  extends
    Omit<ComponentProps<typeof Link>, 'children'>,
    Omit<ButtonStyleOptions, 'className'>,
    Omit<ButtonContentProps, 'loading'> {}

/** A locale-aware link that looks and ripples like a Button. Navigation only — actions use Button. */
export function LinkButton({
  children,
  variant,
  size,
  fullWidth,
  className,
  leadingIcon,
  trailingIcon,
  onPointerDown,
  onKeyDown,
  ...props
}: LinkButtonProps) {
  const ripple = useRipple<HTMLAnchorElement>();

  return (
    <Link
      className={buttonClassName({ variant, size, fullWidth, className })}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) ripple.onPointerDown(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        ripple.onKeyDown(event);
      }}
      {...props}
    >
      {ripple.rippleLayer}
      <ButtonContent leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </ButtonContent>
    </Link>
  );
}
