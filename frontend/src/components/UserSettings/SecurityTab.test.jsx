import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SecurityTab from './SecurityTab';
import { ToastProvider } from '../Toast';

const renderWithProviders = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

const makeApiError = (fields) => {
    const err = new Error('Validation');
    err.response = {
        status: 400,
        data: {
            error: {
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Please check the form fields',
                displayType: 'field',
                details: { fields },
            },
        },
    };
    return err;
};

describe('SecurityTab', () => {
    it('shows inline error under Current Password on incorrect current password', async () => {
        const changePassword = vi.fn().mockRejectedValue(
            makeApiError({
                currentPassword: [
                    { code: 'AUTH_INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' },
                ],
            })
        );

        renderWithProviders(<SecurityTab changePassword={changePassword} />);

        fireEvent.change(screen.getByLabelText('Current Password'), {
            target: { value: 'wrong' },
        });
        fireEvent.change(screen.getByLabelText('New Password'), {
            target: { value: 'ValidPass123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));

        await waitFor(() => {
            expect(changePassword).toHaveBeenCalledWith('wrong', 'ValidPass123');
        });

        await waitFor(() => {
            expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
        });

        // Both fields are cleared after submit (per product request: avoid
        // leaving secrets in the DOM; the inline error is the feedback channel).
        expect(screen.getByLabelText('Current Password')).toHaveValue('');
        expect(screen.getByLabelText('New Password')).toHaveValue('');
    });

    it('does not call API when validation fails for empty fields', () => {
        const changePassword = vi.fn();
        renderWithProviders(<SecurityTab changePassword={changePassword} />);

        fireEvent.click(screen.getByRole('button', { name: /change password/i }));

        expect(changePassword).not.toHaveBeenCalled();
        expect(screen.getByText('Current password is required')).toBeInTheDocument();
        expect(screen.getByText('New password is required')).toBeInTheDocument();
    });

    it('calls onChangePassword and resets fields on success', async () => {
        const changePassword = vi.fn().mockResolvedValue({ data: {} });
        const onChangePassword = vi.fn();
        renderWithProviders(
            <SecurityTab changePassword={changePassword} onChangePassword={onChangePassword} />
        );

        fireEvent.change(screen.getByLabelText('Current Password'), {
            target: { value: 'correct' },
        });
        fireEvent.change(screen.getByLabelText('New Password'), {
            target: { value: 'ValidPass123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));

        await waitFor(() => {
            expect(onChangePassword).toHaveBeenCalledWith({
                currentPassword: 'correct',
                newPassword: 'ValidPass123',
            });
        });

        expect(screen.getByLabelText('Current Password')).toHaveValue('');
        expect(screen.getByLabelText('New Password')).toHaveValue('');
    });

    it('clears inline error when user starts typing in Current Password again', async () => {
        const changePassword = vi.fn().mockRejectedValue(
            makeApiError({
                currentPassword: [
                    { code: 'AUTH_INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' },
                ],
            })
        );

        renderWithProviders(<SecurityTab changePassword={changePassword} />);

        fireEvent.change(screen.getByLabelText('Current Password'), {
            target: { value: 'wrong' },
        });
        fireEvent.change(screen.getByLabelText('New Password'), {
            target: { value: 'ValidPass123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));

        await waitFor(() => {
            expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Current Password'), {
            target: { value: 'new-attempt' },
        });

        expect(screen.queryByText('Current password is incorrect')).not.toBeInTheDocument();
    });
});
