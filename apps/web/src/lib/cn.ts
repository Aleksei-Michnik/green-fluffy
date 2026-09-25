import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/* Custom token names from globals.css that tailwind-merge cannot infer
   (colour tokens need no registration — any name is accepted). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['control', 'card'],
      shadow: ['soft', 'lift'],
      ease: ['soft', 'spring'],
      animate: ['rise', 'fade', 'pop'],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts (the last utility of a
 * group wins), so a consumer's `className` can override a kit default.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
