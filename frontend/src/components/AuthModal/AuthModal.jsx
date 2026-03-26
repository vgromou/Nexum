import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Field from '../Field';
import Button from '../Button';
import Overlay from '../Overlay';
import Logo from '../../assets/logo.svg';
import './AuthModal.css';

/**
 * AuthModal Component
 *
 * A login modal with username/email and password fields.
 * Supports error states, loading state, and session expiry mode.
 *
 * @example
 * // Normal login
 * <AuthModal
 *   isOpen={showLogin}
 *   onSubmit={handleLogin}
 *   onClose={handleClose}
 * />
 *
 * @example
 * // Session expired
 * <AuthModal
 *   isOpen={isSessionExpired}
 *   mode="sessionExpired"
 *   onSubmit={handleReauth}
 * />
 */
const AuthModal = ({
    isOpen = false,
    mode = 'login',
    onSubmit,
    onClose,
    isLoading = false,
    usernameError,
    passwordError,
    className = '',
    ...rest
}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Handle animation on open
    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsActive(true), 0);
            return () => clearTimeout(timer);
        } else {
            setIsActive(false);
        }
    }, [isOpen]);

    // Handle form submission
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!isLoading) {
            onSubmit?.({ username, password });
        }
    }, [username, password, isLoading, onSubmit]);

    // Toggle password visibility
    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    // Handle overlay click - don't allow closing in sessionExpired mode
    const handleOverlayClick = useCallback(() => {
        if (!isLoading && onClose && mode !== 'sessionExpired') {
            onClose();
        }
    }, [isLoading, onClose, mode]);

    // Prevent clicks inside modal from closing it
    const handleModalClick = useCallback((e) => {
        e.stopPropagation();
    }, []);

    if (!isOpen) return null;

    const modalClasses = [
        'auth-modal',
        isActive && 'auth-modal--active',
        className
    ].filter(Boolean).join(' ');

    return (
        <Overlay
            variant="blur"
            isActive={isActive}
            onClick={handleOverlayClick}
        >
            <div
                className={modalClasses}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                onClick={handleModalClick}
                {...rest}
            >
                {/* Header with logo */}
                <div className="auth-modal__header">
                    <img
                        src={Logo}
                        alt="Nexum logo"
                        className="auth-modal__logo"
                    />
                    <h1 className="auth-modal__brand">Nexum</h1>
                </div>

                {/* Subtitle */}
                <h2 id="auth-modal-title" className="auth-modal__title">
                    {mode === 'sessionExpired'
                        ? 'Session expired'
                        : 'Sign into your account'}
                </h2>

                {/* Session expired message */}
                {mode === 'sessionExpired' && (
                    <p className="auth-modal__message">
                        Your session has expired. Please sign in again to continue.
                    </p>
                )}

                {/* Form */}
                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="auth-modal__fields">
                        <Field
                            label="Username or Email"
                            placeholder="Paste or type"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            error={usernameError}
                            disabled={isLoading}
                            autoComplete="username"
                            autoFocus
                        />

                        <Field
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Paste or type"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={passwordError}
                            disabled={isLoading}
                            autoComplete="current-password"
                            rightIcon={showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            onRightIconClick={togglePasswordVisibility}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isLoading}
                        className="auth-modal__submit"
                    >
                        {isLoading ? (
                            <>
                                Signing in
                                <Loader2 size={20} className="auth-modal__spinner" />
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </form>
            </div>
        </Overlay>
    );
};

AuthModal.propTypes = {
    /** Controls modal visibility */
    isOpen: PropTypes.bool,
    /** Modal mode - 'login' for initial login, 'sessionExpired' for re-authentication */
    mode: PropTypes.oneOf(['login', 'sessionExpired']),
    /** Callback when form is submitted with { username, password } */
    onSubmit: PropTypes.func,
    /** Callback when modal should close */
    onClose: PropTypes.func,
    /** Show loading state with spinner */
    isLoading: PropTypes.bool,
    /** Error message for username field */
    usernameError: PropTypes.string,
    /** Error message for password field */
    passwordError: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default AuthModal;
