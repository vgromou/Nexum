import UserButton from '../components/Navigation/UserButton';

export default {
  title: 'Navigation/UserButton',
  component: UserButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Interactive button for user profile with integrated notification functionality.

## Features
- Default background: transparent
- Hover state changes to background-hover
- Integrated notification button (icon-btn-md with standard behavior)
- Avatar image display with border
- User name and role display
- Truncates long names/roles with ellipsis

## Usage
Used in the left sidebar footer for user profile access and notification management.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    avatarUrl: {
      description: 'URL for user avatar image',
      control: 'text',
    },
    name: {
      description: 'User full name',
      control: 'text',
    },
    role: {
      description: 'User role or job title',
      control: 'text',
    },
    onUserClick: {
      description: 'Callback when user button is clicked',
      action: 'user clicked',
    },
    onNotificationClick: {
      description: 'Callback when notification button is clicked',
      action: 'notification clicked',
    },
  },
};

export const Default = {
  args: {
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor',
    name: 'Viktor Gromov',
    role: 'Business Analyst',
  },
};

export const LongNames = {
  args: {
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Long',
    name: 'Very Long Name That Should Truncate With Ellipsis',
    role: 'Senior Principal Business Analyst',
  },
  parameters: {
    docs: {
      description: {
        story: 'User button with long name and role that get truncated with ellipsis.',
      },
    },
  },
};

export const DifferentUsers = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px' }}>
      <UserButton
        avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"
        name="Alice Johnson"
        role="Product Manager"
      />
      <UserButton
        avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"
        name="Bob Smith"
        role="Software Engineer"
      />
      <UserButton
        avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Carol"
        name="Carol Davis"
        role="UX Designer"
      />
      <UserButton
        avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=David"
        name="David Wilson"
        role="DevOps Engineer"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various user buttons with different avatars and roles.',
      },
    },
  },
};

export const InteractiveDemo = {
  render: () => (
    <div style={{ width: '280px' }}>
      <UserButton
        avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor"
        name="Viktor Gromov"
        role="Business Analyst"
        onUserClick={() => alert('User profile clicked!')}
        onNotificationClick={() => alert('Notifications clicked!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Click the user button or notification icon to see the callbacks in action.',
      },
    },
  },
};

export const States = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '280px' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
          Default (transparent)
        </div>
        <UserButton
          avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor"
          name="Viktor Gromov"
          role="Business Analyst"
        />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
          Hover (background-hover - hover over the button)
        </div>
        <UserButton
          avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor"
          name="Viktor Gromov"
          role="Business Analyst"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'User button states: default (transparent) and hover (background-hover).',
      },
    },
  },
};
