import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Toast from './Toast';
import './ToastProvider.css';

const ToastContext = createContext(null);

/**
 * Toast Provider Component
 *
 * Provides context for showing toasts throughout the application.
 * Wrap your app with this provider to use the useToast hook.
 *
 * @example
 * // In your app root
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * @example
 * // In any component
 * const { showToast } = useToast();
 * showToast({ variant: 'success', message: 'Saved!' });
 */
export const ToastProvider = ({
    children,
    position = 'bottom-right',
    maxToasts = 5,
}) => {
    const [toasts, setToasts] = useState([]);
    const idCounterRef = useRef(0);

    const showToast = useCallback(({
        variant = 'success',
        message,
        duration = 10000,
        showProgress = true,
        iconSize = 'md',
    }) => {
        const id = ++idCounterRef.current;

        const newToast = {
            id,
            variant,
            message,
            duration,
            showProgress,
            iconSize,
        };

        setToasts(prevToasts => {
            // Always add to beginning - newest toast first
            const updatedToasts = [newToast, ...prevToasts];

            // Limit number of toasts (remove oldest)
            if (updatedToasts.length > maxToasts) {
                return updatedToasts.slice(0, maxToasts);
            }
            return updatedToasts;
        });

        return id;
    }, [maxToasts]);

    const hideToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const hideAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const contextValue = {
        showToast,
        hideToast,
        hideAllToasts,
        toasts,
    };

    const containerClasses = [
        'toast-container',
        `toast-container--${position}`,
    ].join(' ');

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className={containerClasses} aria-live="polite" aria-label="Notifications">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        variant={toast.variant}
                        message={toast.message}
                        duration={toast.duration}
                        showProgress={toast.showProgress}
                        iconSize={toast.iconSize}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

ToastProvider.propTypes = {
    /** Application content */
    children: PropTypes.node.isRequired,
    /** Position of toast container */
    position: PropTypes.oneOf([
        'top-right',
        'top-left',
        'top-center',
        'bottom-right',
        'bottom-left',
        'bottom-center',
    ]),
    /** Maximum number of toasts to show at once */
    maxToasts: PropTypes.number,
};

/**
 * Hook to show and manage toasts
 *
 * @returns {{
 *   showToast: (options: { variant?: string, message: string, duration?: number }) => number,
 *   hideToast: (id: number) => void,
 *   hideAllToasts: () => void,
 *   toasts: Array
 * }}
 *
 * @example
 * const { showToast } = useToast();
 *
 * // Show success toast
 * showToast({ variant: 'success', message: 'Changes saved!' });
 *
 * // Show error toast with custom duration
 * showToast({ variant: 'error', message: 'Failed to save', duration: 5000 });
 */
export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
};

export default ToastProvider;
