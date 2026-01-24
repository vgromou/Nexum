import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import './ConfirmationPopover.css';

/**
 * ConfirmationPopover Component
 *
 * A popover component for confirmation dialogs with an arrow pointer.
 * Supports title, optional description, and customizable action buttons.
 *
 * @example
 * <ConfirmationPopover
 *   isOpen={isOpen}
 *   title="Log out of Nexum?"
 *   onClose={() => setIsOpen(false)}
 *   actions={[
 *     { label: 'Cancel', variant: 'outline', onClick: handleCancel },
 *     { label: 'Log out', variant: 'destructive', onClick: handleLogout }
 *   ]}
 * />
 */
const ConfirmationPopover = ({
    isOpen = false,
    onClose,
    title,
    description,
    actions = [],
    anchorRef,
    placement = 'bottom',
    className = '',
    ...rest
}) => {
    const popoverRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [arrowLeft, setArrowLeft] = useState(0);

    // Handle animation on open/close
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsActive(true), 0);
            return () => clearTimeout(timer);
        } else {
            setIsActive(false);
        }
    }, [isOpen]);

    // Calculate position relative to anchor element
    useEffect(() => {
        if (isOpen && anchorRef?.current && popoverRef.current) {
            const anchorRect = anchorRef.current.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();

            let top, left;
            const arrowOffset = 6; // Arrow height

            // Calculate ideal position centered on anchor
            const anchorCenterX = anchorRect.left + (anchorRect.width / 2);
            const idealLeft = anchorCenterX - (popoverRect.width / 2);

            switch (placement) {
                case 'top':
                    top = anchorRect.top - popoverRect.height - arrowOffset;
                    left = idealLeft;
                    break;
                case 'bottom':
                default:
                    top = anchorRect.bottom + arrowOffset;
                    left = idealLeft;
                    break;
            }

            // Keep within viewport bounds
            const padding = 8;
            const adjustedLeft = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding));
            top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding));

            // Calculate arrow position relative to popover
            // Arrow should point to anchor center
            const arrowPosition = anchorCenterX - adjustedLeft - 5; // 5 is half of arrow width (10px)
            setArrowLeft(Math.max(10, Math.min(arrowPosition, popoverRect.width - 20)));

            setPosition({ top, left: adjustedLeft });
        }
    }, [isOpen, anchorRef, placement]);

    // Close on Escape key
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose?.();
        }
    }, [onClose]);

    // Close on click outside
    const handleClickOutside = useCallback((event) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target)) {
            if (!anchorRef?.current?.contains(event.target)) {
                onClose?.();
            }
        }
    }, [onClose, anchorRef]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, handleKeyDown, handleClickOutside]);

    if (!isOpen) return null;

    const popoverClasses = [
        'confirmation-popover',
        `confirmation-popover--${placement}`,
        isActive && 'confirmation-popover--active',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={popoverRef}
            className={popoverClasses}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'confirmation-popover-title' : undefined}
            style={{
                top: position.top,
                left: position.left
            }}
            {...rest}
        >
            <div
                className="confirmation-popover__arrow"
                style={{ left: arrowLeft }}
            />
            <div className="confirmation-popover__content">
                {title && (
                    <p id="confirmation-popover-title" className="confirmation-popover__title">
                        {title}
                    </p>
                )}
                {description && (
                    <p className="confirmation-popover__description">
                        {description}
                    </p>
                )}
                {actions.length > 0 && (
                    <div className="confirmation-popover__actions">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                size="sm"
                                variant={action.variant || 'primary'}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                icon={action.icon}
                                iconPosition={action.icon ? 'left' : 'none'}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

ConfirmationPopover.propTypes = {
    /** Controls popover visibility */
    isOpen: PropTypes.bool,
    /** Callback when popover should close */
    onClose: PropTypes.func,
    /** Title text (required) */
    title: PropTypes.string.isRequired,
    /** Optional description text */
    description: PropTypes.string,
    /** Action buttons configuration */
    actions: PropTypes.arrayOf(PropTypes.shape({
        /** Button label */
        label: PropTypes.string.isRequired,
        /** Button variant: outline, ghost, primary, destructive, success */
        variant: PropTypes.oneOf(['outline', 'ghost', 'primary', 'destructive', 'success']),
        /** Click handler */
        onClick: PropTypes.func,
        /** Optional icon element */
        icon: PropTypes.element,
        /** Disable the button */
        disabled: PropTypes.bool,
    })),
    /** Reference to the anchor element for positioning */
    anchorRef: PropTypes.shape({ current: PropTypes.any }),
    /** Popover placement relative to anchor */
    placement: PropTypes.oneOf(['top', 'bottom']),
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default ConfirmationPopover;
