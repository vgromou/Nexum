import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthModal from './AuthModal';

describe('AuthModal', () => {
    describe('rendering', () => {
        it('does not render when isOpen is false', () => {
            render(<AuthModal isOpen={false} />);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders when isOpen is true', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('renders logo and brand name', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByAltText('Nexum logo')).toBeInTheDocument();
            expect(screen.getByText('Nexum')).toBeInTheDocument();
        });

        it('renders title', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByText('Sign into your account')).toBeInTheDocument();
        });

        it('renders username and password fields', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByText(/username or email/i)).toBeInTheDocument();
            expect(screen.getByText(/^password$/i)).toBeInTheDocument();
            expect(screen.getAllByPlaceholderText(/paste or type/i)).toHaveLength(2);
        });

        it('renders submit button', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });
    });

    describe('form interactions', () => {
        it('allows typing in username field', () => {
            render(<AuthModal isOpen={true} />);
            const inputs = screen.getAllByPlaceholderText(/paste or type/i);
            const usernameField = inputs[0];

            fireEvent.change(usernameField, { target: { value: 'testuser' } });
            expect(usernameField).toHaveValue('testuser');
        });

        it('allows typing in password field', () => {
            render(<AuthModal isOpen={true} />);
            const inputs = screen.getAllByPlaceholderText(/paste or type/i);
            const passwordField = inputs[1];

            fireEvent.change(passwordField, { target: { value: 'secret123' } });
            expect(passwordField).toHaveValue('secret123');
        });

        it('toggles password visibility', () => {
            render(<AuthModal isOpen={true} />);
            const inputs = screen.getAllByPlaceholderText(/paste or type/i);
            const passwordField = inputs[1];
            // Get the icon button in the password field wrapper
            const toggleButton = passwordField.parentElement.querySelector('button');

            // Initially password type
            expect(passwordField).toHaveAttribute('type', 'password');

            // Click toggle
            fireEvent.click(toggleButton);
            expect(passwordField).toHaveAttribute('type', 'text');

            // Click toggle again
            fireEvent.click(toggleButton);
            expect(passwordField).toHaveAttribute('type', 'password');
        });

        it('calls onSubmit with credentials when form is submitted', () => {
            const handleSubmit = vi.fn();
            render(<AuthModal isOpen={true} onSubmit={handleSubmit} />);

            const inputs = screen.getAllByPlaceholderText(/paste or type/i);
            const usernameField = inputs[0];
            const passwordField = inputs[1];
            const submitButton = screen.getByRole('button', { name: /sign in/i });

            fireEvent.change(usernameField, { target: { value: 'testuser' } });
            fireEvent.change(passwordField, { target: { value: 'secret123' } });
            fireEvent.click(submitButton);

            expect(handleSubmit).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'secret123',
            });
        });
    });

    describe('error states', () => {
        it('displays username error', () => {
            render(
                <AuthModal
                    isOpen={true}
                    usernameError="There is no user with such Username"
                />
            );
            expect(screen.getByText('There is no user with such Username')).toBeInTheDocument();
        });

        it('displays password error', () => {
            render(
                <AuthModal
                    isOpen={true}
                    passwordError="Password is wrong"
                />
            );
            expect(screen.getByText('Password is wrong')).toBeInTheDocument();
        });

        it('displays both errors', () => {
            render(
                <AuthModal
                    isOpen={true}
                    usernameError="Invalid username"
                    passwordError="Invalid password"
                />
            );
            expect(screen.getByText('Invalid username')).toBeInTheDocument();
            expect(screen.getByText('Invalid password')).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('shows loading text and spinner when isLoading', () => {
            render(<AuthModal isOpen={true} isLoading={true} />);
            expect(screen.getByText(/signing in/i)).toBeInTheDocument();
        });

        it('disables submit button when loading', () => {
            render(<AuthModal isOpen={true} isLoading={true} />);
            const submitButton = screen.getByRole('button', { name: /signing in/i });
            expect(submitButton).toBeDisabled();
        });

        it('disables input fields when loading', () => {
            render(<AuthModal isOpen={true} isLoading={true} />);
            const inputs = screen.getAllByPlaceholderText(/paste or type/i);
            expect(inputs[0]).toBeDisabled();
            expect(inputs[1]).toBeDisabled();
        });

        it('does not call onSubmit when loading', () => {
            const handleSubmit = vi.fn();
            render(<AuthModal isOpen={true} isLoading={true} onSubmit={handleSubmit} />);

            const submitButton = screen.getByRole('button', { name: /signing in/i });
            fireEvent.click(submitButton);

            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('has dialog role', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('has aria-modal attribute', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });

        it('has aria-labelledby pointing to title', () => {
            render(<AuthModal isOpen={true} />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'auth-modal-title');
        });
    });
});
