import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RIPPLE_DURATION_MS, useRipple } from './useRipple';

function Host() {
  const ripple = useRipple<HTMLButtonElement>();
  return (
    <button type="button" onPointerDown={ripple.onPointerDown} onKeyDown={ripple.onKeyDown}>
      {ripple.rippleLayer}
      press
    </button>
  );
}

const ripples = () => document.querySelectorAll('.ripple');

describe('useRipple', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('spawns a ripple at the pointer on a primary-button press', () => {
    render(<Host />);
    const button = screen.getByRole('button');
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 100,
      height: 40,
    } as DOMRect);

    fireEvent.pointerDown(button, { button: 0, clientX: 30, clientY: 30 });

    expect(screen.getByTestId('ripple-host')).toHaveAttribute('aria-hidden', 'true');
    const ripple = ripples()[0] as HTMLElement;
    expect(ripple.style.left).toBe('20px');
    expect(ripple.style.top).toBe('10px');
    // Diameter reaches the farthest corner (80 × 30 away).
    expect(parseFloat(ripple.style.width)).toBeCloseTo(2 * Math.hypot(80, 30));
  });

  it('ignores secondary buttons', () => {
    render(<Host />);
    fireEvent.pointerDown(screen.getByRole('button'), { button: 2 });
    expect(ripples()).toHaveLength(0);
  });

  it('ripples from the centre on Enter and Space, once per press', () => {
    render(<Host />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: 'Enter', repeat: true });
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyDown(button, { key: 'a' });
    expect(ripples()).toHaveLength(2);
  });

  it('removes a ripple once its animation has run', () => {
    vi.useFakeTimers();
    try {
      render(<Host />);
      fireEvent.pointerDown(screen.getByRole('button'), { button: 0 });
      expect(ripples()).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(RIPPLE_DURATION_MS);
      });
      expect(ripples()).toHaveLength(0);
      expect(screen.queryByTestId('ripple-host')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('spawns nothing under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    render(<Host />);
    fireEvent.pointerDown(screen.getByRole('button'), { button: 0 });
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(ripples()).toHaveLength(0);
  });
});
