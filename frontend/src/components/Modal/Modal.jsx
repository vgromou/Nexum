import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import IconButton from '../Button/IconButton';
import Overlay from '../Overlay';
import './Modal.css';

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

    // Handle animation on open/close
    useEffect(() => {
        if (isOpen) {
            // Trigger enter animation
            requestAnimationFrame(() => setIsActive(true));
        } else {
            setIsActive(false);
        }
    }, [isOpen]);

    // Handle escape key
    const handleKeyDown = useCallback((event) => {
        if (closeOnEscape && event.key === 'Escape') {
            onClose?.();
        }
    }, [closeOnEscape, onClose]);

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
                className={modalClasses}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                onClick={handleModalClick}
                {...rest}
            >
                {/* Header */}
                <header className="modal__header">
                    {title && (
                        <h2 id="modal-title" className="modal__title">
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
