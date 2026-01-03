import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, Check, Unlink } from 'lucide-react';
import { normalizeUrl } from '../../utils/urlUtils';
import './LinkPopover.css';

/**
 * LinkPopover - A floating popover for editing links.
 * Appears above selected text or above FormattingMenu when opened.
 */
const LinkPopover = ({
    isOpen,
    position,
    currentUrl = '',
    isEditing = false,
    onApply,
    onUnlink,
    onClose,
    formattingMenuHeight = 40,
}) => {
    const [url, setUrl] = useState(currentUrl);
    const inputRef = useRef(null);
    const popoverRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    // Sync internal state with prop changes
    useEffect(() => {
        setUrl(currentUrl);
    }, [currentUrl, isOpen]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Small delay to ensure popover is rendered
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            });
        }
    }, [isOpen]);

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
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="link-popover-content">
                <input
                    ref={inputRef}
                    type="text"
                    className="link-popover-input"
                    placeholder="Paste or type a link..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="link-popover-actions">
                    <button
                        className="link-popover-button link-popover-apply"
                        onClick={handleApply}
                        title="Apply link"
                    >
                        <Check size={16} />
                    </button>
                    {isEditing && (
                        <button
                            className="link-popover-button link-popover-unlink"
                            onClick={handleUnlink}
                            title="Remove link"
                        >
                            <Unlink size={16} />
                        </button>
                    )}
                    {isEditing && url.trim() && (
                        <button
                            className="link-popover-button link-popover-open"
                            onClick={handleOpen}
                            title="Open in new tab"
                        >
                            <ExternalLink size={16} />
                        </button>
                    )}
                </div>
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
    onApply: PropTypes.func.isRequired,
    onUnlink: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    formattingMenuHeight: PropTypes.number,
};

export default LinkPopover;

