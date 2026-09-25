'use client';

import { useTranslations } from 'next-intl';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, type AlertTone } from './Alert';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Milliseconds before auto-dismiss; 0 keeps the toast until dismissed. */
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

const toneByType: Record<ToastType, AlertTone> = {
  success: 'success',
  error: 'danger',
  warning: 'caution',
  info: 'info',
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration: number = DEFAULT_DURATION) => {
      const id = `toast-${++toastId}`;
      setToasts((current) => [...current, { id, type, message, duration }].slice(-MAX_TOASTS));
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Auto-dismiss timer that pauses while the pointer or keyboard focus is on
 * the toast (WCAG 2.2.1), so a message can always be read or acted on.
 */
function useDismissTimer(duration: number, onExpire: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  const pause = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    remaining.current -= Date.now() - startedAt.current;
  }, []);

  const resume = useCallback(() => {
    if (duration <= 0 || timer.current) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(onExpire, Math.max(remaining.current, 0));
  }, [duration, onExpire]);

  useEffect(() => {
    resume();
    return pause;
  }, [resume, pause]);

  return { pause, resume };
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const t = useTranslations('ui');
  const expire = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);
  const { pause, resume } = useDismissTimer(toast.duration, expire);

  return (
    <div
      className="pointer-events-auto w-full motion-safe:animate-rise"
      data-testid={`toast-${toast.type}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <Alert
        tone={toneByType[toast.type]}
        // A failed action is an error; the danger tone itself is reserved for hazards.
        tonePrefix={toast.type === 'error' ? t('tone.error') : undefined}
        onDismiss={expire}
        className="shadow-lift"
      >
        {toast.message}
      </Alert>
    </div>
  );
}

/** Stack at the top end corner; full width on phones. Mount once in the layout. */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:end-4 sm:w-96"
      data-testid="toast-container"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
