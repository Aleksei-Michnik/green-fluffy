import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { renderWithIntl } from '@/test/render';

const messages = {
  title: 'Something went wrong',
  description: 'An unexpected error occurred. Please try again.',
  retry: 'Try again',
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    renderWithIntl(
      <ErrorBoundary messages={messages}>
        <p>Fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Fine')).toBeInTheDocument();
  });

  it('shows the localised fallback and recovers on retry', () => {
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) throw new Error('boom');
      return <p>Recovered</p>;
    }
    renderWithIntl(
      <ErrorBoundary messages={messages}>
        <Flaky />
      </ErrorBoundary>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).toHaveTextContent('boom');
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('renders a custom fallback', () => {
    function Boom(): never {
      throw new Error('boom');
    }
    renderWithIntl(
      <ErrorBoundary messages={messages} fallback={<p>Custom</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
