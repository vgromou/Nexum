import React from 'react';
import IconButton from '../components/Button/IconButton';
import { Bell, Plus, Search, X, Check, ChevronDown, Settings, Heart } from 'lucide-react';

export default {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A square icon-only button component with multiple sizes. Perfect for toolbars, navigation, and compact interfaces.

**Features:**
- 4 sizes (xs, sm, md, lg)
- 4 states (default, hover, active, disabled)
- Square aspect ratio (1:1)
- Automatic icon sizing based on button size

**Total combinations:** 4 sizes × 4 states = 16 icon button variants.

**Size specifications:**
- **XS**: 20×20px button, 2px padding, 16×16px icon
- **SM**: 26×26px button, 4px padding, 18×18px icon
- **MD**: 28×28px button, 4px padding, 20×20px icon (default)
- **LG**: 40×40px button, 8px padding, 24×24px icon

**State colors:**
- **Default**: Transparent background, tertiary icon (var(--text-tertiary))
- **Hover**: Light gray background (var(--background-hover)), secondary icon (var(--text-secondary))
- **Active**: Accent light background (var(--accent-primary-light)), accent icon (var(--accent-primary))
- **Disabled**: Transparent background, light border color (var(--border-light))`,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Button size',
    },
    active: {
      control: 'boolean',
      description: 'Active state styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
};

// Interactive playground
export const Playground = {
  args: {
    size: 'md',
    active: false,
    disabled: false,
  },
  render: (args) => (
    <IconButton {...args} icon={<Bell />} aria-label="Notifications" />
  ),
};

// All sizes
export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <IconButton icon={<Bell />} size="xs" aria-label="Notifications" />
      <IconButton icon={<Bell />} size="sm" aria-label="Notifications" />
      <IconButton icon={<Bell />} size="md" aria-label="Notifications" />
      <IconButton icon={<Bell />} size="lg" aria-label="Notifications" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons come in four sizes:\n- **XS**: 20×20px button, 16×16px icon\n- **SM**: 26×26px button, 20×20px icon\n- **MD**: 28×28px button, 20×20px icon (default)\n- **LG**: 40×40px button, 24×24px icon',
      },
    },
  },
};

// States
export const States = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '60px' }}>Default</div>
      <IconButton icon={<Bell />} size="md" aria-label="Notifications" />

      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '60px', marginLeft: '16px' }}>Hover</div>
      <IconButton icon={<Bell />} size="md" aria-label="Notifications" />

      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '60px', marginLeft: '16px' }}>Active</div>
      <IconButton icon={<Bell />} size="md" active aria-label="Notifications" />

      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '60px', marginLeft: '16px' }}>Disabled</div>
      <IconButton icon={<Bell />} size="md" disabled aria-label="Notifications" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons have four states:\n- **Default**: Transparent background, tertiary icon color (var(--text-tertiary))\n- **Hover**: Light gray background (var(--background-hover)), secondary icon color (var(--text-secondary))\n- **Active**: Accent light background (var(--accent-primary-light)), accent icon color (var(--accent-primary))\n- **Disabled**: Transparent background, light border color (var(--border-light)), not interactive',
      },
    },
  },
};

// Different icons
export const DifferentIcons = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <IconButton icon={<Bell />} size="md" aria-label="Notifications" />
      <IconButton icon={<Plus />} size="md" aria-label="Add" />
      <IconButton icon={<Search />} size="md" aria-label="Search" />
      <IconButton icon={<X />} size="md" aria-label="Close" />
      <IconButton icon={<Check />} size="md" aria-label="Confirm" />
      <IconButton icon={<ChevronDown />} size="md" aria-label="Expand" />
      <IconButton icon={<Settings />} size="md" aria-label="Settings" />
      <IconButton icon={<Heart />} size="md" aria-label="Favorite" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons work with any Lucide React icon. The icon size is automatically adjusted based on the button size.',
      },
    },
  },
};

// Real-world examples
export const Examples = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Toolbar</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton icon={<Plus />} size="sm" aria-label="Add" />
          <IconButton icon={<Search />} size="sm" aria-label="Search" />
          <IconButton icon={<Settings />} size="sm" aria-label="Settings" />
          <IconButton icon={<Bell />} size="sm" aria-label="Notifications" />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Header Actions</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton icon={<Search />} size="md" aria-label="Search" />
          <IconButton icon={<Bell />} size="md" aria-label="Notifications" />
          <IconButton icon={<Settings />} size="md" aria-label="Settings" />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Dialog Close Button</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton icon={<X />} size="sm" aria-label="Close" />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Active Navigation Item</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton icon={<Search />} size="md" active aria-label="Search" />
          <IconButton icon={<Bell />} size="md" aria-label="Notifications" />
          <IconButton icon={<Settings />} size="md" aria-label="Settings" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common use cases for icon buttons in real-world interfaces.',
      },
    },
  },
};
