'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert } from './Alert';
import { Button } from './Button';

export interface ErrorBoundaryMessages {
  title: string;
  description: string;
  retry: string;
}

interface Props {
  children: ReactNode;
  /** Localised copy for the default fallback — resolved by the (server) layout. */
  messages: ErrorBoundaryMessages;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches render errors below it and offers a retry; class component by React's design. */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console (can be replaced with error reporting service later)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, retry } = this.props.messages;

      return (
        <div className="mx-auto max-w-lg p-6" data-testid="error-boundary-fallback">
          <Alert
            tone="danger"
            emphasis="strong"
            title={title}
            actions={
              <Button
                variant="danger"
                size="sm"
                onClick={this.handleReset}
                data-testid="error-boundary-reset"
              >
                {retry}
              </Button>
            }
          >
            <p>{description}</p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre className="mt-2 max-w-full overflow-auto rounded-control bg-surface p-3 text-xs text-ink">
                {this.state.error.message}
              </pre>
            )}
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
