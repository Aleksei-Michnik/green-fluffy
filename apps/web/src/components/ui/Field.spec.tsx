import { screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';
import { Textarea } from './Textarea';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithIntl } from '@/test/render';

describe('Field', () => {
  it('labels the control through a shared id', () => {
    renderWithIntl(
      <Field label="Name">
        <Input name="name" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('id');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('describes the control with the hint', () => {
    renderWithIntl(
      <Field label="Name" hint="What everyone calls them.">
        <Input name="name" />
      </Field>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('What everyone calls them.');
  });

  it('announces the error, marks the control invalid and keeps the hint', () => {
    renderWithIntl(
      <Field label="Email" hint="We never share it." error="Enter a valid email.">
        <Input name="email" type="email" />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid email.');
    expect(input.className).toContain('aria-invalid:border-danger');
  });

  it('marks required fields on the control and visually', () => {
    renderWithIntl(
      <Field label="Name" required>
        <Input name="name" />
      </Field>,
    );
    expect(screen.getByRole('textbox')).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the localised optional marker', () => {
    renderWithIntl(
      <Field label="Nickname" optional>
        <Input name="nickname" />
      </Field>,
      { locale: 'he' },
    );
    expect(screen.getByText('(לא חובה)')).toBeInTheDocument();
  });

  it('honours an explicit id and the control’s own describedby', () => {
    renderWithIntl(
      <>
        <p id="extra">Extra</p>
        <Field label="Name" id="pet-name" hint="Hint">
          <Input name="name" aria-describedby="extra" />
        </Field>
      </>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'pet-name');
    expect(input).toHaveAttribute('aria-describedby', 'pet-name-hint extra');
  });

  it('wires Textarea and Select the same way', () => {
    renderWithIntl(
      <>
        <Field label="Notes" hint="Optional notes">
          <Textarea name="notes" />
        </Field>
        <Field label="Placement" error="Pick one">
          <Select name="placement" defaultValue="">
            <option value="">Choose</option>
            <option value="indoor">Indoor</option>
          </Select>
        </Field>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription(
      'Optional notes',
    );
    const select = screen.getByRole('combobox', { name: 'Placement' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Pick one');
  });

  it('renders Input adornments as decoration', () => {
    renderWithIntl(<Input name="q" startAdornment={<Search data-testid="icon" />} />);
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('textbox').className).toContain('ps-11');
  });

  it('gives a standalone Input its own id', () => {
    renderWithIntl(<Input name="solo" aria-label="Solo" />);
    expect(screen.getByRole('textbox', { name: 'Solo' })).toHaveAttribute('id');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <form>
        <Field label="Name" hint="Hint" required>
          <Input name="name" />
        </Field>
        <Field label="Email" error="Wrong">
          <Input name="email" />
        </Field>
        <Field label="Notes" optional>
          <Textarea name="notes" />
        </Field>
        <Field label="Placement">
          <Select name="placement">
            <option value="indoor">Indoor</option>
          </Select>
        </Field>
      </form>,
    );
    await expectNoA11yViolations(container);
  });
});
