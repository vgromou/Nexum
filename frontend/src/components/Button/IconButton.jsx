import React from 'react';
import PropTypes from 'prop-types';

/**
 * IconButton Component
 *
 * A square icon-only button component with multiple sizes.
 * Uses the design system's icon-button utilities from button-utilities.css.
 *
 * Size specifications:
 * - xs: 20×20px button, 16×16px icon
 * - sm: 26×26px button, 20×20px icon
 * - md: 28×28px button, 20×20px icon (default)
 * - lg: 40×40px button, 24×24px icon
 *
 * @example
 * // Medium icon button (default)
 * <IconButton icon={<Search />} aria-label="Search" />
 *
 * @example
 * // Small icon button
 * <IconButton icon={<Bell />} size="sm" aria-label="Notifications" />
 *
 * @example
 * // Active state
 * <IconButton icon={<Star />} active aria-label="Favorite" />
 */
const IconButton = ({
    icon,
    size = 'md',
    active = false,
    disabled = false,
    onClick,
    className = '',
    ...rest
}) => {
    // Build class names
    const sizeClass = `icon-btn-${size}`;
    const activeClass = active ? 'active' : '';

    const classes = [
        'icon-btn',
        sizeClass,
        activeClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type="button"
            className={classes}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            {icon}
        </button>
    );
};

IconButton.propTypes = {
    /** Icon element to display */
    icon: PropTypes.element.isRequired,
    /** Button size */
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
    /** Active state styling */
    active: PropTypes.bool,
    /** Disable the button */
    disabled: PropTypes.bool,
    /** Click handler */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Accessibility label (required for icon-only buttons) */
    'aria-label': PropTypes.string.isRequired,
};

export default IconButton;
