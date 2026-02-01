import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import Field from '../Field';
import Button from '../Button';
import { changePassword } from '../../api/authApi';
import { useApiCall } from '../../hooks/useApiCall';
import './PasswordChangeRequiredModal.css';

/**
 * PasswordChangeRequiredModal Component
 *
 * A modal that blocks the app when user must change their password.
 * Cannot be closed without changing password or logging out.
 *
 * @example
 * <PasswordChangeRequiredModal
 *   isOpen={mustChangePassword}
 *   onPasswordChanged={handlePasswordChanged}
 *   onLogout={handleLogout}
 * />
 */
const PasswordChangeRequiredModal = ({
    isOpen = false,
    onPasswordChanged,
    onLogout,
}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const { call, loading } = useApiCall();

    // Clear form on close
    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setFieldErrors({});
        }
    }, [isOpen]);

    // Validate form
    const validate = useCallback(() => {
        const errors = {};

        if (!currentPassword.trim()) {
            errors.currentPassword = 'Current password is required';
        }

        if (!newPassword.trim()) {
            errors.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentPassword, newPassword]);

    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setFieldErrors({});

        const { error, fieldErrors: apiFieldErrors } = await call(
            () => changePassword(currentPassword, newPassword)
        );

        if (error) {
            if (apiFieldErrors) {
                setFieldErrors(apiFieldErrors);
            }
            return;
        }

        // Success
        onPasswordChanged?.();
    }, [currentPassword, newPassword, validate, call, onPasswordChanged]);

    // Handle logout
    const handleLogout = useCallback(() => {
        if (!loading) {
            onLogout?.();
        }
    }, [loading, onLogout]);

    // Toggle password visibility
    const toggleCurrentPasswordVisibility = useCallback(() => {
        setShowCurrentPassword(prev => !prev);
    }, []);

    const toggleNewPasswordVisibility = useCallback(() => {
        setShowNewPassword(prev => !prev);
    }, []);

    const footer = (
        <div className="password-change-modal__footer">
            <Button
                variant="destructive-outline"
                onClick={handleLogout}
                disabled={loading}
            >
                Sign out
            </Button>
            <Button
                type="submit"
                variant="primary"
                disabled={loading}
                form="password-change-form"
            >
                {loading ? (
                    <>
                        Saving
                        <Loader2 size={20} className="password-change-modal__spinner" />
                    </>
                ) : (
                    'Save'
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            title="Password Change Required"
            size="sm"
            footer={footer}
            showCloseButton={false}
            closeOnOverlayClick={false}
            closeOnEscape={false}
        >
            <form
                id="password-change-form"
                className="password-change-modal__form"
                onSubmit={handleSubmit}
            >
                <Field
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    error={fieldErrors.currentPassword}
                    disabled={loading}
                    autoComplete="current-password"
                    autoFocus
                    rightIcon={showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    onRightIconClick={toggleCurrentPasswordVisibility}
                />

                <Field
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={fieldErrors.newPassword}
                    helper="At least 8 characters"
                    disabled={loading}
                    autoComplete="new-password"
                    rightIcon={showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    onRightIconClick={toggleNewPasswordVisibility}
                />
            </form>
        </Modal>
    );
};

PasswordChangeRequiredModal.propTypes = {
    /** Controls modal visibility */
    isOpen: PropTypes.bool,
    /** Callback when password is successfully changed */
    onPasswordChanged: PropTypes.func,
    /** Callback when user clicks logout */
    onLogout: PropTypes.func,
};

export default PasswordChangeRequiredModal;
