import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';
import Field from '../Field';
import Button from '../Button/Button';
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
    isLoading = false,
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

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        // Clear error when user types
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onChangePassword?.({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });

            // Reset form on success
            setFormData({
                currentPassword: '',
                newPassword: '',
            });
        }
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

                <form className="security-tab__form" onSubmit={handleSubmit}>
                    <div className="security-tab__grid">
                        <Field
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
                            disabled={isLoading}
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
                            disabled={isLoading}
                        />
                    </div>

                    <div className="security-tab__form-actions">
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={isLoading}
                            {...(isLoading && { loading: true })}
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
    /** Callback when password change is submitted */
    onChangePassword: PropTypes.func,
    /** Loading state for password change */
    isLoading: PropTypes.bool,
};

export default SecurityTab;
