import React, { useEffect, useCallback, useState, useRef, useId } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import IconButton from '../Button/IconButton';
import Overlay from '../Overlay';
import './Modal.css';

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
 * Modal Component
 *
 * A modal dialog with header, body, and footer sections.
 * Supports three sizes (sm, md, lg) and two overlay types (dim, blur).
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Modal Title"
 *   footer={<Button>Submit</Button>}
 * >
 *   Modal content here
 * </Modal>
 */
const Modal = ({
    isOpen = false,
    onClose,
    title,
    size = 'md',
    overlayVariant = 'dim',
    children,
    footer,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className = '',
    ...rest
}) => {
    const [isActive, setIsActive] = useState(false);
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    const titleId = useId();

    // Handle animation on open/close
    useEffect(() => {
        if (isOpen) {
            // Trigger enter animation
            const timer = setTimeout(() => setIsActive(true), 0);
            return () => clearTimeout(timer);
        } else {
            setIsActive(false);
        }
    }, [isOpen]);

    // Handle keyboard events (Escape and Tab for focus trap)
    const handleKeyDown = useCallback((event) => {
        if (closeOnEscape && event.key === 'Escape') {
            onClose?.();
            return;
        }

        // Focus trap
        if (event.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_SELECTORS);
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift + Tab: if on first element, go to last
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab: if on last element, go to first
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
        }
    }, [closeOnEscape, onClose]);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            // Store previous active element
            previousActiveElement.current = document.activeElement;

            // Focus first focusable element or the modal itself
            const timer = setTimeout(() => {
                if (modalRef.current) {
                    const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_SELECTORS);
                    if (focusableElements.length > 0) {
                        focusableElements[0].focus();
                    } else {
                        modalRef.current.focus();
                    }
                }
            }, 0);

            return () => clearTimeout(timer);
        } else {
            // Restore focus when modal closes
            if (previousActiveElement.current?.isConnected) {
                previousActiveElement.current.focus();
            }
        }
    }, [isOpen]);

    // Protect input fields from external keyboard interception (e.g., editor shortcuts)
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const handleInputKeyDown = (event) => {
            const target = event.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            // Stop propagation for paste/copy/cut in input fields
            if (isInput && (event.metaKey || event.ctrlKey)) {
                const key = event.key.toLowerCase();
                if (key === 'v' || key === 'c' || key === 'x' || key === 'a') {
                    event.stopPropagation();
                }
            }
        };

        // Use capture phase to intercept before other handlers
        modalRef.current.addEventListener('keydown', handleInputKeyDown, true);

        return () => {
            modalRef.current?.removeEventListener('keydown', handleInputKeyDown, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll
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

    // Prevent clicks inside modal from closing it
    const handleModalClick = (event) => {
        event.stopPropagation();
    };

    if (!isOpen) return null;

    const modalClasses = [
        'modal',
        `modal--${size}`,
        isActive && 'modal--active',
        className
    ].filter(Boolean).join(' ');

    return (
        <Overlay
            variant={overlayVariant}
            isActive={isActive}
            onClick={handleOverlayClick}
        >
            <div
                ref={modalRef}
                className={modalClasses}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
                onClick={handleModalClick}
                {...rest}
            >
                {/* Header */}
                <header className="modal__header">
                    {title && (
                        <h2 id={titleId} className="modal__title">
                            {title}
                        </h2>
                    )}
                    {showCloseButton && (
                        <IconButton
                            icon={<X size={20} />}
                            size="sm"
                            onClick={onClose}
                            aria-label="Close modal"
                            className="modal__close"
                        />
                    )}
                </header>

                {/* Body */}
                <div className="modal__body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <footer className="modal__footer">
                        {footer}
                    </footer>
                )}
            </div>
        </Overlay>
    );
};

Modal.propTypes = {
    /** Controls modal visibility */
    isOpen: PropTypes.bool,
    /** Callback when modal should close */
    onClose: PropTypes.func,
    /** Modal title displayed in header */
    title: PropTypes.string,
    /** Modal size */
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Overlay variant */
    overlayVariant: PropTypes.oneOf(['dim', 'blur']),
    /** Modal body content */
    children: PropTypes.node,
    /** Footer content (typically action buttons) */
    footer: PropTypes.node,
    /** Show close button in header */
    showCloseButton: PropTypes.bool,
    /** Close modal when clicking overlay */
    closeOnOverlayClick: PropTypes.bool,
    /** Close modal when pressing Escape */
    closeOnEscape: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default Modal;
