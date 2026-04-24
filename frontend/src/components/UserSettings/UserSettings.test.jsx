import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserSettings from './UserSettings';
import { ToastProvider } from '../Toast';

const render = (ui) => rtlRender(<ToastProvider>{ui}</ToastProvider>);

const mockUser = {
    firstName: 'Viktor',
    lastName: 'Gromov',
    avatarUrl: 'https://example.com/avatar.jpg',
    email: 'v.gromou@gmail.com',
    username: '@vgromou',
    birthday: '16.03.2000',
    location: 'Obninsk, Russia',
    jobTitle: 'system_analyst',
    department: 'system_analysis',
    orgRole: 'Member',
    spaceRole: 'Admin',
    passwordLastChanged: '2026-01-15',
};

describe('UserSettings', () => {
    describe('Rendering', () => {
        it('renders nothing when closed', () => {
            render(<UserSettings isOpen={false} user={mockUser} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders dialog when open', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('User Details')).toBeInTheDocument();
        });

        it('renders user name and roles', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByText('Viktor Gromov')).toBeInTheDocument();
            expect(screen.getByText('Member')).toBeInTheDocument();
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });

        it('renders avatar when avatarUrl is provided', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            const avatar = screen.getByAltText('Viktor Gromov');
            expect(avatar).toBeInTheDocument();
            expect(avatar).toHaveAttribute('src', mockUser.avatarUrl);
        });
    });

    describe('Tab Navigation', () => {
        it('shows User Details tab by default', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByText('User Details')).toBeInTheDocument();
            expect(screen.getByText('PERSONAL')).toBeInTheDocument();
        });

        it('switches to Security tab when clicked', async () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            const securityTab = screen.getByLabelText('Security');
            fireEvent.click(securityTab);

            await waitFor(() => {
                expect(screen.getByText('Security')).toBeInTheDocument();
                expect(screen.getByText('Password')).toBeInTheDocument();
            });
        });
    });

    describe('User Details Form', () => {
        it('renders all form fields', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByLabelText('First Name')).toBeInTheDocument();
            expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
            expect(screen.getByLabelText('Birthday')).toBeInTheDocument();
            expect(screen.getByLabelText('Location')).toBeInTheDocument();
            expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
            expect(screen.getByLabelText('Username')).toBeInTheDocument();
        });

        it('populates fields with user data', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByLabelText('First Name')).toHaveValue('Viktor');
            expect(screen.getByLabelText('Last Name')).toHaveValue('Gromov');
            expect(screen.getByLabelText('E-mail')).toHaveValue('v.gromou@gmail.com');
        });

        it('calls onSave when Save button is clicked after form change', async () => {
            const onSave = vi.fn();
            render(<UserSettings isOpen={true} user={mockUser} onSave={onSave} />);

            // Modify form to enable Save button
            const firstNameInput = screen.getByLabelText('First Name');
            fireEvent.change(firstNameInput, { target: { value: 'NewName' } });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
            });

            const saveButton = screen.getByRole('button', { name: 'Save' });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(onSave).toHaveBeenCalled();
                // After save, buttons should be disabled again
                expect(saveButton).toBeDisabled();
            });
        });

        it('renders Save and Discard buttons in footer', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
        });

        it('disables Save and Discard buttons when form is not dirty', () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
        });

        it('enables buttons when form is modified', async () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            const firstNameInput = screen.getByLabelText('First Name');
            fireEvent.change(firstNameInput, { target: { value: 'NewName' } });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
                expect(screen.getByRole('button', { name: 'Discard' })).not.toBeDisabled();
            });
        });

        it('resets form when Discard is clicked', async () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            const firstNameInput = screen.getByLabelText('First Name');
            fireEvent.change(firstNameInput, { target: { value: 'NewName' } });

            await waitFor(() => {
                expect(firstNameInput).toHaveValue('NewName');
            });

            const discardButton = screen.getByRole('button', { name: 'Discard' });
            fireEvent.click(discardButton);

            await waitFor(() => {
                expect(firstNameInput).toHaveValue('Viktor');
                expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
            });
        });
    });

    describe('Security Form', () => {
        it('renders password fields', async () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            const securityTab = screen.getByLabelText('Security');
            fireEvent.click(securityTab);

            await waitFor(() => {
                expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
                expect(screen.getByLabelText('New Password')).toBeInTheDocument();
            });
        });

        it('shows password last changed info', async () => {
            render(<UserSettings isOpen={true} user={mockUser} />);

            const securityTab = screen.getByLabelText('Security');
            fireEvent.click(securityTab);

            await waitFor(() => {
                expect(screen.getByText(/Last changed:/)).toBeInTheDocument();
            });
        });
    });

    describe('Close Behavior', () => {
        it('calls onClose when close button is clicked', () => {
            const onClose = vi.fn();
            render(<UserSettings isOpen={true} user={mockUser} onClose={onClose} />);

            const closeButton = screen.getByLabelText('Close dialog');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });

        it('calls onClose when Escape is pressed', () => {
            const onClose = vi.fn();
            render(<UserSettings isOpen={true} user={mockUser} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });
    });
});
