import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Field from './Field';
import { Search, Calendar } from 'lucide-react';

describe('Field', () => {
    describe('Rendering', () => {
        it('renders basic input with placeholder', () => {
            render(<Field placeholder="Enter text" />);
            expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
        });

        it('renders with label', () => {
            render(<Field label="Email" placeholder="Enter email" name="email" />);
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
        });

        it('renders with error message', () => {
            render(<Field label="Password" error="Password is required" name="password" />);
            expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
        });

        it('renders with helper text', () => {
            render(<Field label="Username" helper="Must be at least 3 characters" name="username" />);
            expect(screen.getByText('Must be at least 3 characters')).toBeInTheDocument();
        });

        it('shows error instead of helper when both provided', () => {
            render(
                <Field
                    label="Email"
                    helper="Enter your email"
                    error="Invalid email"
                    name="email"
                />
            );
            expect(screen.getByText('Invalid email')).toBeInTheDocument();
            expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
        });

        it('renders required indicator when required', () => {
            render(<Field label="Email" required name="email" />);
            expect(screen.getByText('*')).toBeInTheDocument();
        });
    });

    describe('States', () => {
        it('applies error class when error is provided', () => {
            render(<Field error="Error message" name="test" />);
            const container = screen.getByRole('textbox').closest('.field');
            expect(container).toHaveClass('field--error');
        });

        it('applies disabled class when disabled', () => {
            render(<Field disabled name="test" />);
            const container = screen.getByRole('textbox').closest('.field');
            expect(container).toHaveClass('field--disabled');
            expect(screen.getByRole('textbox')).toBeDisabled();
        });
    });

    describe('Input Types', () => {
        it.each([
            ['text', 'textbox'],
            ['email', 'textbox'],
            ['password', null],
            ['number', 'spinbutton'],
            ['tel', 'textbox'],
            ['url', 'textbox'],
            ['search', 'searchbox'],
        ])('renders input with type="%s"', (type, role) => {
            const { container } = render(<Field type={type} name="test" />);
            const input = container.querySelector(`input[type="${type}"]`);
            expect(input).toHaveAttribute('type', type);
        });
    });

    describe('Controlled Input', () => {
        it('works as controlled input', async () => {
            const user = userEvent.setup();
            const handleChange = vi.fn();
            render(
                <Field
                    value="initial"
                    onChange={handleChange}
                    name="test"
                />
            );

            const input = screen.getByRole('textbox');
            expect(input).toHaveValue('initial');

            await user.type(input, 'a');
            expect(handleChange).toHaveBeenCalled();
        });

        it('works as uncontrolled input with defaultValue', () => {
            render(<Field defaultValue="default text" name="test" />);
            expect(screen.getByRole('textbox')).toHaveValue('default text');
        });
    });

    describe('Events', () => {
        it('calls onChange when typing', async () => {
            const user = userEvent.setup();
            const handleChange = vi.fn();
            render(<Field onChange={handleChange} name="test" />);

            await user.type(screen.getByRole('textbox'), 'hello');
            expect(handleChange).toHaveBeenCalledTimes(5);
        });

        it('calls onFocus when focused', async () => {
            const user = userEvent.setup();
            const handleFocus = vi.fn();
            render(<Field onFocus={handleFocus} name="test" />);

            await user.click(screen.getByRole('textbox'));
            expect(handleFocus).toHaveBeenCalledTimes(1);
        });

        it('calls onBlur when blurred', async () => {
            const user = userEvent.setup();
            const handleBlur = vi.fn();
            render(<Field onBlur={handleBlur} name="test" />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.tab();
            expect(handleBlur).toHaveBeenCalledTimes(1);
        });
    });

    describe('Icons', () => {
        it('renders with left icon', () => {
            render(
                <Field
                    leftIcon={<Search data-testid="left-icon" />}
                    placeholder="Search"
                    name="test"
                />
            );
            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        });

        it('renders with right icon', () => {
            render(
                <Field
                    rightIcon={<Calendar data-testid="right-icon" />}
                    placeholder="Select date"
                    name="test"
                />
            );
            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });

        it('renders with both icons', () => {
            render(
                <Field
                    leftIcon={<Search data-testid="left-icon" />}
                    rightIcon={<Calendar data-testid="right-icon" />}
                    placeholder="Search"
                    name="test"
                />
            );
            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });

        it('right icon becomes button when onRightIconClick provided', async () => {
            const user = userEvent.setup();
            const handleClick = vi.fn();
            render(
                <Field
                    rightIcon={<Calendar data-testid="right-icon" />}
                    onRightIconClick={handleClick}
                    name="test"
                />
            );

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            await user.click(button);
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Tags', () => {
        const sampleTags = [
            { id: 1, label: 'Tag 1' },
            { id: 2, label: 'Tag 2' },
            { id: 3, label: 'Tag 3' },
        ];

        it('renders tags', () => {
            render(<Field tags={sampleTags} />);
            expect(screen.getByText('Tag 1')).toBeInTheDocument();
            expect(screen.getByText('Tag 2')).toBeInTheDocument();
            expect(screen.getByText('Tag 3')).toBeInTheDocument();
        });

        it('renders remove buttons for tags when onTagRemove provided', () => {
            render(<Field tags={sampleTags} onTagRemove={() => {}} />);
            const removeButtons = screen.getAllByRole('button', { name: /remove/i });
            expect(removeButtons).toHaveLength(3);
        });

        it('calls onTagRemove with correct id when remove button clicked', async () => {
            const user = userEvent.setup();
            const handleRemove = vi.fn();
            render(<Field tags={sampleTags} onTagRemove={handleRemove} />);

            const removeButtons = screen.getAllByRole('button', { name: /remove/i });
            await user.click(removeButtons[1]);
            expect(handleRemove).toHaveBeenCalledWith(2);
        });

        it('does not render remove buttons when disabled', () => {
            render(<Field tags={sampleTags} onTagRemove={() => {}} disabled />);
            const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
            expect(removeButtons).toHaveLength(0);
        });

        it('renders tags with right icon', () => {
            render(
                <Field
                    tags={sampleTags}
                    rightIcon={<Calendar data-testid="right-icon" />}
                />
            );
            expect(screen.getByText('Tag 1')).toBeInTheDocument();
            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('associates label with input', () => {
            render(<Field label="Email" name="email" />);
            const input = screen.getByLabelText('Email');
            expect(input).toBeInTheDocument();
        });

        it('sets aria-invalid when error is present', () => {
            render(<Field error="Invalid" name="test" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
        });

        it('associates error message with aria-describedby', () => {
            render(<Field label="Test" error="Error message" id="test-field" />);
            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-describedby', 'test-field-error');
        });

        it('associates helper text with aria-describedby', () => {
            render(<Field label="Test" helper="Helper text" id="test-field" />);
            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-describedby', 'test-field-helper');
        });

        it('renders error with alert role', () => {
            render(<Field error="Error message" name="test" />);
            expect(screen.getByRole('alert')).toHaveTextContent('Error message');
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to input element', () => {
            const ref = { current: null };
            render(<Field ref={ref} name="test" />);
            expect(ref.current).toBeInstanceOf(HTMLInputElement);
        });

        it('allows focus via ref', () => {
            const ref = { current: null };
            render(<Field ref={ref} name="test" />);
            ref.current.focus();
            expect(document.activeElement).toBe(ref.current);
        });
    });

    describe('HTML Attributes', () => {
        it('sets autoComplete attribute', () => {
            render(<Field autoComplete="email" name="test" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
        });

        it('sets maxLength attribute', () => {
            render(<Field maxLength={10} name="test" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
        });

        it('sets minLength attribute', () => {
            render(<Field minLength={3} name="test" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '3');
        });

        it('sets pattern attribute', () => {
            render(<Field pattern="[A-Za-z]+" name="test" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[A-Za-z]+');
        });

        it('sets readOnly attribute', () => {
            render(<Field readOnly name="test" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
        });

        it('sets required attribute', () => {
            render(<Field required name="test" />);
            expect(screen.getByRole('textbox')).toBeRequired();
        });
    });

    describe('Custom Class Names', () => {
        it('applies custom className to container', () => {
            render(<Field className="custom-container" name="test" />);
            const container = screen.getByRole('textbox').closest('.field');
            expect(container).toHaveClass('field', 'custom-container');
        });

        it('applies custom inputClassName to input', () => {
            render(<Field inputClassName="custom-input" name="test" />);
            expect(screen.getByRole('textbox')).toHaveClass('field__input', 'custom-input');
        });
    });

    describe('Props Forwarding', () => {
        it('forwards additional props to input element', () => {
            render(<Field data-testid="custom-field" title="Tooltip" name="test" />);
            const input = screen.getByTestId('custom-field');
            expect(input).toHaveAttribute('title', 'Tooltip');
        });
    });

    describe('Custom Children', () => {
        it('renders custom children instead of input when provided with icons', () => {
            render(
                <Field rightIcon={<Calendar data-testid="icon" />}>
                    <span data-testid="custom-content">Custom content</span>
                </Field>
            );
            expect(screen.getByTestId('custom-content')).toBeInTheDocument();
            expect(screen.getByTestId('icon')).toBeInTheDocument();
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });
    });
});
