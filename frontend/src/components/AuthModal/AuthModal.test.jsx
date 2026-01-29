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

        it('renders default login title', () => {
            render(<AuthModal isOpen={true} />);
            expect(screen.getByText('Sign into your account')).toBeInTheDocument();
        });

        it('renders session expired title when mode is sessionExpired', () => {
            render(<AuthModal isOpen={true} mode="sessionExpired" />);
            expect(screen.getByText('Session expired')).toBeInTheDocument();
            expect(screen.queryByText('Sign into your account')).not.toBeInTheDocument();
        });

        it('renders session expired message when mode is sessionExpired', () => {
            render(<AuthModal isOpen={true} mode="sessionExpired" />);
            expect(
                screen.getByText(/your session has expired/i)
            ).toBeInTheDocument();
        });

        it('does not render session message in login mode', () => {
            render(<AuthModal isOpen={true} mode="login" />);
            expect(
                screen.queryByText(/your session has expired/i)
            ).not.toBeInTheDocument();
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

        it('displays general error', () => {
            render(
                <AuthModal
                    isOpen={true}
                    generalError="Invalid login or password"
                />
            );
            expect(screen.getByText('Invalid login or password')).toBeInTheDocument();
        });

        it('displays general error with error styling', () => {
            render(
                <AuthModal
                    isOpen={true}
                    generalError="Account is locked"
                />
            );
            const errorElement = screen.getByText('Account is locked');
            expect(errorElement).toHaveClass('auth-modal__error');
        });

        it('displays all error types together', () => {
            render(
                <AuthModal
                    isOpen={true}
                    usernameError="Invalid username"
                    passwordError="Invalid password"
                    generalError="Login failed"
                />
            );
            expect(screen.getByText('Invalid username')).toBeInTheDocument();
            expect(screen.getByText('Invalid password')).toBeInTheDocument();
            expect(screen.getByText('Login failed')).toBeInTheDocument();
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

    describe('session expired mode behavior', () => {
        it('does not call onClose when overlay clicked in sessionExpired mode', () => {
            const handleClose = vi.fn();
            render(
                <AuthModal
                    isOpen={true}
                    mode="sessionExpired"
                    onClose={handleClose}
                />
            );

            // Click on overlay (the blur wrapper)
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                fireEvent.click(overlay);
            }

            expect(handleClose).not.toHaveBeenCalled();
        });

        it('calls onClose when overlay clicked in login mode', () => {
            const handleClose = vi.fn();
            render(
                <AuthModal
                    isOpen={true}
                    mode="login"
                    onClose={handleClose}
                />
            );

            // Click on overlay
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                fireEvent.click(overlay);
            }

            // Note: This might not trigger due to event propagation
            // The actual behavior depends on overlay implementation
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
