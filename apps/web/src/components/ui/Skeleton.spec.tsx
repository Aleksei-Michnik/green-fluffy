import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is decorative and shaped', () => {
    render(
      <>
        <Skeleton data-testid="text" />
        <Skeleton shape="circle" data-testid="circle" />
        <Skeleton shape="rect" className="h-40" data-testid="rect" />
      </>,
    );
    expect(screen.getByTestId('text')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('text').className).toContain('skeleton');
    expect(screen.getByTestId('circle').className).toContain('rounded-full');
    expect(screen.getByTestId('rect').className).toContain('h-40');
    expect(screen.getByTestId('rect').className).not.toContain('h-24');
  });
});
