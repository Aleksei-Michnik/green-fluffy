import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Footer } from './Footer';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, _params?: Record<string, unknown>) => key,
}));

describe('Footer', () => {
  it('renders the footer element', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText('copyright')).toBeInTheDocument();
  });
});
