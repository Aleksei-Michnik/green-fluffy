import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/cn';

export type CardTone = 'surface' | 'sunken' | 'primary' | 'accent';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
/** Semantic hosts: `article` for a self-contained item, `section` for a titled group, `li` in lists. */
export type CardTag = 'div' | 'article' | 'section' | 'li' | 'aside';

export interface CardStyleOptions {
  tone?: CardTone;
  padding?: CardPadding;
  /** Lifts on hover/focus-within — for cards whose content is one link or button. */
  interactive?: boolean;
  className?: string;
}

const toneClassNames: Record<CardTone, string> = {
  surface: 'border border-line bg-surface text-ink shadow-soft',
  sunken: 'bg-surface-sunken text-ink',
  primary: 'bg-primary-soft text-primary-ink',
  accent: 'bg-accent-soft text-accent-ink',
};

const paddingClassNames: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/** The card look for any host element. */
export function cardClassName({
  tone = 'surface',
  padding = 'md',
  interactive = false,
  className,
}: CardStyleOptions = {}): string {
  return cn(
    'rounded-card',
    toneClassNames[tone],
    paddingClassNames[padding],
    interactive &&
      'transition-[transform,box-shadow] duration-200 ease-soft hover:shadow-lift motion-safe:hover:-translate-y-0.5 focus-within:shadow-lift',
    className,
  );
}

export type CardProps<T extends CardTag = 'div'> = Omit<ComponentPropsWithoutRef<T>, 'className'> &
  CardStyleOptions & { as?: T };

/** A spacious surface for grouped content. Server-safe (no hooks); needs a ref? Use `cardClassName` on your own element. */
export function Card<T extends CardTag = 'div'>({
  as,
  tone,
  padding,
  interactive,
  className,
  ...props
}: CardProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  return <Tag className={cardClassName({ tone, padding, interactive, className })} {...props} />;
}
