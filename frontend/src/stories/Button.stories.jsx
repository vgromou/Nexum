import React from 'react';
import Button from '../components/Button/Button';
import { Plus, Check, X, ChevronDown } from 'lucide-react';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A flexible button component that supports multiple variants, sizes, and icon positions.

**Features:**
- 9 color variants (primary, ghost, outline, destructive variants, success variants)
- 3 sizes (sm: 26px, md: 36px, lg: 40px)
- 5 icon positions (none, icon, left, right, both)
- 4 states per button (default, hover, active, disabled)

**Total combinations:** 3 sizes × 5 icon positions × 9 variants × 4 states = 540 possible button variants.

**Size specifications:**
- **Small (sm)**: 26px height, 4px icon gap
- **Medium (md)**: 36px height, 8px icon gap (default)
- **Large (lg)**: 40px height, 8px icon gap`,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'outline', 'destructive', 'destructive-ghost', 'destructive-outline', 'success', 'success-ghost', 'success-outline'],
      description: 'Button variant style',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    iconPosition: {
      control: 'select',
      options: ['none', 'icon', 'left', 'right', 'both'],
      description: 'Icon position relative to text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    children: {
      control: 'text',
      description: 'Button content (text or elements)',
    },
  },
};

// Interactive playground
export const Playground = {
  args: {
    children: 'Button Text',
    variant: 'primary',
    size: 'md',
    iconPosition: 'none',
    disabled: false,
  },
  render: (args) => {
    const icon = args.iconPosition !== 'none' ? <Plus /> : null;
    return (
      <Button {...args} icon={icon}>
        {args.iconPosition !== 'icon' && args.children}
      </Button>
    );
  },
};

// All variants
export const Variants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive-ghost">Destructive Ghost</Button>
        <Button variant="destructive-outline">Destructive Outline</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="success">Success</Button>
        <Button variant="success-ghost">Success Ghost</Button>
        <Button variant="success-outline">Success Outline</Button>
      </div>
    </div>
  ),
};

// All sizes
export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  ),
};

// With icons
export const WithIcons = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="primary" icon={<Plus />} iconPosition="left">Add Item</Button>
        <Button variant="primary" icon={<ChevronDown />} iconPosition="right">Dropdown</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="primary" icon={<Check />} iconPosition="both">Confirm</Button>
        <Button variant="primary" icon={<Plus />} iconPosition="icon" aria-label="Add" />
      </div>
    </div>
  ),
};

// Disabled states
export const Disabled = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="destructive" disabled>Destructive</Button>
      <Button variant="success" disabled>Success</Button>
    </div>
  ),
};

// Destructive variants
export const DestructiveVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive-ghost">Destructive Ghost</Button>
        <Button variant="destructive-outline">Destructive Outline</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="destructive" icon={<X />} iconPosition="left">Delete</Button>
        <Button variant="destructive-ghost" icon={<X />} iconPosition="left">Remove</Button>
        <Button variant="destructive-outline" icon={<X />} iconPosition="left">Cancel</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Destructive button variants for dangerous actions like delete, remove, or cancel. Available in solid, ghost, and outline styles.',
      },
    },
  },
};

// Success variants
export const SuccessVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="success">Success</Button>
        <Button variant="success-ghost">Success Ghost</Button>
        <Button variant="success-outline">Success Outline</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="success" icon={<Check />} iconPosition="left">Confirm</Button>
        <Button variant="success-ghost" icon={<Check />} iconPosition="left">Save</Button>
        <Button variant="success-outline" icon={<Check />} iconPosition="left">Submit</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success button variants for positive actions like confirm, save, or submit. Available in solid, ghost, and outline styles.',
      },
    },
  },
};

// States
export const States = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '70px' }}>Primary</div>
        <Button variant="primary">Default</Button>
        <Button variant="primary">Hover</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '70px' }}>Ghost</div>
        <Button variant="ghost">Default</Button>
        <Button variant="ghost">Hover</Button>
        <Button variant="ghost" disabled>Disabled</Button>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '70px' }}>Outline</div>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Hover</Button>
        <Button variant="outline" disabled>Disabled</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All buttons support four states: default, hover (interactive), active (press), and disabled. Hover and active states are applied automatically via CSS.',
      },
    },
  },
};

// Real-world examples
export const Examples = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Dialog Actions</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Form Submission</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" type="button">Reset</Button>
          <Button variant="success" icon={<Check />} iconPosition="left" type="submit">
            Submit Form
          </Button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Destructive Action</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive" icon={<X />} iconPosition="left">
            Delete Account
          </Button>
        </div>
      </div>

      <div style={{ width: '300px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Full Width</div>
        <Button variant="primary" size="lg" icon={<Plus />} iconPosition="left" className="btn-full">
          Create New Project
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common usage patterns for buttons in real-world interfaces.',
      },
    },
  },
};
