import React, { useState } from 'react';
import UserSettings from '../components/UserSettings';
import Button from '../components/Button/Button';

export default {
    title: 'Settings/UserSettings',
    component: UserSettings,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
User settings dialog with two tabs: User Details and Security.

## Features
- **User Details**: Edit personal info, work details, and account settings
- **Security**: Change password and manage sessions
- **Tab Navigation**: Switch between sections with left sidebar
- **Form Validation**: Client-side validation for password change

## Usage
Open the dialog by clicking the button in the Interactive Demo.
                `,
            },
        },
    },
    tags: ['autodocs'],
};

const mockUser = {
    firstName: 'Viktor',
    lastName: 'Gromov',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor',
    email: 'v.gromou@gmail.com',
    username: '@vgromou',
    birthday: '16.03.2000',
    location: 'Obninsk, Kaluga oblast, Russia',
    jobTitle: 'system_analyst',
    department: 'system_analysis',
    orgRole: 'Member',
    spaceRole: 'Admin',
    passwordLastChanged: '2026-01-15',
};

export const InteractiveDemo = {
    render: () => {
        const Demo = () => {
            const [isOpen, setIsOpen] = useState(false);

            const handleSave = (data) => {
                console.log('Save profile:', data);
                alert('Profile saved!\n\n' + JSON.stringify(data, null, 2));
            };

            const handleChangePassword = (data) => {
                console.log('Change password:', data);
                alert('Password changed!');
            };

            return (
                <div>
                    <Button variant="primary" onClick={() => setIsOpen(true)}>
                        Open User Settings
                    </Button>

                    <UserSettings
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        user={mockUser}
                        onSave={handleSave}
                        onChangePassword={handleChangePassword}
                    />
                </div>
            );
        };

        return <Demo />;
    },
    parameters: {
        docs: {
            description: {
                story: 'Click the button to open the User Settings dialog. Try switching between tabs and editing fields.',
            },
        },
    },
};

export const UserDetailsTab = {
    render: () => {
        const Demo = () => {
            const [isOpen, setIsOpen] = useState(true);

            return (
                <UserSettings
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    user={mockUser}
                    onSave={(data) => console.log('Save:', data)}
                />
            );
        };

        return <Demo />;
    },
    parameters: {
        docs: {
            description: {
                story: 'User Details tab showing profile editing form.',
            },
        },
    },
};

export const SecurityTab = {
    render: () => {
        const Demo = () => {
            const [isOpen, setIsOpen] = useState(true);
            const [activeTab, setActiveTab] = useState('security');

            // We need to control the tab state to show security tab
            return (
                <UserSettings
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    user={mockUser}
                    onChangePassword={(data) => console.log('Change password:', data)}
                />
            );
        };

        return <Demo />;
    },
    parameters: {
        docs: {
            description: {
                story: 'Security tab showing password change form.',
            },
        },
    },
};

export const NewUser = {
    render: () => {
        const Demo = () => {
            const [isOpen, setIsOpen] = useState(true);

            const newUser = {
                firstName: 'New',
                lastName: 'User',
                email: 'new.user@example.com',
                username: '@newuser',
                orgRole: 'Member',
                spaceRole: 'Viewer',
            };

            return (
                <UserSettings
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    user={newUser}
                    onSave={(data) => console.log('Save:', data)}
                />
            );
        };

        return <Demo />;
    },
    parameters: {
        docs: {
            description: {
                story: 'User settings for a new user with minimal data.',
            },
        },
    },
};
