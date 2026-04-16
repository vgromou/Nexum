import React, { useState } from 'react';
import Select from '../components/Select/Select';

export default {
    title: 'Components/Select',
    component: Select,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `A dropdown select component that supports single and multi-select modes.

**Features:**
- Single and multi-select modes
- Keyboard navigation
- Search/filter functionality
- Clearable selection
- Disabled state
- Error and helper text
- Tags display for multi-select

**Figma Design Specs:**
- Option: 14px/20px, regular weight, 8px/12px padding
- Selected: accent-primary background with white text and checkmark
- Hover: light gray background
- Disabled: lighter text color
- Menu: white background, shadow, rounded corners`,
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
        multiple: { control: 'boolean' },
        searchable: { control: 'boolean' },
        clearable: { control: 'boolean' },
    },
};

const defaultOptions = [
    { value: 1, label: 'Item' },
    { value: 2, label: 'Item' },
    { value: 3, label: 'Item' },
    { value: 4, label: 'Item' },
    { value: 5, label: 'Item', disabled: true },
];

const fruitOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
    { value: 'fig', label: 'Fig' },
    { value: 'grape', label: 'Grape' },
];

const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
];

// ===== Basic Select =====

export const Basic = {
    render: () => {
        const [value, setValue] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <Select
                    options={defaultOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Select..."
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Basic select dropdown with placeholder.' },
        },
    },
};

export const WithValue = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Select
                options={defaultOptions}
                value={2}
                placeholder="Select..."
            />
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Select with a pre-selected value.' },
        },
    },
};

// ===== Option States =====

export const OptionStates = {
    render: () => {
        const [value, setValue] = useState(3);
        return (
            <div style={{ width: '260px' }}>
                <p style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Click to open. Shows default, hover, selected, and disabled states.
                </p>
                <Select
                    options={defaultOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Select..."
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Demonstrates all option states: default, hover, selected (with checkmark), and disabled.' },
        },
    },
};

// ===== With Label =====

export const WithLabel = {
    render: () => {
        const [value, setValue] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <Select
                    label="Category"
                    options={fruitOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Select a fruit..."
                />
            </div>
        );
    },
};

export const WithLabelRequired = {
    render: () => {
        const [value, setValue] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <Select
                    label="Category"
                    options={fruitOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Select a fruit..."
                    required
                />
            </div>
        );
    },
};

// ===== With Helper and Error =====

export const WithHelper = {
    render: () => {
        const [value, setValue] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <Select
                    label="Country"
                    options={countryOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Select your country..."
                    helper="This will be used for shipping"
                />
            </div>
        );
    },
};

export const WithError = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Select
                label="Country"
                options={countryOptions}
                placeholder="Select your country..."
                error="Please select a country"
            />
        </div>
    ),
};

// ===== Multi-Select =====

export const MultiSelect = {
    render: () => {
        const [values, setValues] = useState([]);
        return (
            <div style={{ width: '300px' }}>
                <Select
                    label="Select fruits"
                    options={fruitOptions}
                    value={values}
                    onChange={setValues}
                    placeholder="Choose multiple..."
                    multiple
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Multi-select mode allows selecting multiple options, displayed as removable tags.' },
        },
    },
};

export const MultiSelectWithValues = {
    render: () => {
        const [values, setValues] = useState(['apple', 'cherry', 'grape']);
        return (
            <div style={{ width: '300px' }}>
                <Select
                    label="Selected fruits"
                    options={fruitOptions}
                    value={values}
                    onChange={setValues}
                    placeholder="Choose multiple..."
                    multiple
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Multi-select with pre-selected values.' },
        },
    },
};

// ===== Searchable =====

export const Searchable = {
    render: () => {
        const [value, setValue] = useState(null);
        return (
            <div style={{ width: '260px' }}>
                <Select
                    label="Search and select"
                    options={countryOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Type to search..."
                    searchable
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Searchable select allows filtering options by typing.' },
        },
    },
};

export const SearchableMulti = {
    render: () => {
        const [values, setValues] = useState([]);
        return (
            <div style={{ width: '300px' }}>
                <Select
                    label="Search and select multiple"
                    options={fruitOptions}
                    value={values}
                    onChange={setValues}
                    placeholder="Type to search..."
                    searchable
                    multiple
                />
            </div>
        );
    },
};

// ===== Clearable =====

export const Clearable = {
    render: () => {
        const [value, setValue] = useState('apple');
        return (
            <div style={{ width: '260px' }}>
                <Select
                    label="Clearable select"
                    options={fruitOptions}
                    value={value}
                    onChange={setValue}
                    placeholder="Select a fruit..."
                    clearable
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Clearable select shows an X button to clear the selection.' },
        },
    },
};

// ===== Disabled =====

export const Disabled = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
            <Select
                label="Disabled empty"
                options={fruitOptions}
                placeholder="Select..."
                disabled
            />
            <Select
                label="Disabled with value"
                options={fruitOptions}
                value="apple"
                disabled
            />
        </div>
    ),
};

export const DisabledMulti = {
    render: () => (
        <div style={{ width: '300px' }}>
            <Select
                label="Disabled multi-select"
                options={fruitOptions}
                value={['apple', 'cherry']}
                multiple
                disabled
            />
        </div>
    ),
};

// ===== All States =====

export const AllStates = {
    render: () => {
        const [single, setSingle] = useState(null);
        const [multi, setMulti] = useState([]);
        const [search, setSearch] = useState(null);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '300px' }}>
                <Select
                    label="Default"
                    options={fruitOptions}
                    value={single}
                    onChange={setSingle}
                    placeholder="Select..."
                />
                <Select
                    label="With Value"
                    options={fruitOptions}
                    value="banana"
                />
                <Select
                    label="Searchable"
                    options={fruitOptions}
                    value={search}
                    onChange={setSearch}
                    placeholder="Type to search..."
                    searchable
                />
                <Select
                    label="Clearable"
                    options={fruitOptions}
                    value="cherry"
                    clearable
                />
                <Select
                    label="Multi-select"
                    options={fruitOptions}
                    value={multi}
                    onChange={setMulti}
                    placeholder="Choose multiple..."
                    multiple
                />
                <Select
                    label="Disabled"
                    options={fruitOptions}
                    placeholder="Select..."
                    disabled
                />
                <Select
                    label="Error"
                    options={fruitOptions}
                    placeholder="Select..."
                    error="This field is required"
                />
                <Select
                    label="With Helper"
                    options={fruitOptions}
                    placeholder="Select..."
                    helper="Select your favorite fruit"
                />
            </div>
        );
    },
};

// ===== Full Featured =====

export const FullFeatured = {
    render: () => {
        const [values, setValues] = useState(['apple']);
        return (
            <div style={{ width: '300px' }}>
                <Select
                    label="Full featured select"
                    options={fruitOptions}
                    value={values}
                    onChange={setValues}
                    placeholder="Search fruits..."
                    helper="You can select multiple fruits"
                    multiple
                    searchable
                    clearable
                    required
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Select with all features enabled: multi-select, searchable, clearable.' },
        },
    },
};

// ===== Playground =====

export const Playground = {
    args: {
        label: 'Label',
        placeholder: 'Select...',
        helper: '',
        error: '',
        disabled: false,
        required: false,
        multiple: false,
        searchable: false,
        clearable: false,
    },
    render: (args) => {
        const [value, setValue] = useState(args.multiple ? [] : null);
        return (
            <div style={{ width: '260px' }}>
                <Select
                    {...args}
                    options={fruitOptions}
                    value={value}
                    onChange={setValue}
                />
            </div>
        );
    },
};
