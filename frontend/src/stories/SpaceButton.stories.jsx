import SpaceButton from '../components/Navigation/SpaceButton';

export default {
  title: 'Navigation/SpaceButton',
  component: SpaceButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Interactive button for space selection with integrated search functionality.

## Features
- Default background: transparent
- Hover state changes to background-hover
- Integrated search button (icon-btn-md with standard behavior)
- Emoji or icon support for space branding
- Truncates long space names with ellipsis

## Usage
Used in the left sidebar header for space navigation and quick search access.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      description: 'Space icon (emoji or custom icon)',
      control: false,
    },
    name: {
      description: 'Name of the space',
      control: 'text',
    },
    onSpaceClick: {
      description: 'Callback when space button is clicked',
      action: 'space clicked',
    },
    onSearchClick: {
      description: 'Callback when search button is clicked',
      action: 'search clicked',
    },
  },
};

export const Default = {
  args: {
    icon: <span>🚀</span>,
    name: 'Space Name',
  },
};

export const LongName = {
  args: {
    icon: <span>📚</span>,
    name: 'Very Long Space Name That Should Truncate',
  },
  parameters: {
    docs: {
      description: {
        story: 'Space button with a long name that gets truncated with ellipsis.',
      },
    },
  },
};

export const DifferentIcons = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px' }}>
      <SpaceButton icon={<span>🚀</span>} name="Rocket Space" />
      <SpaceButton icon={<span>🎨</span>} name="Design Space" />
      <SpaceButton icon={<span>💻</span>} name="Dev Space" />
      <SpaceButton icon={<span>📊</span>} name="Analytics Space" />
      <SpaceButton icon={<span>🔬</span>} name="Research Space" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various space buttons with different emoji icons.',
      },
    },
  },
};

export const InteractiveDemo = {
  render: () => (
    <div style={{ width: '280px' }}>
      <SpaceButton
        icon={<span>🚀</span>}
        name="Space Name"
        onSpaceClick={() => alert('Space clicked!')}
        onSearchClick={() => alert('Search clicked!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Click the space button or search icon to see the callbacks in action.',
      },
    },
  },
};

export const States = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '280px' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
          Default
        </div>
        <SpaceButton icon={<span>🚀</span>} name="Space Name" />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
          Hover (hover over the button)
        </div>
        <SpaceButton icon={<span>🚀</span>} name="Space Name" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Space button states: default and hover.',
      },
    },
  },
};
