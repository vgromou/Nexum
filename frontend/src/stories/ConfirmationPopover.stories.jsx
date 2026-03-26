import React, { useState, useRef } from 'react';
import ConfirmationPopover from '../components/ConfirmationPopover';
import Button from '../components/Button';
import { GitBranch } from 'lucide-react';

export default {
    title: 'Components/ConfirmationPopover',
    component: ConfirmationPopover,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `A popover component for confirmation dialogs with an arrow pointer.

**Features:**
- Title with optional description
- Customizable action buttons with variants
- Button icons support
- Click outside to close
- Escape key to close
- Smooth animations

**Button variants:**
- \`outline\` - Bordered button for cancel/secondary actions
- \`ghost\` - Minimal button
- \`primary\` - Primary action
- \`destructive\` - Danger/delete actions (red)
- \`success\` - Positive actions (green)`,
            },
        },
    },
    argTypes: {
        isOpen: {
            control: 'boolean',
            description: 'Controls popover visibility',
        },
        title: {
            control: 'text',
            description: 'Title text',
        },
        description: {
            control: 'text',
            description: 'Optional description text',
        },
        placement: {
            control: { type: 'select' },
            options: ['top', 'bottom'],
            description: 'Popover placement relative to anchor',
        },
    },
};

// Demo wrapper to handle button trigger
const PopoverDemo = ({ title, description, actions, placement = 'bottom' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);

    const handleClose = () => setIsOpen(false);

    // Map actions to include close handler
    const mappedActions = actions.map(action => ({
        ...action,
        onClick: () => {
            action.onClick?.();
            handleClose();
        },
    }));

    return (
        <div style={{ padding: '100px', display: 'flex', justifyContent: 'center' }}>
            <div ref={buttonRef}>
                <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
                    Open Popover
                </Button>
            </div>
            <ConfirmationPopover
                isOpen={isOpen}
                onClose={handleClose}
                title={title}
                description={description}
                actions={mappedActions}
                anchorRef={buttonRef}
                placement={placement}
            />
        </div>
    );
};

// Log out confirmation
export const LogOutConfirmation = {
    render: () => (
        <PopoverDemo
            title="Log out of Nexum?"
            actions={[
                { label: 'Cancel', variant: 'outline' },
                { label: 'Log out', variant: 'destructive' },
            ]}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Simple confirmation popover for logout action with destructive button.',
            },
        },
    },
};

// Create branch confirmation with description
export const CreateBranchConfirmation = {
    render: () => (
        <PopoverDemo
            title="Create Branch?"
            description="You've changed more than 30% of article"
            actions={[
                { label: 'Cancel', variant: 'outline' },
                { label: 'Create Branch', variant: 'success', icon: <GitBranch size={16} /> },
            ]}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Confirmation popover with description and success button with icon.',
            },
        },
    },
};

// Delete confirmation
export const DeleteConfirmation = {
    render: () => (
        <PopoverDemo
            title="Delete this item?"
            description="This action cannot be undone."
            actions={[
                { label: 'Cancel', variant: 'outline' },
                { label: 'Delete', variant: 'destructive' },
            ]}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Destructive confirmation for delete actions.',
            },
        },
    },
};

// Top placement
export const TopPlacement = {
    render: () => (
        <PopoverDemo
            title="Confirm action?"
            actions={[
                { label: 'Cancel', variant: 'outline' },
                { label: 'Confirm', variant: 'primary' },
            ]}
            placement="top"
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Popover positioned above the trigger element.',
            },
        },
    },
};

// Multiple buttons
export const MultipleActions = {
    render: () => (
        <PopoverDemo
            title="Save changes?"
            description="You have unsaved changes in this document."
            actions={[
                { label: 'Discard', variant: 'ghost' },
                { label: 'Cancel', variant: 'outline' },
                { label: 'Save', variant: 'primary' },
            ]}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Popover with three action buttons for complex confirmation flows.',
            },
        },
    },
};

// Static display (always open)
export const StaticDisplay = {
    render: () => (
        <div style={{ padding: '40px' }}>
            <ConfirmationPopover
                isOpen={true}
                title="Log out of Nexum?"
                actions={[
                    { label: 'Cancel', variant: 'outline', onClick: () => {} },
                    { label: 'Log out', variant: 'destructive', onClick: () => {} },
                ]}
            />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Static display of the popover for documentation purposes.',
            },
        },
    },
};

// With description static
export const WithDescriptionStatic = {
    render: () => (
        <div style={{ padding: '40px' }}>
            <ConfirmationPopover
                isOpen={true}
                title="Create Branch?"
                description="You've changed more than 30% of article"
                actions={[
                    { label: 'Cancel', variant: 'outline', onClick: () => {} },
                    { label: 'Create Branch', variant: 'success', onClick: () => {}, icon: <GitBranch size={16} /> },
                ]}
            />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Static display with description for documentation purposes.',
            },
        },
    },
};
