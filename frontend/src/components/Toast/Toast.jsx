import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import './Toast.css';

/**
 * Toast Component
 *
 * A notification toast with animated progress background.
 * Two layers: colored progress background + white content on top.
 *
 * @example
 * <Toast variant="success" message="Changes saved successfully" />
 *
 * @example
 * <Toast variant="error" message="Failed to save" onClose={() => {}} />
 */
const Toast = ({
    variant = 'success',
    message,
    duration = 10000,
    onClose,
    showProgress = true,
    iconSize = 'md',
    className = '',
    paused = false,
    ...rest
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(paused);
    const timerRef = useRef(null);
    const exitTimerRef = useRef(null);
    const startTimeRef = useRef(null);
    const remainingTimeRef = useRef(duration);
    const isExitingRef = useRef(false);
    const onCloseRef = useRef(onClose);
    const maskId = useId();

    // Keep onClose ref updated
    onCloseRef.current = onClose;

    // Icon mapping
    const iconMap = {
        success: Check,
        error: X,
        warning: AlertTriangle,
        info: Info,
    };

    const IconComponent = iconMap[variant];

    // Handle close with exit animation
    const handleClose = useCallback(() => {
        if (isExitingRef.current) return;
        isExitingRef.current = true;
        setIsExiting(true);
        exitTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            onCloseRef.current?.();
        }, 200); // Match CSS animation duration
    }, []);

    // Handle auto-dismiss timer
    useEffect(() => {
        if (!showProgress || isPaused) return;

        startTimeRef.current = Date.now();

        timerRef.current = setTimeout(() => {
            handleClose();
        }, remainingTimeRef.current);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isPaused, showProgress, handleClose]);

    // Sync paused prop
    useEffect(() => {
        setIsPaused(paused);
    }, [paused]);

    // Cleanup exit timer
    useEffect(() => {
        return () => {
            if (exitTimerRef.current) {
                clearTimeout(exitTimerRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (!showProgress) return;

        // Calculate remaining time
        if (startTimeRef.current) {
            const elapsed = Date.now() - startTimeRef.current;
            remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        }

        // Clear timer and pause
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        if (!showProgress) return;
        setIsPaused(false);
    };

    if (!isVisible) return null;

    const classes = [
        'toast',
        `toast--${variant}`,
        isPaused && 'toast--paused',
        isExiting && 'toast--exiting',
        className
    ].filter(Boolean).join(' ');

    const iconClasses = [
        'toast__icon',
        `toast__icon--${iconSize}`
    ].join(' ');

    return (
        <div
            className={classes}
            role="alert"
            aria-live="polite"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ '--toast-duration': `${duration}ms` }}
            {...rest}
        >
            {/* Layer 1: SVG Frame with mask animation */}
            <svg className="toast__frame" width="440" height="72" viewBox="0 0 440 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id={`toast-mask${maskId}`}>
                        {/* White background = show colored frame */}
                        <rect x="0" y="0" width="440" height="72" fill="white" />
                        {/* Black stroke traces U-path, hiding colored frame progressively */}
                        <path
                            className="toast__mask-path"
                            d="M440 0 H0 V72 H440"
                            stroke="black"
                            strokeWidth="24"
                            fill="none"
                        />
                    </mask>
                </defs>
                {/* Gray background frame */}
                <path
                    className="toast__frame-bg"
                    d="M428 0C434.627 0 440 5.37258 440 12C440 7.58172 436.418 4 432 4H14C9.58172 4 6 7.58172 6 12V60C6 64.4183 9.58172 68 14 68H432C436.418 68 440 64.4183 440 60C440 66.6274 434.627 72 428 72H12C5.37258 72 1.93283e-07 66.6274 0 60V12C7.73133e-07 5.37258 5.37258 1.61064e-08 12 0H428Z"
                />
                {/* Colored frame with mask */}
                <path
                    className="toast__frame-color"
                    mask={`url(#toast-mask${maskId})`}
                    d="M428 0C434.627 0 440 5.37258 440 12C440 7.58172 436.418 4 432 4H14C9.58172 4 6 7.58172 6 12V60C6 64.4183 9.58172 68 14 68H432C436.418 68 440 64.4183 440 60C440 66.6274 434.627 72 428 72H12C5.37258 72 1.93283e-07 66.6274 0 60V12C7.73133e-07 5.37258 5.37258 1.61064e-08 12 0H428Z"
                />
            </svg>

            {/* Layer 2: White content */}
            <div className="toast__content">
                <div className={iconClasses}>
                    <IconComponent className="toast__icon-svg" />
                </div>

                <p className="toast__message">{message}</p>

                <button
                    type="button"
                    className="toast__close"
                    onClick={handleClose}
                    aria-label="Close notification"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

Toast.propTypes = {
    /** Toast variant determining color scheme */
    variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    /** Message text to display */
    message: PropTypes.string.isRequired,
    /** Auto-dismiss duration in milliseconds */
    duration: PropTypes.number,
    /** Callback when toast is closed */
    onClose: PropTypes.func,
    /** Show animated progress border */
    showProgress: PropTypes.bool,
    /** Icon size */
    iconSize: PropTypes.oneOf(['sm', 'md']),
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Pause the progress animation */
    paused: PropTypes.bool,
};

export default Toast;
