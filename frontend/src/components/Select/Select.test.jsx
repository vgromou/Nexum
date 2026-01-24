import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from './Select';

const defaultOptions = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
    { value: 3, label: 'Option 3' },
];

const optionsWithDisabled = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2', disabled: true },
    { value: 3, label: 'Option 3' },
];

describe('Select', () => {
    describe('Rendering', () => {
        it('renders with placeholder', () => {
            render(<Select options={defaultOptions} placeholder="Select an option" />);
            expect(screen.getByText('Select an option')).toBeInTheDocument();
        });

        it('renders with label', () => {
            render(<Select options={defaultOptions} label="Choose one" />);
            expect(screen.getByText('Choose one')).toBeInTheDocument();
        });

        it('renders required indicator', () => {
            render(<Select options={defaultOptions} label="Required field" required />);
            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('renders selected value', () => {
            render(<Select options={defaultOptions} value={2} />);
            expect(screen.getByText('Option 2')).toBeInTheDocument();
        });

        it('renders helper text', () => {
            render(<Select options={defaultOptions} helper="Select your preference" />);
            expect(screen.getByText('Select your preference')).toBeInTheDocument();
        });

        it('renders error message', () => {
            render(<Select options={defaultOptions} error="This field is required" />);
            expect(screen.getByText('This field is required')).toBeInTheDocument();
        });

        it('error takes precedence over helper', () => {
            render(<Select options={defaultOptions} error="Error" helper="Helper" />);
            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.queryByText('Helper')).not.toBeInTheDocument();
        });
    });

    describe('Dropdown behavior', () => {
        it('opens dropdown on click', async () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            fireEvent.click(trigger);

            expect(screen.getByRole('listbox')).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
        });

        it('closes dropdown on outside click', async () => {
            render(
                <div>
                    <Select options={defaultOptions} />
                    <button>Outside</button>
                </div>
            );
            const trigger = screen.getByRole('combobox');

            fireEvent.click(trigger);
            expect(screen.getByRole('listbox')).toBeInTheDocument();

            fireEvent.mouseDown(screen.getByText('Outside'));
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('opens dropdown with Enter key', () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            trigger.focus();
            fireEvent.keyDown(trigger, { key: 'Enter' });

            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        it('opens dropdown with Space key', () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            trigger.focus();
            fireEvent.keyDown(trigger, { key: ' ' });

            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        it('opens dropdown with ArrowDown key', () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            trigger.focus();
            fireEvent.keyDown(trigger, { key: 'ArrowDown' });

            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        it('closes dropdown with Escape key', () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            fireEvent.click(trigger);
            expect(screen.getByRole('listbox')).toBeInTheDocument();

            fireEvent.keyDown(trigger, { key: 'Escape' });
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
    });

    describe('Single select', () => {
        it('selects option on click', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.click(screen.getByRole('option', { name: 'Option 2' }));

            expect(onChange).toHaveBeenCalledWith(2);
        });

        it('closes dropdown after selection', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.click(screen.getByRole('option', { name: 'Option 1' }));

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('shows selected option with checkmark', () => {
            render(<Select options={defaultOptions} value={2} />);

            fireEvent.click(screen.getByRole('combobox'));

            const selectedOption = screen.getByRole('option', { name: 'Option 2' });
            expect(selectedOption).toHaveAttribute('aria-selected', 'true');
        });

        it('selects option with Enter key', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            const option = screen.getByRole('option', { name: 'Option 1' });
            fireEvent.keyDown(option, { key: 'Enter' });

            expect(onChange).toHaveBeenCalledWith(1);
        });
    });

    describe('Multi-select', () => {
        it('allows multiple selections', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} multiple value={[1]} onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.click(screen.getByRole('option', { name: 'Option 2' }));

            expect(onChange).toHaveBeenCalledWith([1, 2]);
        });

        it('removes selection on second click', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} multiple value={[1, 2]} onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.click(screen.getByRole('option', { name: 'Option 2' }));

            expect(onChange).toHaveBeenCalledWith([1]);
        });

        it('does not close dropdown after selection', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} multiple onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.click(screen.getByRole('option', { name: 'Option 1' }));

            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        it('displays selected values as tags', () => {
            render(<Select options={defaultOptions} multiple value={[1, 2]} />);

            expect(screen.getByText('Option 1')).toBeInTheDocument();
            expect(screen.getByText('Option 2')).toBeInTheDocument();
        });

        it('removes tag on click', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} multiple value={[1, 2]} onChange={onChange} />);

            const removeButtons = screen.getAllByLabelText(/Remove Option/);
            fireEvent.click(removeButtons[0]);

            expect(onChange).toHaveBeenCalledWith([2]);
        });

        it('sets aria-multiselectable on menu', () => {
            render(<Select options={defaultOptions} multiple />);

            fireEvent.click(screen.getByRole('combobox'));

            expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
        });
    });

    describe('Disabled state', () => {
        it('prevents opening when disabled', () => {
            render(<Select options={defaultOptions} disabled />);

            fireEvent.click(screen.getByRole('combobox'));

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('has correct aria-disabled attribute', () => {
            render(<Select options={defaultOptions} disabled />);

            expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
        });

        it('prevents tag removal when disabled', () => {
            render(<Select options={defaultOptions} multiple value={[1]} disabled />);

            // Tags should not have remove buttons when disabled
            expect(screen.queryByLabelText(/Remove Option/)).not.toBeInTheDocument();
        });
    });

    describe('Disabled options', () => {
        it('prevents selection of disabled option', () => {
            const onChange = vi.fn();
            render(<Select options={optionsWithDisabled} onChange={onChange} />);

            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.click(screen.getByRole('option', { name: 'Option 2' }));

            expect(onChange).not.toHaveBeenCalled();
        });

        it('has correct aria-disabled attribute on disabled option', () => {
            render(<Select options={optionsWithDisabled} />);

            fireEvent.click(screen.getByRole('combobox'));

            expect(screen.getByRole('option', { name: 'Option 2' })).toHaveAttribute('aria-disabled', 'true');
        });
    });

    describe('Searchable', () => {
        it('shows search input when open (searchable by default)', () => {
            render(<Select options={defaultOptions} />);

            fireEvent.click(screen.getByRole('combobox'));

            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('filters options based on search query', async () => {
            render(<Select options={defaultOptions} />);

            fireEvent.click(screen.getByRole('combobox'));
            const searchInput = screen.getByRole('textbox');

            await userEvent.type(searchInput, 'Option 1');

            expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
            expect(screen.queryByRole('option', { name: 'Option 2' })).not.toBeInTheDocument();
        });

        it('shows no options message when no matches', async () => {
            render(<Select options={defaultOptions} />);

            fireEvent.click(screen.getByRole('combobox'));
            const searchInput = screen.getByRole('textbox');

            await userEvent.type(searchInput, 'xyz');

            expect(screen.getByText('No options')).toBeInTheDocument();
        });

        it('clears search on close', async () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            fireEvent.click(trigger);
            const searchInput = screen.getByRole('textbox');
            await userEvent.type(searchInput, 'test');

            fireEvent.keyDown(trigger, { key: 'Escape' });

            fireEvent.click(trigger);
            expect(screen.getByRole('textbox')).toHaveValue('');
        });
    });

    describe('Clearable', () => {
        it('shows clear button when value is selected', () => {
            render(<Select options={defaultOptions} value={1} clearable />);

            expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
        });

        it('does not show clear button when no value', () => {
            render(<Select options={defaultOptions} clearable />);

            expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument();
        });

        it('clears single value on click', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} value={1} clearable onChange={onChange} />);

            fireEvent.click(screen.getByLabelText('Clear selection'));

            expect(onChange).toHaveBeenCalledWith(null);
        });

        it('clears all values in multi-select', () => {
            const onChange = vi.fn();
            render(<Select options={defaultOptions} multiple value={[1, 2]} clearable onChange={onChange} />);

            fireEvent.click(screen.getByLabelText('Clear selection'));

            expect(onChange).toHaveBeenCalledWith([]);
        });

        it('does not show clear button when disabled', () => {
            render(<Select options={defaultOptions} value={1} clearable disabled />);

            expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument();
        });
    });

    describe('Error state', () => {
        it('has correct container class', () => {
            const { container } = render(<Select options={defaultOptions} error="Error" />);

            expect(container.querySelector('.select--error')).toBeInTheDocument();
        });

        it('displays error with role="alert"', () => {
            render(<Select options={defaultOptions} error="Error message" />);

            expect(screen.getByRole('alert')).toHaveTextContent('Error message');
        });
    });

    describe('Accessibility', () => {
        it('has combobox role on trigger', () => {
            render(<Select options={defaultOptions} />);

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        it('has listbox role on menu', () => {
            render(<Select options={defaultOptions} />);

            fireEvent.click(screen.getByRole('combobox'));

            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        it('has option role on each option', () => {
            render(<Select options={defaultOptions} />);

            fireEvent.click(screen.getByRole('combobox'));

            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(3);
        });

        it('sets aria-expanded correctly', () => {
            render(<Select options={defaultOptions} />);
            const trigger = screen.getByRole('combobox');

            expect(trigger).toHaveAttribute('aria-expanded', 'false');

            fireEvent.click(trigger);
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
        });

        it('sets aria-haspopup on trigger', () => {
            render(<Select options={defaultOptions} />);

            expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox');
        });
    });

    describe('Custom classes', () => {
        it('applies custom className to container', () => {
            const { container } = render(<Select options={defaultOptions} className="custom-select" />);

            expect(container.querySelector('.select.custom-select')).toBeInTheDocument();
        });

        it('applies custom menuClassName to menu', () => {
            const { container } = render(<Select options={defaultOptions} menuClassName="custom-menu" />);

            fireEvent.click(screen.getByRole('combobox'));

            expect(container.querySelector('.select__menu.custom-menu')).toBeInTheDocument();
        });
    });

    describe('Ref forwarding', () => {
        it('forwards ref to trigger element', () => {
            const ref = React.createRef();
            render(<Select ref={ref} options={defaultOptions} />);

            expect(ref.current).toBeInstanceOf(HTMLElement);
            expect(ref.current).toHaveClass('select__trigger');
        });
    });
});
