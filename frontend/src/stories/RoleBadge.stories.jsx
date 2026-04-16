import RoleBadge from '../components/RoleBadge';

export default {
    title: 'Components/RoleBadge',
    component: RoleBadge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
Role badge component for displaying user roles with optional scope labels.

## Variants
- **Without label**: Simple badge showing just the role name
- **With label**: Badge with scope label (Organization or Space) above it

## Scopes
- **Organization**: Organization-level roles
- **Space**: Space-level roles (workspace/project specific)
                `,
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        role: {
            description: 'The role name to display',
            control: 'text',
        },
        scope: {
            description: 'The scope of the role',
            control: 'select',
            options: ['organization', 'space'],
        },
        showLabel: {
            description: 'Whether to show the scope label',
            control: 'boolean',
        },
    },
};

export const Default = {
    args: {
        role: 'Admin',
    },
};

export const Member = {
    args: {
        role: 'Member',
    },
};

export const WithOrganizationLabel = {
    args: {
        role: 'Member',
        scope: 'organization',
        showLabel: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Badge with Organization scope label.',
            },
        },
    },
};

export const WithSpaceLabel = {
    args: {
        role: 'Admin',
        scope: 'space',
        showLabel: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Badge with Space scope label.',
            },
        },
    },
};

export const AllVariants = {
    render: () => (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Without Label
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <RoleBadge role="Member" />
                    <RoleBadge role="Admin" />
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Organization Scope
                </div>
                <RoleBadge role="Member" scope="organization" showLabel />
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Space Scope
                </div>
                <RoleBadge role="Admin" scope="space" showLabel />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All badge variants side by side.',
            },
        },
    },
};

export const MultipleRoles = {
    render: () => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RoleBadge role="Member" />
            <RoleBadge role="Admin" />
            <RoleBadge role="Owner" />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Multiple badges displayed together.',
            },
        },
    },
};
