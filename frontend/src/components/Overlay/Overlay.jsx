import React from 'react';
import PropTypes from 'prop-types';
import './Overlay.css';

/**
 * Overlay Component
 *
 * A full-screen overlay with two variants:
 * - dim: Semi-transparent dark overlay
 * - blur: Blurred white overlay
 *
 * @example
 * <Overlay variant="dim" onClick={handleClose} />
 *
 * @example
 * <Overlay variant="blur" />
 */
const Overlay = ({
    variant = 'dim',
    isActive = true,
    onClick,
    className = '',
    children,
    ...rest
}) => {
    const classes = [
        'overlay',
        `overlay--${variant}`,
        isActive && 'overlay--active',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            onClick={onClick}
            aria-hidden="true"
            {...rest}
        >
            {children}
        </div>
    );
};

Overlay.propTypes = {
    /** Overlay variant */
    variant: PropTypes.oneOf(['dim', 'blur']),
    /** Controls animation state (true = visible, false = hidden) */
    isActive: PropTypes.bool,
    /** Click handler (typically used to close modal) */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Optional children */
    children: PropTypes.node,
};

export default Overlay;
