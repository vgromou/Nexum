import React, { useState, useRef } from 'react';
import UserCard from '../components/UserCard';
import UserButton from '../components/Navigation/UserButton';

export default {
    title: 'Navigation/UserCard',
    component: UserCard,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
User profile card with two display modes: compact and expanded.

## Features
- **Compact mode**: Shows avatar, name, description, contacts, and role badges
- **Expanded mode**: Shows full profile with personal, work, and account sections
- **Smooth animation**: macOS-style resize animation when switching modes
- **Smart contacts layout**: Automatically stacks email/username when too long
- **Accessible**: Full keyboard support and ARIA attributes

## Modes
1. **Compact (one line)**: When email + username are short enough to fit on one line
2. **Compact (stacked)**: When email + username are too long, they stack vertically
3. **Expanded**: Full profile view with all details organized in sections
                `,
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        isOpen: {
            description: 'Controls card visibility',
            control: 'boolean',
        },
        user: {
            description: 'User data object',
            control: 'object',
        },
        onClose: {
            description: 'Callback when card should close',
            action: 'close',
        },
        onLogout: {
            description: 'Callback when logout is clicked',
            action: 'logout',
        },
        onSettings: {
            description: 'Callback when settings is clicked',
            action: 'settings',
        },
        onNotificationClick: {
            description: 'Callback when notification button is clicked',
            action: 'notification',
        },
    },
};

const defaultUser = {
    firstName: 'Viktor',
    lastName: 'Gromov',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor',
    description: '25 y.o. Business Analyst',
    email: 'v.gromou@gmail.com',
    username: '@vgromou',
    orgRole: 'Admin',
    spaceRole: 'Admin',
    birthday: '16.03.2000',
    location: 'Obninsk city, Kaluga oblast',
    jobTitle: 'Business Analyst',
    department: 'Analysis Department',
};

const longContactsUser = {
    ...defaultUser,
    email: 'toomuchsymbolsinemail@gmail.com',
    username: '@verylongusername',
};

const multiRoleUser = {
    ...defaultUser,
    orgRole: 'Member',
    spaceRole: 'Admin',
};

// Wrapper to add position context
const CardWrapper = ({ children }) => (
    <div style={{
        position: 'relative',
        width: '500px',
        height: '600px',
        border: '1px dashed var(--border-default)',
        borderRadius: '8px',
    }}>
        {children}
    </div>
);

export const CompactShortContacts = {
    render: () => (
        <CardWrapper>
            <UserCard
                isOpen={true}
                user={defaultUser}
                className="user-card--static"
            />
            <style>{`
                .user-card--static {
                    position: relative !important;
                    bottom: auto !important;
                    left: auto !important;
                    opacity: 1 !important;
                    transform: none !important;
                    margin: 16px auto;
                }
            `}</style>
        </CardWrapper>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Compact mode with short email and username displayed on a single line.',
            },
        },
    },
};

export const CompactLongContacts = {
    render: () => (
        <CardWrapper>
            <UserCard
                isOpen={true}
                user={longContactsUser}
                className="user-card--static"
            />
            <style>{`
                .user-card--static {
                    position: relative !important;
                    bottom: auto !important;
                    left: auto !important;
                    opacity: 1 !important;
                    transform: none !important;
                    margin: 16px auto;
                }
            `}</style>
        </CardWrapper>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Compact mode with long email and username stacked vertically.',
            },
        },
    },
};

export const ExpandedMode = {
    render: () => (
        <CardWrapper>
            <UserCard
                isOpen={true}
                user={multiRoleUser}
                className="user-card--static user-card--force-expanded"
            />
            <style>{`
                .user-card--static {
                    position: relative !important;
                    bottom: auto !important;
                    left: auto !important;
                    opacity: 1 !important;
                    transform: none !important;
                    margin: 16px auto;
                }
                .user-card--force-expanded .user-card__content--compact {
                    display: none !important;
                }
                .user-card--force-expanded .user-card__content--expanded {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .user-card--force-expanded {
                    width: 480px !important;
                    height: auto !important;
                }
            `}</style>
        </CardWrapper>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Expanded mode showing full profile with personal, work, and account sections.',
            },
        },
    },
};

export const InteractiveDemo = {
    render: () => {
        const Demo = () => {
            const [isOpen, setIsOpen] = useState(false);
            const buttonRef = useRef(null);

            return (
                <div style={{
                    position: 'relative',
                    width: '500px',
                    height: '700px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    paddingBottom: '20px',
                }}>
                    <div style={{ position: 'relative' }}>
                        <div ref={buttonRef} style={{ width: '280px' }}>
                            <UserButton
                                avatarUrl={defaultUser.avatarUrl}
                                name={`${defaultUser.firstName} ${defaultUser.lastName}`}
                                role={defaultUser.jobTitle}
                                onUserClick={() => setIsOpen(true)}
                                onNotificationClick={() => alert('Notifications!')}
                            />
                        </div>

                        <UserCard
                            isOpen={isOpen}
                            user={multiRoleUser}
                            anchorRef={buttonRef}
                            onClose={() => setIsOpen(false)}
                            onLogout={() => {
                                alert('Logout clicked!');
                                setIsOpen(false);
                            }}
                            onSettings={() => alert('Settings clicked!')}
                            onNotificationClick={() => alert('Notifications clicked!')}
                        />
                    </div>

                    <style>{`
                        .user-button-container {
                            margin: 0 !important;
                        }
                    `}</style>
                </div>
            );
        };

        return <Demo />;
    },
    parameters: {
        docs: {
            description: {
                story: 'Click the UserButton to open the card. Try expanding/collapsing with the maximize button. Press Escape or click outside to close.',
            },
        },
    },
};

export const AllModes = {
    render: () => (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            {/* Compact - Short Contacts */}
            <div>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '12px',
                    textAlign: 'center'
                }}>
                    Compact (short contacts)
                </div>
                <div style={{ position: 'relative' }}>
                    <UserCard
                        isOpen={true}
                        user={defaultUser}
                        className="user-card--static"
                    />
                </div>
            </div>

            {/* Compact - Long Contacts */}
            <div>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '12px',
                    textAlign: 'center'
                }}>
                    Compact (long contacts)
                </div>
                <div style={{ position: 'relative' }}>
                    <UserCard
                        isOpen={true}
                        user={longContactsUser}
                        className="user-card--static"
                    />
                </div>
            </div>

            {/* Expanded */}
            <div>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '12px',
                    textAlign: 'center'
                }}>
                    Expanded
                </div>
                <div style={{ position: 'relative' }}>
                    <UserCard
                        isOpen={true}
                        user={multiRoleUser}
                        className="user-card--static user-card--force-expanded"
                    />
                </div>
            </div>

            <style>{`
                .user-card--static {
                    position: relative !important;
                    bottom: auto !important;
                    left: auto !important;
                    opacity: 1 !important;
                    transform: none !important;
                }
                .user-card--force-expanded .user-card__content--compact {
                    display: none !important;
                }
                .user-card--force-expanded .user-card__content--expanded {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .user-card--force-expanded {
                    width: 480px !important;
                    height: auto !important;
                }
            `}</style>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All three display modes side by side for comparison.',
            },
        },
    },
};

export const WithoutOptionalData = {
    render: () => (
        <CardWrapper>
            <UserCard
                isOpen={true}
                user={{
                    firstName: 'John',
                    lastName: 'Doe',
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
                    email: 'john.doe@example.com',
                    username: '@johndoe',
                    orgRole: 'Member',
                    spaceRole: 'Viewer',
                }}
                className="user-card--static"
            />
            <style>{`
                .user-card--static {
                    position: relative !important;
                    bottom: auto !important;
                    left: auto !important;
                    opacity: 1 !important;
                    transform: none !important;
                    margin: 16px auto;
                }
            `}</style>
        </CardWrapper>
    ),
    parameters: {
        docs: {
            description: {
                story: 'User card with only required data. Shows "Not provided" for missing optional fields.',
            },
        },
    },
};

export const ExpandedWithMissingData = {
    render: () => (
        <div style={{ position: 'relative', width: '500px', height: '600px' }}>
            <UserCard
                isOpen={true}
                user={{
                    firstName: 'Partial',
                    lastName: 'User',
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Partial',
                    email: 'partial@example.com',
                    username: '@partialuser',
                    orgRole: 'Member',
                    spaceRole: 'Viewer',
                }}
                className="user-card--static user-card--force-expanded"
            />
            <style>{`
                .user-card--static {
                    position: relative !important;
                    bottom: auto !important;
                    left: auto !important;
                    opacity: 1 !important;
                    transform: none !important;
                }
                .user-card--force-expanded .user-card__content--compact {
                    display: none !important;
                }
                .user-card--force-expanded .user-card__content--expanded {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .user-card--force-expanded {
                    width: 480px !important;
                    height: auto !important;
                }
            `}</style>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Expanded mode with only required fields. Optional fields display "Not provided".',
            },
        },
    },
};
