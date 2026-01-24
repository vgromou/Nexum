import React, { useState } from 'react';
import AuthModal from '../../components/AuthModal';
import './LoginPage.css';

/**
 * LoginPage Component
 *
 * A full-page login screen with the AuthModal centered on a secondary background.
 *
 * @example
 * <LoginPage onLogin={handleLogin} />
 */
const LoginPage = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ username: '', password: '' });

    const handleSubmit = async ({ username, password }) => {
        setErrors({ username: '', password: '' });
        setIsLoading(true);

        try {
            await onLogin?.({ username, password });
        } catch (error) {
            // Handle specific error types
            if (error?.field === 'username') {
                setErrors(prev => ({ ...prev, username: error.message }));
            } else if (error?.field === 'password') {
                setErrors(prev => ({ ...prev, password: error.message }));
            } else {
                // Generic error - show on password field
                setErrors(prev => ({ ...prev, password: error?.message || 'Login failed' }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <AuthModal
                isOpen={true}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                usernameError={errors.username}
                passwordError={errors.password}
            />
        </div>
    );
};

export default LoginPage;
