'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { IconButton } from './IconButton';
import { cn } from '@/lib/cn';

export type DialogSize = 'sm' | 'md' | 'lg';

const sizeClassNames: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export interface DialogProps {
  open: boolean;
  /** Called on Escape, backdrop click, the close button — the parent owns `open`. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons; laid out end-aligned, stacked on phones. */
  footer?: ReactNode;
  size?: DialogSize;
  /** `false` while an action is in flight: no Escape, backdrop or close button. */
  dismissible?: boolean;
  /** Element to focus on open, e.g. the cancel button of a confirmation. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * A modal on the native <dialog>: the browser provides the top layer, the
 * focus trap, background inertness, Escape handling and focus return.
 * Enter/exit motion comes from `.dialog` in globals.css.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  initialFocusRef,
  className,
}: DialogProps) {
  const t = useTranslations('ui');
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  return (
    // Backdrop click is a pointer shortcut; Escape and the close button are the keyboard paths.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={cn(
        'dialog m-auto w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-card bg-surface p-0 text-ink shadow-lift',
        sizeClassNames[size],
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Escape: keep the element and React state in step by closing through the parent.
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        // Only the backdrop makes the <dialog> itself the target; the panel covers the rest.
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-xl font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <IconButton label={t('close')} size="sm" onClick={onClose} className="-me-2 -mt-2">
              <X />
            </IconButton>
          )}
        </header>
        {children && <div className="text-ink">{children}</div>}
        {footer && (
          <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
