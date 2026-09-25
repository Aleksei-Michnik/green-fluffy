import { render, screen } from '@testing-library/react';
import { Flower2 } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';
import { expectNoA11yViolations } from '@/test/a11y';

describe('EmptyState', () => {
  it('renders title, description, icon and action', () => {
    render(
      <EmptyState
        icon={<Flower2 data-testid="icon" />}
        title="No plants yet"
        description="Add the first one."
        action={<button type="button">Add a plant</button>}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'No plants yet' })).toBeInTheDocument();
    expect(screen.getByText('Add the first one.')).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Add a plant' })).toBeInTheDocument();
  });

  it('fits the outline with a level-3 heading', () => {
    render(<EmptyState title="Empty" headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Empty');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <main>
        <h1>Page</h1>
        <EmptyState title="Empty" description="Nothing here." />
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
