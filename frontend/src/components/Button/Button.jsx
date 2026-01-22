import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button Component
 *
 * A flexible button component that supports multiple variants, sizes, and icon positions.
 * Uses the design system's button utilities from button-utilities.css.
 *
 * @example
 * // Primary button
 * <Button variant="primary">Click me</Button>
 *
 * @example
 * // Button with left icon
 * <Button variant="primary" icon={<Search />} iconPosition="left">Search</Button>
 *
 * @example
 * // Button with icons on both sides (same icon duplicated)
 * <Button variant="primary" icon={<ChevronRight />} iconPosition="both">Next</Button>
 *
 * @example
 * // Icon-only button
 * <Button variant="primary" icon={<Search />} iconPosition="icon" aria-label="Search" />
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'none',
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    ...rest
}) => {
    // Build class names
    const variantClass = `btn-${variant}`;
    // 'md' is the base size defined in .btn, so no additional class needed
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const iconClass = iconPosition !== 'none' ? `btn-icon-${iconPosition}` : '';

    const classes = [
        'btn',
        variantClass,
        sizeClass,
        iconClass,
        className
    ].filter(Boolean).join(' ');

    // Render icon-only button
    if (iconPosition === 'icon') {
        return (
            <button
                type={type}
                className={classes}
                disabled={disabled}
                onClick={onClick}
                {...rest}
            >
                {icon}
            </button>
        );
    }

    // Render button with text and optional icons
    return (
        <button
            type={type}
            className={classes}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            {(iconPosition === 'left' || iconPosition === 'both') && icon}
            {children}
            {(iconPosition === 'right' || iconPosition === 'both') && icon}
        </button>
    );
};

Button.propTypes = {
    /** Button content (text or elements) */
    children: PropTypes.node,
    /** Button variant style */
    variant: PropTypes.oneOf([
        'primary',
        'ghost',
        'outline',
        'destructive',
        'destructive-ghost',
        'destructive-outline',
        'success',
        'success-ghost',
        'success-outline'
    ]),
    /** Button size */
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Icon element to display */
    icon: PropTypes.element,
    /** Icon position relative to text. Note: 'both' renders the same icon on both sides. */
    iconPosition: PropTypes.oneOf(['none', 'left', 'right', 'both', 'icon']),
    /** Disable the button */
    disabled: PropTypes.bool,
    /** Click handler */
    onClick: PropTypes.func,
    /** Button type attribute */
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default Button;
