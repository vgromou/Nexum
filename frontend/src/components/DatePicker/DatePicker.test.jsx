import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
    const mockDate = new Date(2026, 0, 15); // January 15, 2026

    describe('Rendering', () => {
        it('renders with placeholder', () => {
            render(<DatePicker placeholder="Select date" />);
            expect(screen.getByPlaceholderText('Select date')).toBeInTheDocument();
        });

        it('renders with label', () => {
            render(<DatePicker label="Date" />);
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        it('renders required indicator', () => {
            render(<DatePicker label="Date" required />);
            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('renders with value', () => {
            render(<DatePicker value={mockDate} />);
            expect(screen.getByDisplayValue('15.01.2026')).toBeInTheDocument();
        });

        it('renders helper text', () => {
            render(<DatePicker helper="Select a date" />);
            expect(screen.getByText('Select a date')).toBeInTheDocument();
        });

        it('renders error message', () => {
            render(<DatePicker error="Date is required" />);
            expect(screen.getByText('Date is required')).toBeInTheDocument();
        });

        it('error takes precedence over helper', () => {
            render(<DatePicker error="Error" helper="Helper" />);
            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.queryByText('Helper')).not.toBeInTheDocument();
        });
    });

    describe('Dropdown behavior', () => {
        it('opens dropdown on trigger click', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            expect(screen.getByText('January, 2026')).toBeInTheDocument();
        });

        it('closes dropdown on outside click', () => {
            render(
                <div>
                    <DatePicker />
                    <button>Outside</button>
                </div>
            );

            fireEvent.click(screen.getAllByRole('button')[0]);
            expect(screen.getByText(/January|February|March/)).toBeInTheDocument();

            fireEvent.mouseDown(screen.getByText('Outside'));
            expect(screen.queryByText(/January, \d{4}/)).not.toBeInTheDocument();
        });

        it('does not open when disabled', () => {
            render(<DatePicker disabled />);
            fireEvent.click(screen.getByRole('button'));

            expect(screen.queryByText(/January, \d{4}/)).not.toBeInTheDocument();
        });
    });

    describe('Day selection', () => {
        it('calls onChange when day is clicked', () => {
            const onChange = vi.fn();
            render(<DatePicker onChange={onChange} />);

            fireEvent.click(screen.getByRole('button'));
            fireEvent.click(screen.getByText('20'));

            expect(onChange).toHaveBeenCalled();
            const selectedDate = onChange.mock.calls[0][0];
            expect(selectedDate.getDate()).toBe(20);
        });

        it('keeps dropdown open after selection', () => {
            render(<DatePicker />);

            fireEvent.click(screen.getByRole('button'));
            fireEvent.click(screen.getByText('15'));

            expect(screen.getByText(/January, \d{4}/)).toBeInTheDocument();
        });

        it('highlights today', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            const today = new Date().getDate();
            const todayButton = screen.getByText(String(today));
            expect(todayButton).toHaveClass('datepicker__day--today');
        });

        it('highlights selected date', () => {
            render(<DatePicker value={mockDate} />);
            fireEvent.click(screen.getByRole('button'));

            const selectedButton = screen.getByText('15');
            expect(selectedButton).toHaveClass('datepicker__day--selected');
        });
    });

    describe('Navigation', () => {
        it('navigates to previous month', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            fireEvent.click(screen.getByLabelText('Previous'));

            expect(screen.getByText(/December, 2025/)).toBeInTheDocument();
        });

        it('navigates to next month', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            fireEvent.click(screen.getByLabelText('Next'));

            expect(screen.getByText(/February, 2026/)).toBeInTheDocument();
        });
    });

    describe('Month view', () => {
        it('switches to month view when title is clicked', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            fireEvent.click(screen.getByText(/January, 2026/));

            expect(screen.getByText('Jan')).toBeInTheDocument();
            expect(screen.getByText('Feb')).toBeInTheDocument();
            expect(screen.getByText('Dec')).toBeInTheDocument();
        });

        it('selects month and returns to days view', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));
            fireEvent.click(screen.getByText(/January, 2026/));

            fireEvent.click(screen.getByText('Mar'));

            expect(screen.getByText('March, 2026')).toBeInTheDocument();
        });
    });

    describe('Year view', () => {
        it('switches to year view from month view', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));
            fireEvent.click(screen.getByText(/January, 2026/));

            fireEvent.click(screen.getByText('2026'));

            // Years grid shows decade: 2016-2027
            expect(screen.getByText('2016')).toBeInTheDocument();
            expect(screen.getByText('2027')).toBeInTheDocument();
        });

        it('selects year and returns to months view', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));
            fireEvent.click(screen.getByText(/January, 2026/));
            fireEvent.click(screen.getByText('2026'));

            fireEvent.click(screen.getByText('2024'));

            expect(screen.getByText('2024')).toBeInTheDocument();
            expect(screen.getByText('Jan')).toBeInTheDocument();
        });
    });

    describe('Range selection', () => {
        it('renders range mode with two placeholders', () => {
            render(<DatePicker isRange placeholder="DD.MM.YYYY" />);

            const placeholders = screen.getAllByText('DD.MM.YYYY');
            expect(placeholders).toHaveLength(2);
        });

        it('renders range with start and end dates', () => {
            const start = new Date(2026, 0, 10);
            const end = new Date(2026, 0, 20);
            render(<DatePicker isRange rangeStart={start} rangeEnd={end} />);

            expect(screen.getByText('10.01.2026')).toBeInTheDocument();
            expect(screen.getByText('20.01.2026')).toBeInTheDocument();
        });

        it('calls onRangeChange when selecting dates', () => {
            const onRangeChange = vi.fn();
            render(<DatePicker isRange onRangeChange={onRangeChange} />);

            fireEvent.click(screen.getByRole('button'));
            fireEvent.click(screen.getByText('10'));

            expect(onRangeChange).toHaveBeenCalled();
        });

        it('highlights range between start and end', () => {
            const start = new Date(2026, 0, 10);
            const end = new Date(2026, 0, 15);
            render(<DatePicker isRange rangeStart={start} rangeEnd={end} />);

            fireEvent.click(screen.getByRole('button'));

            expect(screen.getByText('10')).toHaveClass('datepicker__day--range-start');
            expect(screen.getByText('15')).toHaveClass('datepicker__day--range-end');
            expect(screen.getByText('12')).toHaveClass('datepicker__day--in-range');
        });

        it('has range-single class when only start is selected', () => {
            const start = new Date(2026, 0, 10);
            render(<DatePicker isRange rangeStart={start} rangeEnd={null} />);

            fireEvent.click(screen.getByRole('button'));

            expect(screen.getByText('10')).toHaveClass('datepicker__day--range-start');
            expect(screen.getByText('10')).toHaveClass('datepicker__day--range-single');
        });

        it('has range-single class when start and end are same date', () => {
            const date = new Date(2026, 0, 10);
            render(<DatePicker isRange rangeStart={date} rangeEnd={date} />);

            fireEvent.click(screen.getByRole('button'));

            const day10 = screen.getByText('10');
            expect(day10).toHaveClass('datepicker__day--range-start');
            expect(day10).toHaveClass('datepicker__day--range-end');
            expect(day10).toHaveClass('datepicker__day--range-single');
        });

        it('does not have range-single class when start and end are different', () => {
            const start = new Date(2026, 0, 10);
            const end = new Date(2026, 0, 15);
            render(<DatePicker isRange rangeStart={start} rangeEnd={end} />);

            fireEvent.click(screen.getByRole('button'));

            expect(screen.getByText('10')).toHaveClass('datepicker__day--range-start');
            expect(screen.getByText('10')).not.toHaveClass('datepicker__day--range-single');
        });
    });

    describe('Date constraints', () => {
        it('disables dates before minDate', () => {
            const minDate = new Date(2026, 0, 10);
            render(<DatePicker minDate={minDate} />);

            fireEvent.click(screen.getByRole('button'));

            // Find the disabled day button (not the other-month div)
            const day5Button = screen.getAllByText('5').find(el => el.tagName === 'BUTTON');
            expect(day5Button).toHaveClass('datepicker__day--disabled');
            expect(day5Button).toBeDisabled();
        });

        it('disables dates after maxDate', () => {
            const maxDate = new Date(2026, 0, 20);
            render(<DatePicker maxDate={maxDate} />);

            fireEvent.click(screen.getByRole('button'));

            expect(screen.getByText('25')).toHaveClass('datepicker__day--disabled');
            expect(screen.getByText('25')).toBeDisabled();
        });
    });

    describe('Input handling', () => {
        it('updates value when typing valid date', () => {
            const onChange = vi.fn();
            render(<DatePicker onChange={onChange} />);

            const input = screen.getByPlaceholderText('DD.MM.YYYY');
            fireEvent.change(input, { target: { value: '25.12.2026' } });

            expect(onChange).toHaveBeenCalled();
            const selectedDate = onChange.mock.calls[0][0];
            expect(selectedDate.getDate()).toBe(25);
            expect(selectedDate.getMonth()).toBe(11);
            expect(selectedDate.getFullYear()).toBe(2026);
        });
    });

    describe('Custom format', () => {
        it('displays date in custom format', () => {
            const date = new Date(2026, 11, 25);
            render(<DatePicker value={date} format="MM/DD/YYYY" />);

            expect(screen.getByDisplayValue('12/25/2026')).toBeInTheDocument();
        });
    });

    describe('Error state', () => {
        it('has error class when error prop is set', () => {
            const { container } = render(<DatePicker error="Error" />);

            expect(container.querySelector('.datepicker--error')).toBeInTheDocument();
        });

        it('displays error with role="alert"', () => {
            render(<DatePicker error="Error message" />);

            expect(screen.getByRole('alert')).toHaveTextContent('Error message');
        });
    });

    describe('Disabled state', () => {
        it('has disabled class', () => {
            const { container } = render(<DatePicker disabled />);

            expect(container.querySelector('.datepicker--disabled')).toBeInTheDocument();
        });

        it('disables input when disabled', () => {
            render(<DatePicker disabled />);

            expect(screen.getByPlaceholderText('DD.MM.YYYY')).toBeDisabled();
        });
    });

    describe('Other month days', () => {
        it('displays days from previous month with other-month class', () => {
            // January 2026 starts on Thursday, so Monday-Wednesday show December days
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            // December 29, 30, 31 should be visible as other-month days
            const otherMonthDays = document.querySelectorAll('.datepicker__day--other-month');
            expect(otherMonthDays.length).toBeGreaterThan(0);
        });

        it('displays days from next month with other-month class', () => {
            render(<DatePicker />);
            fireEvent.click(screen.getByRole('button'));

            // Grid has 42 cells (6 rows x 7), so there will be next month days
            const allDays = document.querySelectorAll('.datepicker__day');
            const otherMonthDays = document.querySelectorAll('.datepicker__day--other-month');
            expect(otherMonthDays.length).toBeGreaterThan(0);
            expect(allDays.length).toBe(42);
        });

        it('highlights other-month days in range', () => {
            // Range spanning from late December to mid January
            const start = new Date(2025, 11, 29); // Dec 29, 2025
            const end = new Date(2026, 0, 10); // Jan 10, 2026
            render(<DatePicker isRange rangeStart={start} rangeEnd={end} />);

            fireEvent.click(screen.getByRole('button'));

            // December 29 should be other-month and range-start
            const dec29Elements = screen.getAllByText('29');
            const otherMonthDec29 = dec29Elements.find(el =>
                el.classList.contains('datepicker__day--other-month')
            );
            expect(otherMonthDec29).toHaveClass('datepicker__day--range-start');
        });

        it('highlights other-month days in-range', () => {
            // Range spanning from late December to mid January
            const start = new Date(2025, 11, 29); // Dec 29, 2025
            const end = new Date(2026, 0, 10); // Jan 10, 2026
            render(<DatePicker isRange rangeStart={start} rangeEnd={end} />);

            fireEvent.click(screen.getByRole('button'));

            // December 30 and 31 should be other-month and in-range
            const dec30Elements = screen.getAllByText('30');
            const otherMonthDec30 = dec30Elements.find(el =>
                el.classList.contains('datepicker__day--other-month')
            );
            expect(otherMonthDec30).toHaveClass('datepicker__day--in-range');
        });
    });
});
