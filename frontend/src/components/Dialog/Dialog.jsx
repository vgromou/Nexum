import React, { useEffect, useCallback, useState, useRef, useId } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import IconButton from '../Button/IconButton';
import Overlay from '../Overlay';
import DialogTab from './DialogTab';
import './Dialog.css';

// Selectors for focusable elements
const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Dialog Component
 *
 * A modal dialog for settings and configuration screens.
 * Uses a blur overlay and optionally includes tab navigation on the left side.
 *
 * @example
 * // With tabs
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Settings"
 *   tabs={[
 *     { id: 'profile', icon: <User size={24} />, label: 'Profile' },
 *     { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   footer={<Button onClick={handleSave}>Save</Button>}
 * >
 *   {activeTab === 'profile' && <ProfileSettings />}
 *   {activeTab === 'notifications' && <NotificationSettings />}
 * </Dialog>
 *
 * @example
 * // Without tabs (simple panel)
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Preferences"
 * >
 *   <PreferencesContent />
 * </Dialog>
 */
// Animation duration in ms (should match CSS transition)
const ANIMATION_DURATION = 200;

const Dialog = ({
    isOpen = false,
    onClose,
    title,
    tabs = [],
    activeTab,
    onTabChange,
    children,
    footer,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className = '',
    ...rest
}) => {
    const [isActive, setIsActive] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const dialogRef = useRef(null);
    const previousActiveElement = useRef(null);
    const titleId = useId();
    const hasTabs = tabs.length > 0;

    // Handle animation on open/close
    useEffect(() => {
        if (isOpen) {
            // Mount immediately, then trigger animation
            setShouldRender(true);
            const timer = setTimeout(() => setIsActive(true), 10);
            return () => clearTimeout(timer);
        } else {
            // Start close animation
            setIsActive(false);
            // Unmount after animation completes
            const timer = setTimeout(() => setShouldRender(false), ANIMATION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle keyboard events (Escape and Tab for focus trap)
    const handleKeyDown = useCallback((event) => {
        if (closeOnEscape && event.key === 'Escape') {
            onClose?.();
            return;
        }

        // Arrow key navigation for tabs
        if (hasTabs && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            const tabButtons = dialogRef.current?.querySelectorAll('.dialog-tab:not([disabled])');
            if (tabButtons && document.activeElement?.classList.contains('dialog-tab')) {
                event.preventDefault();
                const currentIndex = Array.from(tabButtons).indexOf(document.activeElement);
                let nextIndex;

                if (event.key === 'ArrowUp') {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
                } else {
                    nextIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
                }

                tabButtons[nextIndex].focus();
                // Optionally activate the tab on arrow key
                const tabId = tabs[nextIndex]?.id;
                if (tabId && onTabChange) {
                    onTabChange(tabId);
                }
            }
        }

        // Focus trap
        if (event.key === 'Tab' && dialogRef.current) {
            const focusableElements = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTORS);
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
        }
    }, [closeOnEscape, onClose, hasTabs, tabs, onTabChange]);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;

            const timer = setTimeout(() => {
                if (dialogRef.current) {
                    const focusableElements = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTORS);
                    if (focusableElements.length > 0) {
                        focusableElements[0].focus();
                    } else {
                        dialogRef.current.focus();
                    }
                }
            }, 0);

            return () => clearTimeout(timer);
        } else {
            if (previousActiveElement.current?.isConnected) {
                previousActiveElement.current.focus();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    // Handle overlay click
    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose?.();
        }
    };

    // Prevent clicks inside dialog from closing it
    const handleContainerClick = (event) => {
        event.stopPropagation();
    };

    if (!shouldRender) return null;

    const containerClasses = [
        'dialog-container',
        isActive && 'dialog-container--active',
        hasTabs && 'dialog-container--with-tabs',
        className
    ].filter(Boolean).join(' ');

    return (
        <Overlay
            variant="blur"
            isActive={isActive}
            onClick={handleOverlayClick}
        >
            <div
                ref={dialogRef}
                className={containerClasses}
                onClick={handleContainerClick}
                tabIndex={-1}
                {...rest}
            >
                {/* Tabs Navigation */}
                {hasTabs && (
                    <nav className="dialog-tabs" role="tablist" aria-label="Dialog sections">
                        {tabs.map((tab) => (
                            <DialogTab
                                key={tab.id}
                                icon={tab.icon}
                                active={activeTab === tab.id}
                                disabled={tab.disabled}
                                onClick={() => onTabChange?.(tab.id)}
                                aria-label={tab.label}
                                aria-controls={`dialog-panel-${tab.id}`}
                            />
                        ))}
                    </nav>
                )}

                {/* Main Panel */}
                <div
                    className="dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? titleId : undefined}
                >
                    {/* Header */}
                    <header className="dialog__header">
                        {title && (
                            <h2 id={titleId} className="dialog__title">
                                {title}
                            </h2>
                        )}
                        <IconButton
                            icon={<X size={24} />}
                            size="md"
                            onClick={onClose}
                            aria-label="Close dialog"
                            className="dialog__close"
                        />
                    </header>

                    {/* Body */}
                    <div className="dialog__body">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <footer className="dialog__footer">
                            {footer}
                        </footer>
                    )}
                </div>
            </div>
        </Overlay>
    );
};

Dialog.propTypes = {
    /** Controls dialog visibility */
    isOpen: PropTypes.bool,
    /** Callback when dialog should close */
    onClose: PropTypes.func,
    /** Dialog title displayed in header */
    title: PropTypes.string,
    /** Tab definitions for side navigation */
    tabs: PropTypes.arrayOf(PropTypes.shape({
        /** Unique tab identifier */
        id: PropTypes.string.isRequired,
        /** Tab icon element (24x24 recommended) */
        icon: PropTypes.element.isRequired,
        /** Tab label for accessibility */
        label: PropTypes.string.isRequired,
        /** Disable this tab */
        disabled: PropTypes.bool,
    })),
    /** Currently active tab ID */
    activeTab: PropTypes.string,
    /** Callback when active tab changes */
    onTabChange: PropTypes.func,
    /** Dialog body content */
    children: PropTypes.node,
    /** Footer content (typically action buttons) */
    footer: PropTypes.node,
    /** Close dialog when clicking overlay */
    closeOnOverlayClick: PropTypes.bool,
    /** Close dialog when pressing Escape */
    closeOnEscape: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default Dialog;
