import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, cardClassName } from './Card';

describe('Card', () => {
  it('renders a surface card by default', () => {
    render(<Card data-testid="card">Body</Card>);
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card.className).toContain('rounded-card');
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('p-6');
  });

  it('renders as another semantic element', () => {
    render(
      <ul>
        <Card as="li" tone="sunken" padding="sm" data-testid="card">
          Item
        </Card>
      </ul>,
    );
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('LI');
    expect(card.className).toContain('bg-surface-sunken');
    expect(card.className).toContain('p-4');
  });

  it('adds the lift for interactive cards', () => {
    expect(cardClassName({ interactive: true })).toContain('hover:shadow-lift');
    expect(cardClassName()).not.toContain('hover:shadow-lift');
  });
});
