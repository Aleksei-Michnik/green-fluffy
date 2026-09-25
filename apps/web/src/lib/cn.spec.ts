import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins values and drops falsy ones', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('lets the last conflicting utility win, including kit tokens', () => {
    expect(cn('bg-primary-600', 'bg-canvas')).toBe('bg-canvas');
    expect(cn('rounded-control', 'rounded-full')).toBe('rounded-full');
    expect(cn('shadow-soft', 'shadow-lift')).toBe('shadow-lift');
    expect(cn('ease-soft', 'ease-linear')).toBe('ease-linear');
    expect(cn('px-4 h-11', 'px-6')).toBe('h-11 px-6');
  });
});
