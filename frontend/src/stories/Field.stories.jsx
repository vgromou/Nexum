import React, { useState } from 'react';
import Field from '../components/Field/Field';
import { Search, Calendar, ChevronDown, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default {
    title: 'Components/Field',
    component: Field,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `A unified form field component that supports labels, placeholders, error states, helper text, icons, and tags.

**Features:**
- Optional label above the input
- Left and right icon support
- Right icon can be a clickable button
- Tags/chips mode for multi-select
- Error and helper text display
- Full accessibility support

**Figma Design Specs:**
- Label: 13px/18px, medium weight, secondary color
- Input: 14px/20px, regular weight, 8px/12px padding
- Helper/Error: 12px/16px, regular weight
- Gap between elements: 4px
- Icon size: 24x24px with 2px padding
- Tag: 8px horizontal, 2px vertical padding`,
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
    },
};

// ===== Basic Variants (from Figma) =====

export const Basic = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Field placeholder="Paste or type" />
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Basic input with placeholder only.' },
        },
    },
};

export const WithValue = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Field value="Text" readOnly />
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Input with filled text value.' },
        },
    },
};

// ===== Icon Variants =====

export const WithLeftIcon = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
            <Field
                leftIcon={<Search size={20} />}
                placeholder="Paste or type"
            />
            <Field
                leftIcon={<Search size={20} />}
                value="Text"
                readOnly
            />
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Input with icon on the left side.' },
        },
    },
};

export const WithRightIcon = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
            <Field
                rightIcon={<Search size={20} />}
                placeholder="Paste or type"
            />
            <Field
                rightIcon={<Search size={20} />}
                value="Text"
                readOnly
            />
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Input with icon on the right side.' },
        },
    },
};

export const WithBothIcons = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
            <Field
                leftIcon={<Search size={20} />}
                rightIcon={<Search size={20} />}
                placeholder="Paste or type"
            />
            <Field
                leftIcon={<Search size={20} />}
                rightIcon={<Search size={20} />}
                value="Text"
                readOnly
            />
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Input with icons on both sides.' },
        },
    },
};

// ===== Date Picker Variants =====

export const DatePicker = {
    render: () => {
        const [showPicker, setShowPicker] = useState(false);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
                <Field
                    placeholder="DD.MM.YYYY"
                    rightIcon={<Calendar size={20} />}
                    onRightIconClick={() => setShowPicker(!showPicker)}
                />
                <Field
                    value="16.03.2000"
                    rightIcon={<Calendar size={20} />}
                    onRightIconClick={() => setShowPicker(!showPicker)}
                    readOnly
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Date picker field with calendar button.' },
        },
    },
};

export const DateRangePicker = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '260px' }}>
            <Field
                rightIcon={<Calendar size={20} />}
                onRightIconClick={() => {}}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ color: 'var(--text-placeholder)', fontSize: '14px' }}>DD.MM.YYYY</span>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-default)' }} />
                    <span style={{ color: 'var(--text-placeholder)', fontSize: '14px' }}>DD.MM.YYYY</span>
                </div>
            </Field>
            <Field
                rightIcon={<Calendar size={20} />}
                onRightIconClick={() => {}}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>16.03.2000</span>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-default)' }} />
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>20.03.2000</span>
                </div>
            </Field>
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Date range picker with two date values separated by divider.' },
        },
    },
};

// ===== Tags/Multi-select =====

export const WithTags = {
    render: () => {
        const [tags, setTags] = useState([
            { id: 1, label: 'Tag 1' },
            { id: 2, label: 'Tagsdfsdf 2' },
            { id: 3, label: 'Tag 3' },
            { id: 4, label: 'Tag 3' },
            { id: 5, label: 'Tag 3' },
            { id: 6, label: 'dawdawdwad 3' },
        ]);

        const handleRemove = (id) => {
            setTags(tags.filter(t => t.id !== id));
        };

        return (
            <div style={{ width: '260px' }}>
                <Field
                    tags={tags}
                    onTagRemove={handleRemove}
                    rightIcon={<ChevronDown size={20} />}
                    onRightIconClick={() => {}}
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Multi-select field with removable tags/chips.' },
        },
    },
};

// ===== With Label and Helper =====

export const WithLabel = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Field
                label="Label"
                placeholder="Paste or type"
                name="with-label"
            />
        </div>
    ),
};

export const WithError = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Field
                label="Label"
                placeholder="Paste or type"
                error="Error Message"
                name="with-error"
            />
        </div>
    ),
};

export const WithHelper = {
    render: () => (
        <div style={{ width: '260px' }}>
            <Field
                label="Username"
                placeholder="Enter username"
                helper="Must be at least 3 characters"
                name="with-helper"
            />
        </div>
    ),
};

// ===== All States =====

export const AllStates = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '260px' }}>
            <Field
                label="Default"
                placeholder="Paste or type"
            />
            <Field
                label="With Value"
                value="Filled value"
                readOnly
            />
            <Field
                label="Disabled"
                placeholder="Paste or type"
                disabled
            />
            <Field
                label="Error"
                placeholder="Paste or type"
                error="This field is required"
            />
            <Field
                label="With Left Icon"
                leftIcon={<Search size={20} />}
                placeholder="Search..."
            />
            <Field
                label="With Right Button"
                rightIcon={<Calendar size={20} />}
                onRightIconClick={() => alert('Calendar clicked!')}
                placeholder="Select date"
            />
        </div>
    ),
};

// ===== Read-only Variant =====

export const ReadOnlyVariant = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '260px' }}>
            <div>
                <h4 style={{ marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>Default Mode</h4>
                <Field
                    label="Label"
                    value="Text value"
                    rightIcon={<Calendar size={20} />}
                    readOnly
                />
            </div>
            <div>
                <h4 style={{ marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>Read-only Mode (Flat, no icons)</h4>
                <Field
                    label="Label"
                    value="Text value"
                    rightIcon={<Calendar size={20} />}
                    variant="readonly"
                    readOnly
                />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: { story: 'Read-only variant displays field with transparent background, no border, and no icons for a flat text-only appearance.' },
        },
    },
};

// ===== Interactive Examples =====

export const PasswordField = {
    render: () => {
        const [showPassword, setShowPassword] = useState(false);
        const [value, setValue] = useState('');

        return (
            <div style={{ width: '300px' }}>
                <Field
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    leftIcon={<Lock size={20} />}
                    rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    helper="Must be at least 8 characters"
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Password field with show/hide toggle button.' },
        },
    },
};

export const SearchField = {
    render: () => {
        const [value, setValue] = useState('');

        return (
            <div style={{ width: '300px' }}>
                <Field
                    leftIcon={<Search size={20} />}
                    placeholder="Search..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Search field with search icon.' },
        },
    },
};

export const EmailField = {
    render: () => {
        const [value, setValue] = useState('');
        const [error, setError] = useState('');

        const validateEmail = (email) => {
            if (!email) return '';
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            return isValid ? '' : 'Please enter a valid email address';
        };

        return (
            <div style={{ width: '300px' }}>
                <Field
                    label="Email"
                    type="email"
                    placeholder="user@example.com"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError(validateEmail(e.target.value));
                    }}
                    leftIcon={<Mail size={20} />}
                    error={error}
                    required
                />
            </div>
        );
    },
    parameters: {
        docs: {
            description: { story: 'Email field with real-time validation.' },
        },
    },
};

// ===== Playground =====

export const Playground = {
    args: {
        label: 'Label',
        placeholder: 'Paste or type',
        helper: '',
        error: '',
        disabled: false,
        required: false,
    },
    render: (args) => (
        <div style={{ width: '260px' }}>
            <Field
                {...args}
                leftIcon={<Search size={20} />}
            />
        </div>
    ),
};
