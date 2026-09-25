'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

/** Must match the `ripple` animation in globals.css. */
export const RIPPLE_DURATION_MS = 550;

interface RippleState {
  id: number;
  /** Physical offsets from the host's top-left corner — correct in RTL too. */
  x: number;
  y: number;
  size: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Material-style ripple for any pressable host. The host must be
 * `relative overflow-hidden` (the `pressable` utility does that) and render
 * `rippleLayer` as its first child. Pointer presses ripple from the pointer;
 * Enter/Space ripple from the centre so keyboard users get the same feedback.
 * Nothing is spawned under `prefers-reduced-motion: reduce`.
 */
export function useRipple<T extends HTMLElement>() {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const spawn = useCallback((host: T, clientX?: number, clientY?: number) => {
    if (prefersReducedMotion()) return;
    const rect = host.getBoundingClientRect();
    const x = clientX === undefined ? rect.width / 2 : clientX - rect.left;
    const y = clientY === undefined ? rect.height / 2 : clientY - rect.top;
    // Diameter that reaches the farthest corner, so the ripple fills the host.
    const size = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const id = ++nextId.current;
    setRipples((current) => [...current, { id, x, y, size }]);
    // A timer, not `animationend`: it also fires when the host is hidden mid-animation.
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, RIPPLE_DURATION_MS);
    timers.current.add(timer);
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<T>) => {
      if (event.button) return; // secondary buttons never ripple
      spawn(event.currentTarget, event.clientX, event.clientY);
    },
    [spawn],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      if (event.repeat || event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') spawn(event.currentTarget);
    },
    [spawn],
  );

  const rippleLayer: ReactNode =
    ripples.length > 0 ? (
      <span className="ripple-host" aria-hidden="true" data-testid="ripple-host">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple"
            style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
          />
        ))}
      </span>
    ) : null;

  return { onPointerDown, onKeyDown, rippleLayer };
}
