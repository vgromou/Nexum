import React from 'react';
import PropTypes from 'prop-types';

/**
 * DialogTab Component
 *
 * An individual tab button for the Dialog component's side navigation.
 * Displays an icon with visual states for default, hover, active, and disabled.
 *
 * @example
 * <DialogTab
 *   icon={<Bell size={24} />}
 *   active={true}
 *   onClick={() => handleTabChange('notifications')}
 *   aria-label="Notifications"
 * />
 */
const DialogTab = ({
    icon,
    active = false,
    disabled = false,
    onClick,
    className = '',
    ...rest
}) => {
    const classes = [
        'dialog-tab',
        active && 'dialog-tab--active',
        disabled && 'dialog-tab--disabled',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type="button"
            className={classes}
            disabled={disabled}
            onClick={onClick}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            {...rest}
        >
            {icon}
        </button>
    );
};

DialogTab.propTypes = {
    /** Icon element to display (24x24 recommended) */
    icon: PropTypes.element.isRequired,
    /** Active state - shows selected styling */
    active: PropTypes.bool,
    /** Disabled state */
    disabled: PropTypes.bool,
    /** Click handler */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Accessibility label (required) */
    'aria-label': PropTypes.string.isRequired,
};

export default DialogTab;
