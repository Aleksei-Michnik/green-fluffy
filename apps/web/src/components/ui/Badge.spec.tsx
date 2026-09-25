import { render, screen } from '@testing-library/react';
import { Leaf } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders neutral text by default', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('bg-surface-sunken');
    expect(badge.className).toContain('rounded-full');
  });

  it.each([
    ['primary', 'bg-primary-soft'],
    ['accent', 'bg-accent-soft'],
    ['info', 'bg-info-soft'],
    ['success', 'bg-success-soft'],
    ['caution', 'bg-caution-soft'],
    ['danger', 'bg-danger-soft'],
  ] as const)('tones %s', (tone, expected) => {
    render(<Badge tone={tone}>x</Badge>);
    expect(screen.getByText('x').className).toContain(expected);
  });

  it('keeps the icon decorative and the text as the name', () => {
    render(<Badge icon={<Leaf data-testid="icon" />}>Plant</Badge>);
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Plant')).toHaveTextContent('Plant');
  });
});
