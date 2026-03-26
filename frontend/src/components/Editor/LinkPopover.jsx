import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, Check, Unlink } from 'lucide-react';
import { normalizeUrl } from '../../utils/urlUtils';
import './LinkPopover.css';

/**
 * LinkPopover - A floating popover for editing links.
 * 
 * Design based on Figma:
 * - 320px width, 12px padding, 8px gap
 * - Input field with placeholder "Paste or type a link"
 * - 3 buttons always visible: check, unlink, external-link
 * - Buttons are disabled (gray) when empty, enabled when URL present
 */
const LinkPopover = ({
    isOpen,
    position,
    currentUrl = '',
    isEditing = false,
    autoFocusInput = true,
    onApply,
    onUnlink,
    onClose,
}) => {
    const [url, setUrl] = useState(currentUrl);
    const inputRef = useRef(null);
    const popoverRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    // Determine if URL is valid (has content)
    const hasUrl = url.trim().length > 0;

    // Sync internal state with prop changes
    useEffect(() => {
        setUrl(currentUrl);
    }, [currentUrl, isOpen]);

    // Auto-focus input when opened (if autoFocusInput is true)
    useEffect(() => {
        if (isOpen && autoFocusInput && inputRef.current) {
            // Small delay to ensure popover is rendered
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            });
        }
    }, [isOpen, autoFocusInput]);

    // Handle click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            // Don't close if clicking inside popover or formatting menu
            if (
                popoverRef.current?.contains(e.target) ||
                e.target.closest('.formatting-menu') ||
                e.target.closest('.formatting-popup')
            ) {
                return;
            }

            // Delay close to allow for intentional clicks
            closeTimeoutRef.current = setTimeout(() => {
                onClose();
            }, 100);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [isOpen, onClose]);

    // Handle apply action
    const handleApply = useCallback(() => {
        if (!url.trim()) {
            onClose();
            return;
        }

        const normalizedUrl = normalizeUrl(url);
        onApply(normalizedUrl);
    }, [url, onApply, onClose]);

    // Handle input keydown
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    // Handle open in new tab
    const handleOpen = () => {
        if (!url.trim()) return;

        const normalizedUrl = normalizeUrl(url);
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    };

    // Handle unlink action
    const handleUnlink = useCallback(() => {
        if (onUnlink) {
            onUnlink();
        }
        onClose();
    }, [onUnlink, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="link-popover"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {/* Input field wrapper */}
            <div className="link-popover-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="link-popover-input"
                    placeholder="Paste or type a link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {/* Button group - always shows all 3 buttons */}
            <div className="link-popover-button-group">
                {/* Apply/Check button */}
                <button
                    className={`icon-btn link-popover-apply ${hasUrl ? '' : 'disabled'}`}
                    onClick={hasUrl ? handleApply : undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Apply link"
                    disabled={!hasUrl}
                >
                    <Check size={18} />
                </button>

                {/* Unlink button */}
                <button
                    className={`icon-btn link-popover-unlink ${isEditing ? '' : 'disabled'}`}
                    onClick={isEditing ? handleUnlink : undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Remove link"
                    disabled={!isEditing}
                >
                    <Unlink size={18} />
                </button>

                {/* Open in new tab button */}
                <button
                    className={`icon-btn link-popover-open ${hasUrl ? '' : 'disabled'}`}
                    onClick={hasUrl ? handleOpen : undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Open in new tab"
                    disabled={!hasUrl}
                >
                    <ExternalLink size={18} />
                </button>
            </div>
        </div>
    );
};

LinkPopover.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    position: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
    }).isRequired,
    currentUrl: PropTypes.string,
    isEditing: PropTypes.bool,
    autoFocusInput: PropTypes.bool,
    onApply: PropTypes.func.isRequired,
    onUnlink: PropTypes.func,
    onClose: PropTypes.func.isRequired,
};

export default LinkPopover;
