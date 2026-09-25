/* Class fragments shared by several primitives — keep them here, not copied. */

/** Hover/focus "state layer": a faint tint of the text colour over the host, so one rule fits every variant and both themes. */
export const stateLayerClassName =
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-current after:opacity-0 after:transition-opacity hover:after:opacity-[0.08] focus-visible:after:opacity-[0.08]';

/** Base for text-like form controls (Input, Textarea, Select). 44px tall, 3:1 border, focus ring. */
export const controlClassName =
  'focus-ring w-full rounded-control border-2 border-line-strong bg-surface px-4 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-200 ease-soft hover:border-ink-muted focus-visible:border-primary aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60';
