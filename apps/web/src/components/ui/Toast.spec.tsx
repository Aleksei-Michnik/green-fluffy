import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastContainer, ToastProvider, useToast } from './Toast';
import { renderWithIntl } from '@/test/render';

function Trigger() {
  const { addToast, removeToast, toasts } = useToast();
  return (
    <div>
      <button onClick={() => addToast('success', 'Success message')}>Add Success</button>
      <button onClick={() => addToast('error', 'Error message')}>Add Error</button>
      <button onClick={() => addToast('warning', 'Warning message')}>Add Warning</button>
      <button onClick={() => addToast('info', 'Info message')}>Add Info</button>
      <button onClick={() => addToast('success', 'Quick toast', 100)}>Add Quick</button>
      <button onClick={() => addToast('info', 'Sticky toast', 0)}>Add Sticky</button>
      {toasts.length > 0 && <button onClick={() => removeToast(toasts[0].id)}>Remove First</button>}
      <span data-testid="toast-count">{toasts.length}</span>
    </div>
  );
}

function renderToasts(locale: 'en' | 'he' = 'en') {
  return renderWithIntl(
    <ToastProvider>
      <Trigger />
      <ToastContainer />
    </ToastProvider>,
    { locale },
  );
}

const click = (name: string) => act(() => screen.getByText(name).click());

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty with the container mounted', () => {
    renderToasts();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    expect(screen.getByTestId('toast-container')).toBeEmptyDOMElement();
  });

  it.each([
    ['Add Success', 'toast-success', 'status', 'Success: Success message'],
    ['Add Warning', 'toast-warning', 'status', 'Warning: Warning message'],
    ['Add Info', 'toast-info', 'status', 'Information: Info message'],
    ['Add Error', 'toast-error', 'alert', 'Error: Error message'],
  ])('%s renders with the right role and prefix', (trigger, testId, role, text) => {
    renderToasts();
    click(trigger);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.getByRole(role)).toHaveTextContent(text);
  });

  it('auto-dismisses after its duration', () => {
    renderToasts();
    click('Add Quick');
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('pauses the timer while hovered and resumes afterwards', () => {
    renderToasts();
    click('Add Quick');
    const toast = screen.getByTestId('toast-success');
    act(() => {
      vi.advanceTimersByTime(60);
    });
    fireEvent.mouseEnter(toast);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    fireEvent.mouseLeave(toast);
    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('keeps a sticky toast until dismissed', () => {
    renderToasts();
    click('Add Sticky');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    act(() => screen.getByRole('button', { name: 'Dismiss' }).click());
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('localises the dismiss button', () => {
    renderToasts('he');
    click('Add Success');
    expect(screen.getByRole('button', { name: 'סגירת ההודעה' })).toBeInTheDocument();
  });

  it('stacks and caps at five', () => {
    renderToasts();
    for (let i = 0; i < 7; i++) click('Add Success');
    expect(screen.getByTestId('toast-count')).toHaveTextContent('5');
    expect(screen.getAllByRole('status')).toHaveLength(5);
  });

  it('removes a toast programmatically', () => {
    renderToasts();
    click('Add Success');
    click('Add Error');
    click('Remove First');
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('throws when useToast is used outside ToastProvider', () => {
    function BadConsumer() {
      try {
        useToast();
        return <div>no error</div>;
      } catch (err) {
        return <div data-testid="error">{(err as Error).message}</div>;
      }
    }
    renderWithIntl(<BadConsumer />);
    expect(screen.getByTestId('error')).toHaveTextContent(
      'useToast must be used within a ToastProvider',
    );
  });
});
