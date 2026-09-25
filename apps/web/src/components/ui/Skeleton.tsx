import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export type SkeletonShape = 'text' | 'rect' | 'circle';

const shapeClassNames: Record<SkeletonShape, string> = {
  text: 'h-4 w-full rounded-md',
  rect: 'h-24 w-full rounded-control',
  circle: 'size-12 rounded-full',
};

export interface SkeletonProps extends ComponentProps<'span'> {
  shape?: SkeletonShape;
}

/**
 * A loading placeholder. Purely decorative: put `aria-busy` on the region
 * being loaded (and a Spinner with `announce` if the wait is long).
 */
export function Skeleton({ shape = 'text', className, ...props }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('skeleton block', shapeClassNames[shape], className)}
      {...props}
    />
  );
}
