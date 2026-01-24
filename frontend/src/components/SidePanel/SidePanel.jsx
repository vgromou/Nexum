import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import IconButton from '../Button/IconButton';
import './SidePanel.css';

/**
 * SidePanel Component
 *
 * A slide-in panel that appears over content from the left or right side.
 * Supports optional tabs, customizable width (560-800px), header with title,
 * and footer with action buttons.
 *
 * @example
 * <SidePanel
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Panel Title"
 *   position="right"
 *   width={800}
 *   footer={<Button>Save</Button>}
 * >
 *   Panel content here
 * </SidePanel>
 */
const SidePanel = ({
    isOpen = false,
    onClose,
    title,
    position = 'right',
    width = 560,
    tabs,
    activeTab,
    onTabChange,
    children,
    footer,
    showCloseButton = true,
    closeOnEscape = true,
    className = '',
    ...rest
}) => {
    const [isActive, setIsActive] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const panelRef = useRef(null);
    const previousActiveElementRef = useRef(null);

    const ANIMATION_DURATION = 300;

    // Clamp width between 560 and 800
    const clampedWidth = Math.max(560, Math.min(800, width));

    // Handle animation and visibility
    useEffect(() => {
        if (isOpen) {
            previousActiveElementRef.current = document.activeElement;
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsActive(true);
                // Focus the panel
                if (panelRef.current) {
                    panelRef.current.focus();
                }
            }, 0);
            return () => clearTimeout(timer);
        } else {
            setIsActive(false);
            // Restore focus
            if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
                previousActiveElementRef.current.focus();
                previousActiveElementRef.current = null;
            }
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, ANIMATION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle Escape key
    const handleKeyDown = useCallback((event) => {
        if (closeOnEscape && event.key === 'Escape') {
            onClose?.();
        }
    }, [closeOnEscape, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isVisible) return null;

    const containerClasses = [
        'side-panel-container',
        `side-panel-container--${position}`,
        isActive && 'side-panel-container--active',
    ].filter(Boolean).join(' ');

    const panelClasses = [
        'side-panel',
        `side-panel--${position}`,
        isActive && 'side-panel--active',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
                {/* Tabs - render on opposite side of panel */}
                {tabs && tabs.length > 0 && (
                    <div className="side-panel__tabs">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id || index}
                                type="button"
                                className={[
                                    'side-panel__tab',
                                    activeTab === (tab.id || index) && 'side-panel__tab--active',
                                    tab.disabled && 'side-panel__tab--disabled',
                                ].filter(Boolean).join(' ')}
                                onClick={() => !tab.disabled && onTabChange?.(tab.id || index)}
                                disabled={tab.disabled}
                                aria-label={tab.label}
                                title={tab.label}
                            >
                                {tab.icon}
                            </button>
                        ))}
                    </div>
                )}

                {/* Panel */}
                <div
                    ref={panelRef}
                    className={panelClasses}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'side-panel-title' : undefined}
                    tabIndex={-1}
                    style={{ width: clampedWidth }}
                    {...rest}
                >
                    {/* Header */}
                    <header className="side-panel__header">
                        {position === 'right' && showCloseButton && (
                            <IconButton
                                icon={<X size={24} />}
                                onClick={onClose}
                                aria-label="Close panel"
                                className="side-panel__close"
                            />
                        )}
                        {title && (
                            <h2 id="side-panel-title" className="side-panel__title">
                                {title}
                            </h2>
                        )}
                        {position === 'left' && showCloseButton && (
                            <IconButton
                                icon={<X size={24} />}
                                onClick={onClose}
                                aria-label="Close panel"
                                className="side-panel__close"
                            />
                        )}
                    </header>

                    {/* Content */}
                    <div className="side-panel__content">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <footer className="side-panel__footer">
                            {footer}
                        </footer>
                    )}
                </div>
        </div>
    );
};

SidePanel.propTypes = {
    /** Controls panel visibility */
    isOpen: PropTypes.bool,
    /** Callback when panel should close */
    onClose: PropTypes.func,
    /** Panel title */
    title: PropTypes.string,
    /** Panel position */
    position: PropTypes.oneOf(['left', 'right']),
    /** Panel width (560-800) */
    width: PropTypes.number,
    /** Tab items for the side tabs */
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        icon: PropTypes.element.isRequired,
        label: PropTypes.string,
        disabled: PropTypes.bool,
    })),
    /** Active tab id */
    activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Panel content */
    children: PropTypes.node,
    /** Footer content (typically action buttons) */
    footer: PropTypes.node,
    /** Show close button in header */
    showCloseButton: PropTypes.bool,
    /** Close panel when pressing Escape */
    closeOnEscape: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SidePanel;
