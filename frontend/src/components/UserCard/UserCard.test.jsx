import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserCard from './UserCard';

describe('UserCard', () => {
    const mockOnClose = vi.fn();
    const mockOnLogout = vi.fn();
    const mockOnSettings = vi.fn();
    const mockOnNotificationClick = vi.fn();

    const defaultUser = {
        firstName: 'Viktor',
        lastName: 'Gromov',
        avatarUrl: 'https://example.com/avatar.jpg',
        description: '25 y.o. Business Analyst',
        email: 'v.gromou@gmail.com',
        username: '@vgromou',
        orgRole: 'Member',
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

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic rendering', () => {
        it('renders nothing when isOpen is false', () => {
            render(
                <UserCard isOpen={false} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders nothing when user is null', () => {
            render(
                <UserCard isOpen={true} user={null} onClose={mockOnClose} />
            );
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders card when isOpen is true and user is provided', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('renders user name', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Both compact and expanded modes render the name
            expect(screen.getAllByText('Viktor Gromov')).toHaveLength(2);
        });

        it('renders user description in compact mode', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Description only appears in compact mode
            expect(screen.getByText('25 y.o. Business Analyst')).toBeInTheDocument();
        });

        it('renders user email as copyable button', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Email appears in both modes as copyable buttons
            const emailButtons = screen.getAllByText('v.gromou@gmail.com');
            expect(emailButtons.length).toBeGreaterThan(0);
            expect(emailButtons[0].tagName).toBe('BUTTON');
            expect(emailButtons[0]).toHaveClass('user-card__copyable');
        });

        it('renders username', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Username appears in both modes
            expect(screen.getAllByText('@vgromou').length).toBeGreaterThan(0);
        });

        it('renders role badges for org and space', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Both role badges appear in both modes
            expect(screen.getAllByText('Member').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
        });

        it('renders avatar image when avatarUrl is provided', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Avatar appears in both modes
            const avatars = screen.getAllByAltText('Viktor Gromov');
            expect(avatars.length).toBeGreaterThan(0);
            expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        });
    });

    describe('Contact layout', () => {
        it('renders contacts inline when short', () => {
            const { container } = render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            const contacts = container.querySelector('.user-card__contacts--inline');
            expect(contacts).toBeInTheDocument();
        });

        it('renders contacts stacked when long', () => {
            const { container } = render(
                <UserCard isOpen={true} user={longContactsUser} onClose={mockOnClose} />
            );
            const contacts = container.querySelector('.user-card__contacts--stacked');
            expect(contacts).toBeInTheDocument();
        });

        it('renders separator between email and username when inline in compact mode', () => {
            const { container } = render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Separator only appears in compact mode when contacts are inline
            const separator = container.querySelector('.user-card__contacts-separator');
            expect(separator).toBeInTheDocument();
            expect(separator).toHaveTextContent('•');
        });
    });

    describe('Header buttons', () => {
        it('renders logout buttons in both modes', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getAllByRole('button', { name: 'Log out' })).toHaveLength(2);
        });

        it('renders settings buttons in both modes', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getAllByRole('button', { name: 'Settings' })).toHaveLength(2);
        });

        it('renders expand button in compact mode', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getByRole('button', { name: 'Expand details' })).toBeInTheDocument();
        });

        it('renders collapse button in expanded mode', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getByRole('button', { name: 'Collapse details' })).toBeInTheDocument();
        });

        it('renders close buttons in both modes', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
        });

        it('renders notification buttons in both modes', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            expect(screen.getAllByRole('button', { name: 'Notifications' })).toHaveLength(2);
        });
    });

    describe('Button callbacks', () => {
        it('calls onClose when close button is clicked', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('calls onLogout when logout button is clicked', () => {
            render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onLogout={mockOnLogout}
                />
            );
            fireEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]);
            expect(mockOnLogout).toHaveBeenCalledTimes(1);
        });

        it('calls onSettings when settings button is clicked', () => {
            render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onSettings={mockOnSettings}
                />
            );
            fireEvent.click(screen.getAllByRole('button', { name: 'Settings' })[0]);
            expect(mockOnSettings).toHaveBeenCalledTimes(1);
        });

        it('calls onNotificationClick when notification button is clicked', () => {
            render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onNotificationClick={mockOnNotificationClick}
                />
            );
            fireEvent.click(screen.getAllByRole('button', { name: 'Notifications' })[0]);
            expect(mockOnNotificationClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Expand/Collapse', () => {
        it('toggles to expanded mode when expand button is clicked', async () => {
            const { container } = render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            // Initially compact mode is visible
            const compactContent = container.querySelector('.user-card__content--compact');
            expect(compactContent).toHaveClass('user-card__content--visible');

            // Click expand button
            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            // Wait for expanded mode
            await waitFor(() => {
                const expandedContent = container.querySelector('.user-card__content--expanded');
                expect(expandedContent).toHaveClass('user-card__content--visible');
            });
        });

        it('renders collapse button in expanded mode', async () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Collapse details' })).toBeInTheDocument();
            });
        });
    });

    describe('Expanded mode content', () => {
        it('renders PERSONAL section with birthday and location', async () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            await waitFor(() => {
                expect(screen.getByText('PERSONAL')).toBeInTheDocument();
                expect(screen.getByText('Birthday')).toBeInTheDocument();
                expect(screen.getByText('16.03.2000')).toBeInTheDocument();
                expect(screen.getByText('Location')).toBeInTheDocument();
                expect(screen.getByText('Obninsk city, Kaluga oblast')).toBeInTheDocument();
            });
        });

        it('renders WORK section with job title and department', async () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            await waitFor(() => {
                expect(screen.getByText('WORK')).toBeInTheDocument();
                expect(screen.getByText('Job Title')).toBeInTheDocument();
                expect(screen.getByText('Business Analyst')).toBeInTheDocument();
                expect(screen.getByText('Department')).toBeInTheDocument();
                expect(screen.getByText('Analysis Department')).toBeInTheDocument();
            });
        });

        it('renders ACCOUNT section with email and username', async () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            await waitFor(() => {
                expect(screen.getByText('ACCOUNT')).toBeInTheDocument();
                expect(screen.getByText('E-mail')).toBeInTheDocument();
                expect(screen.getByText('Username')).toBeInTheDocument();
            });
        });
    });

    describe('Keyboard interactions', () => {
        it('calls onClose when Escape is pressed', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Copy to clipboard', () => {
        beforeEach(() => {
            // Mock clipboard API
            Object.assign(navigator, {
                clipboard: {
                    writeText: vi.fn().mockResolvedValue(undefined),
                },
            });
        });

        it('copies email to clipboard when clicked', async () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            const emailButtons = screen.getAllByText('v.gromou@gmail.com');
            fireEvent.click(emailButtons[0]);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('v.gromou@gmail.com');
            });
        });

        it('copies username to clipboard when clicked', async () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            const usernameButtons = screen.getAllByText('@vgromou');
            fireEvent.click(usernameButtons[0]);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('@vgromou');
            });
        });

        it('shows copied state after clicking', async () => {
            const { container } = render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            const emailButtons = screen.getAllByText('v.gromou@gmail.com');
            fireEvent.click(emailButtons[0]);

            await waitFor(() => {
                // Query for the element again after state update
                const copiedButton = container.querySelector('.user-card__copyable--copied');
                expect(copiedButton).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('has role="dialog" and aria-modal="true"', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('has aria-label for user profile', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-label', 'User profile');
        });

        it('all buttons have aria-label', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );

            expect(screen.getAllByRole('button', { name: 'Log out' })).toHaveLength(2);
            expect(screen.getAllByRole('button', { name: 'Settings' })).toHaveLength(2);
            expect(screen.getByRole('button', { name: 'Expand details' })).toBeInTheDocument();
            expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
            expect(screen.getAllByRole('button', { name: 'Notifications' })).toHaveLength(2);
        });
    });

    describe('Logout loading state', () => {
        it('shows spinner icon when isLoggingOut is true', () => {
            const { container } = render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onLogout={mockOnLogout}
                    isLoggingOut={true}
                />
            );

            const spinners = container.querySelectorAll('.user-card__spinner');
            expect(spinners.length).toBe(2); // Both compact and expanded modes
        });

        it('disables logout button when isLoggingOut is true', () => {
            render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onLogout={mockOnLogout}
                    isLoggingOut={true}
                />
            );

            const logoutButtons = screen.getAllByRole('button', { name: 'Logging out...' });
            expect(logoutButtons).toHaveLength(2);
            logoutButtons.forEach(button => {
                expect(button).toBeDisabled();
            });
        });

        it('disables other header buttons when isLoggingOut is true', () => {
            render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onLogout={mockOnLogout}
                    onSettings={mockOnSettings}
                    isLoggingOut={true}
                />
            );

            // Settings buttons should be disabled
            const settingsButtons = screen.getAllByRole('button', { name: 'Settings' });
            settingsButtons.forEach(button => {
                expect(button).toBeDisabled();
            });

            // Close buttons should be disabled
            const closeButtons = screen.getAllByRole('button', { name: 'Close' });
            closeButtons.forEach(button => {
                expect(button).toBeDisabled();
            });
        });

        it('shows normal logout button when isLoggingOut is false', () => {
            render(
                <UserCard
                    isOpen={true}
                    user={defaultUser}
                    onClose={mockOnClose}
                    onLogout={mockOnLogout}
                    isLoggingOut={false}
                />
            );

            const logoutButtons = screen.getAllByRole('button', { name: 'Log out' });
            expect(logoutButtons).toHaveLength(2);
            logoutButtons.forEach(button => {
                expect(button).not.toBeDisabled();
            });
        });
    });

    describe('Optional data handling', () => {
        it('renders without description when not provided', () => {
            const userWithoutDescription = { ...defaultUser, description: undefined };
            render(
                <UserCard isOpen={true} user={userWithoutDescription} onClose={mockOnClose} />
            );
            expect(screen.queryByText('25 y.o. Business Analyst')).not.toBeInTheDocument();
        });

        it('renders both org and space role badges', () => {
            render(
                <UserCard isOpen={true} user={defaultUser} onClose={mockOnClose} />
            );
            // Each role appears in both compact and expanded modes
            expect(screen.getAllByText('Member')).toHaveLength(2); // orgRole
            expect(screen.getAllByText('Admin')).toHaveLength(2); // spaceRole
        });

        it('shows "Not provided" for missing optional fields in expanded mode', async () => {
            const minimalUser = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                username: '@testuser',
                orgRole: 'Member',
                spaceRole: 'Viewer',
            };
            render(
                <UserCard isOpen={true} user={minimalUser} onClose={mockOnClose} />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            await waitFor(() => {
                // 4 optional fields: birthday, location, jobTitle, department
                const notProvidedTexts = screen.getAllByText('Not provided');
                expect(notProvidedTexts.length).toBe(4);
            });
        });

        it('always shows all sections in expanded mode', async () => {
            const minimalUser = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                username: '@testuser',
                orgRole: 'Member',
                spaceRole: 'Viewer',
            };
            render(
                <UserCard isOpen={true} user={minimalUser} onClose={mockOnClose} />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));

            await waitFor(() => {
                expect(screen.getByText('PERSONAL')).toBeInTheDocument();
                expect(screen.getByText('WORK')).toBeInTheDocument();
                expect(screen.getByText('ACCOUNT')).toBeInTheDocument();
            });
        });
    });
});
