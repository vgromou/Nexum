import React, { useState } from 'react';
import SidePanel from '../components/SidePanel';
import Button from '../components/Button';
import { Bell, Settings, User, FileText } from 'lucide-react';

export default {
    title: 'Components/SidePanel',
    component: SidePanel,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `A slide-in panel that appears over content from the left or right side.

**Features:**
- Positions: left or right
- Width range: 560px to 800px
- Optional tabs with icons
- Header with title and close button
- Footer for action buttons
- Keyboard support (Escape to close)
- Slide-in animation

**Tab States:**
- Default: White background
- Hover: Gray background
- Active: Purple light background
- Disabled: Muted icon`,
            },
        },
    },
    argTypes: {
        isOpen: {
            control: 'boolean',
            description: 'Controls panel visibility',
        },
        position: {
            control: { type: 'select' },
            options: ['left', 'right'],
            description: 'Panel position',
        },
        width: {
            control: { type: 'range', min: 560, max: 800, step: 10 },
            description: 'Panel width (560-800)',
        },
        title: {
            control: 'text',
            description: 'Panel title',
        },
    },
};

// Demo wrapper
const SidePanelDemo = (props) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ padding: '40px', minHeight: '100vh', background: '#F6F8FA' }}>
            <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Main Content</h1>
            <p style={{ marginBottom: '24px', color: '#6B7280' }}>
                Click the button to open the side panel.
            </p>
            <Button variant="primary" onClick={() => setIsOpen(true)}>
                Open Panel
            </Button>

            <SidePanel
                {...props}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};

// Default - Right Position
export const Default = {
    render: () => (
        <SidePanelDemo
            title="Panel Title"
            position="right"
            width={560}
            footer={
                <>
                    <Button variant="primary">Discard</Button>
                    <Button variant="primary">Save</Button>
                </>
            }
        >
            <div style={{ padding: '24px' }}>
                <p style={{ color: '#6B7280' }}>Panel content goes here.</p>
            </div>
        </SidePanelDemo>
    ),
};

// Left Position
export const LeftPosition = {
    render: () => (
        <SidePanelDemo
            title="Panel Title"
            position="left"
            width={560}
            footer={
                <>
                    <Button variant="primary">Discard</Button>
                    <Button variant="primary">Save</Button>
                </>
            }
        >
            <div style={{ padding: '24px' }}>
                <p style={{ color: '#6B7280' }}>Panel on the left side.</p>
            </div>
        </SidePanelDemo>
    ),
};

// Large Width
export const LargeWidth = {
    render: () => (
        <SidePanelDemo
            title="Large Panel"
            position="right"
            width={800}
            footer={
                <>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="primary">Submit</Button>
                </>
            }
        >
            <div style={{ padding: '24px' }}>
                <p style={{ color: '#6B7280' }}>This panel is 800px wide.</p>
            </div>
        </SidePanelDemo>
    ),
};

// With Tabs - Right
export const WithTabsRight = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        const [activeTab, setActiveTab] = useState('notifications');

        const tabs = [
            { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
            { id: 'settings', icon: <Settings size={24} />, label: 'Settings' },
            { id: 'profile', icon: <User size={24} />, label: 'Profile' },
            { id: 'docs', icon: <FileText size={24} />, label: 'Documents', disabled: true },
        ];

        const tabContent = {
            notifications: 'Notifications content',
            settings: 'Settings content',
            profile: 'Profile content',
            docs: 'Documents content',
        };

        return (
            <div style={{ padding: '40px', minHeight: '100vh', background: '#F6F8FA' }}>
                <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Main Content</h1>
                <Button variant="primary" onClick={() => setIsOpen(true)}>
                    Open Panel with Tabs
                </Button>

                <SidePanel
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Panel with Tabs"
                    position="right"
                    width={800}
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    footer={
                        <>
                            <Button variant="primary">Discard</Button>
                            <Button variant="primary">Save</Button>
                        </>
                    }
                >
                    <div style={{ padding: '24px' }}>
                        <p style={{ color: '#6B7280' }}>{tabContent[activeTab]}</p>
                    </div>
                </SidePanel>
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'Panel with tabs on the left side (position right). Tabs allow switching between different content sections.',
            },
        },
    },
};

// With Tabs - Left
export const WithTabsLeft = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        const [activeTab, setActiveTab] = useState('notifications');

        const tabs = [
            { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
            { id: 'settings', icon: <Settings size={24} />, label: 'Settings' },
            { id: 'profile', icon: <User size={24} />, label: 'Profile' },
        ];

        return (
            <div style={{ padding: '40px', minHeight: '100vh', background: '#F6F8FA' }}>
                <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Main Content</h1>
                <Button variant="primary" onClick={() => setIsOpen(true)}>
                    Open Left Panel with Tabs
                </Button>

                <SidePanel
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Left Panel"
                    position="left"
                    width={800}
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    footer={
                        <>
                            <Button variant="outline">Cancel</Button>
                            <Button variant="primary">Save</Button>
                        </>
                    }
                >
                    <div style={{ padding: '24px' }}>
                        <p style={{ color: '#6B7280' }}>Active tab: {activeTab}</p>
                    </div>
                </SidePanel>
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'Panel on the left with tabs on the right side.',
            },
        },
    },
};

// Without Footer
export const WithoutFooter = {
    render: () => (
        <SidePanelDemo
            title="No Footer"
            position="right"
            width={560}
        >
            <div style={{ padding: '24px' }}>
                <p style={{ color: '#6B7280' }}>This panel has no footer.</p>
            </div>
        </SidePanelDemo>
    ),
};

// Static Display (Always Open)
export const StaticDisplay = {
    render: () => (
        <div style={{ position: 'relative', height: '600px', background: '#F6F8FA', overflow: 'hidden' }}>
            <SidePanel
                isOpen={true}
                onClose={() => {}}
                title="Panel Title"
                position="right"
                width={560}
                footer={
                    <>
                        <Button variant="primary">Discard</Button>
                        <Button variant="primary">Save</Button>
                    </>
                }
            >
                <div style={{ padding: '24px' }}>
                    <p style={{ color: '#6B7280' }}>Static panel for documentation.</p>
                </div>
            </SidePanel>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Static display for documentation purposes.',
            },
        },
    },
};
