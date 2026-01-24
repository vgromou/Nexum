import React, { useState } from 'react';
import DatePicker from '../components/DatePicker/DatePicker';

export default {
    title: 'Components/DatePicker',
    component: DatePicker,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `A date picker component with calendar dropdown, month/year selection, and range support.

**Features:**
- Single date and date range selection
- Month and year picker views
- Navigation between months/years
- Today highlighting
- Min/max date constraints
- Custom date format
- Keyboard input support

**Figma Design Specs:**
- Day cell: square, md border-radius
- States: default, hover, today (red), selected (purple), in-range (light purple)
- Month/Year cells: same state patterns`,
            },
        },
    },
    argTypes: {
        label: { control: 'text' },
        placeholder: { control: 'text' },
        error: { control: 'text' },
        helper: { control: 'text' },
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        isRange: { control: 'boolean' },
    },
};

// ===== Basic DatePicker =====

export const Basic = {
    render: () => {
        const [date, setDate] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    value={date}
                    onChange={setDate}
                    placeholder="DD.MM.YYYY"
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Basic date picker with calendar dropdown.' },
        },
    },
};

export const WithValue = {
    render: () => {
        const [date, setDate] = useState(new Date(2026, 0, 15));
        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    value={date}
                    onChange={setDate}
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date picker with pre-selected date.' },
        },
    },
};

// ===== With Label =====

export const WithLabel = {
    render: () => {
        const [date, setDate] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    label="Birth Date"
                    value={date}
                    onChange={setDate}
                />
            </div>
        );
    },
};

export const WithLabelRequired = {
    render: () => {
        const [date, setDate] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    label="Birth Date"
                    value={date}
                    onChange={setDate}
                    required
                />
            </div>
        );
    },
};

// ===== With Helper and Error =====

export const WithHelper = {
    render: () => {
        const [date, setDate] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    label="Event Date"
                    value={date}
                    onChange={setDate}
                    helper="Select the date for your event"
                />
            </div>
        );
    },
};

export const WithError = {
    render: () => (
        <div style={{ width: '260px' }}>
            <DatePicker
                label="Birth Date"
                error="Please select a valid date"
            />
        </div>
    ),
};

// ===== Date Range =====

export const DateRange = {
    render: () => {
        const [rangeStart, setRangeStart] = useState(null);
        const [rangeEnd, setRangeEnd] = useState(null);

        return (
            <div style={{ width: '280px' }}>
                <DatePicker
                    label="Date Range"
                    isRange
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onRangeChange={(start, end) => {
                        setRangeStart(start);
                        setRangeEnd(end);
                    }}
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date range picker for selecting start and end dates.' },
        },
    },
};

export const DateRangeWithValues = {
    render: () => {
        const [rangeStart, setRangeStart] = useState(new Date(2026, 0, 9));
        const [rangeEnd, setRangeEnd] = useState(new Date(2026, 0, 21));

        return (
            <div style={{ width: '280px' }}>
                <DatePicker
                    label="Selected Range"
                    isRange
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onRangeChange={(start, end) => {
                        setRangeStart(start);
                        setRangeEnd(end);
                    }}
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date range with pre-selected values showing range highlighting.' },
        },
    },
};

// ===== With Constraints =====

export const WithMinDate = {
    render: () => {
        const [date, setDate] = useState(null);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 7);

        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    label="Future Date"
                    value={date}
                    onChange={setDate}
                    minDate={minDate}
                    helper="Cannot select dates more than 7 days in the past"
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date picker with minimum date constraint.' },
        },
    },
};

export const WithMaxDate = {
    render: () => {
        const [date, setDate] = useState(null);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);

        return (
            <div style={{ width: '260px' }}>
                <DatePicker
                    label="Near Future Date"
                    value={date}
                    onChange={setDate}
                    maxDate={maxDate}
                    helper="Can only select dates within the next 30 days"
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date picker with maximum date constraint.' },
        },
    },
};

// ===== Custom Format =====

export const CustomFormat = {
    render: () => {
        const [date, setDate] = useState(new Date(2026, 11, 25));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
                <DatePicker
                    label="DD.MM.YYYY (default)"
                    value={date}
                    onChange={setDate}
                    format="DD.MM.YYYY"
                />
                <DatePicker
                    label="MM/DD/YYYY"
                    value={date}
                    onChange={setDate}
                    format="MM/DD/YYYY"
                />
                <DatePicker
                    label="YYYY-MM-DD"
                    value={date}
                    onChange={setDate}
                    format="YYYY-MM-DD"
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date picker with different date formats.' },
        },
    },
};

// ===== Disabled =====

export const Disabled = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
            <DatePicker
                label="Disabled (empty)"
                disabled
            />
            <DatePicker
                label="Disabled (with value)"
                value={new Date(2026, 0, 15)}
                disabled
            />
        </div>
    ),
};

// ===== All States =====

export const AllStates = {
    render: () => {
        const [date1, setDate1] = useState(null);
        const [date2, setDate2] = useState(new Date(2026, 0, 15));
        const [rangeStart, setRangeStart] = useState(new Date(2026, 0, 9));
        const [rangeEnd, setRangeEnd] = useState(new Date(2026, 0, 21));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '280px' }}>
                <DatePicker
                    label="Default"
                    value={date1}
                    onChange={setDate1}
                />
                <DatePicker
                    label="With Value"
                    value={date2}
                    onChange={setDate2}
                />
                <DatePicker
                    label="Date Range"
                    isRange
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onRangeChange={(start, end) => {
                        setRangeStart(start);
                        setRangeEnd(end);
                    }}
                />
                <DatePicker
                    label="Disabled"
                    disabled
                />
                <DatePicker
                    label="Error"
                    error="Please select a date"
                />
                <DatePicker
                    label="With Helper"
                    helper="Click to open calendar"
                />
            </div>
        );
    },
};

// ===== Playground =====

export const Playground = {
    args: {
        label: 'Date',
        placeholder: 'DD.MM.YYYY',
        helper: '',
        error: '',
        disabled: false,
        required: false,
        isRange: false,
    },
    render: (args) => {
        const [date, setDate] = useState(null);
        const [rangeStart, setRangeStart] = useState(null);
        const [rangeEnd, setRangeEnd] = useState(null);

        return (
            <div style={{ width: '280px' }}>
                <DatePicker
                    {...args}
                    value={date}
                    onChange={setDate}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onRangeChange={(start, end) => {
                        setRangeStart(start);
                        setRangeEnd(end);
                    }}
                />
            </div>
        );
    },
};
