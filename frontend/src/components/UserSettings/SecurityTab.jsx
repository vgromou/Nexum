import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';
import Field from '../Field';
import Button from '../Button/Button';
import { useApiCall } from '../../hooks/useApiCall';
import { changePassword as changePasswordApi } from '../../api/authApi';
import './SecurityTab.css';

/**
 * Format relative time from a date
 */
const formatRelativeTime = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (diffDays === 0) {
        return `Last changed: ${formattedDate} (today)`;
    } else if (diffDays === 1) {
        return `Last changed: ${formattedDate} (yesterday)`;
    } else {
        return `Last changed: ${formattedDate} (${diffDays} days ago)`;
    }
};

/**
 * SecurityTab Component
 *
 * Password change form and sessions management.
 */
const SecurityTab = ({
    user,
    onChangePassword,
    changePassword = changePasswordApi,
}) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
    });

    const [errors, setErrors] = useState({});
    const currentPasswordRef = useRef(null);
    const { call, loading } = useApiCall();

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setErrors({});

        const { error, fieldErrors } = await call(
            () => changePassword(formData.currentPassword, formData.newPassword),
            { successMessage: 'Password changed successfully' }
        );

        // Always clear both password fields after submit, regardless of outcome.
        // Keeps typed secrets out of the DOM and gives the user a clean slate.
        setFormData({ currentPassword: '', newPassword: '' });

        if (error) {
            if (fieldErrors && Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors);
            }
            currentPasswordRef.current?.focus();
            return;
        }

        onChangePassword?.();
    };

    const passwordLastChanged = formatRelativeTime(user?.passwordLastChanged);

    return (
        <div className="security-tab">
            {/* Password Section */}
            <section className="security-tab__section">
                <div className="security-tab__section-header">
                    <h4 className="security-tab__section-title">Password</h4>
                    {passwordLastChanged && (
                        <span className="security-tab__section-subtitle">
                            {passwordLastChanged}
                        </span>
                    )}
                </div>

                <form
                    className="security-tab__form"
                    onSubmit={handleSubmit}
                    noValidate
                    autoComplete="off"
                >
                    <div className="security-tab__grid">
                        <Field
                            ref={currentPasswordRef}
                            label="Current Password"
                            name="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={formData.currentPassword}
                            onChange={handleChange('currentPassword')}
                            placeholder="Paste or type"
                            error={errors.currentPassword}
                            rightIcon={showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                            onRightIconClick={() => toggleShowPassword('current')}
                            autoComplete="current-password"
                            disabled={loading}
                        />
                        <Field
                            label="New Password"
                            name="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={handleChange('newPassword')}
                            placeholder="Paste or type"
                            error={errors.newPassword}
                            rightIcon={showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                            onRightIconClick={() => toggleShowPassword('new')}
                            autoComplete="new-password"
                            disabled={loading}
                        />
                    </div>

                    <div className="security-tab__form-actions">
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={loading}
                        >
                            Change Password
                        </Button>
                    </div>
                </form>
            </section>

            {/* Sessions Section */}
            <section className="security-tab__section">
                <h4 className="security-tab__section-title">Sessions</h4>
            </section>
        </div>
    );
};

SecurityTab.propTypes = {
    /** Current user data */
    user: PropTypes.shape({
        passwordLastChanged: PropTypes.string,
    }),
    /** Callback fired after a successful password change */
    onChangePassword: PropTypes.func,
    /** Override for the password-change API call (used in tests/stories) */
    changePassword: PropTypes.func,
};

export default SecurityTab;
