import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('ThemeToggle', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    localStorage.clear();
  });

  it('renders a labelled icon button offering the other theme', () => {
    document.documentElement.dataset.theme = 'light';
    renderWithIntl(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBe(
      screen.getByTestId('theme-toggle'),
    );
  });

  it('switches to dark, persists, and relabels', () => {
    document.documentElement.dataset.theme = 'light';
    renderWithIntl(<ThemeToggle />);
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('switches back to light on second click', () => {
    document.documentElement.dataset.theme = 'light';
    renderWithIntl(<ThemeToggle />);
    const button = screen.getByTestId('theme-toggle');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('is labelled in Hebrew', () => {
    renderWithIntl(<ThemeToggle />, { locale: 'he' });
    expect(screen.getByRole('button', { name: 'מעבר לערכת נושא כהה' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(<ThemeToggle />);
    await expectNoA11yViolations(container);
  });
});
