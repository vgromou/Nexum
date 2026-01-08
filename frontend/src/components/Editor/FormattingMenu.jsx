import React, { useRef, useEffect, useState } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Link,
    Unlink,
    ChevronDown,
    Highlighter,
    Type,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    List,
    ListOrdered,
    Quote,
    Check,
} from 'lucide-react';
import './FormattingMenu.css';

const BLOCK_TYPE_ITEMS = [
    { type: 'paragraph', label: 'Text', icon: Type },
    { type: 'h1', label: 'Heading 1', icon: Heading1 },
    { type: 'h2', label: 'Heading 2', icon: Heading2 },
    { type: 'h3', label: 'Heading 3', icon: Heading3 },
    { type: 'h4', label: 'Heading 4', icon: Heading4 },
    { type: 'bulleted-list', label: 'Bulleted List', icon: List },
    { type: 'numbered-list', label: 'Numbered List', icon: ListOrdered },
    { type: 'quote', label: 'Quote', icon: Quote },
];

const HIGHLIGHT_COLORS = [
    { name: 'gray', label: 'Gray' },
    { name: 'purple', label: 'Purple' },
    { name: 'blue', label: 'Blue' },
    { name: 'green', label: 'Green' },
    { name: 'orange', label: 'Orange' },
    { name: 'red', label: 'Red' },
];

/**
 * Gets the label for a block type.
 */
const getBlockTypeLabel = (type) => {
    const item = BLOCK_TYPE_ITEMS.find(i => i.type === type);
    return item ? item.label : 'Text';
};

/**
 * FormattingMenu - A floating menu for text formatting.
 * Appears when text is selected, providing options for styling,
 * block type conversion, links, and highlights.
 */
const FormattingMenu = ({
    position,
    currentBlockType = 'paragraph',
    activeFormats = {},
    activeSubmenu,
    onToggleSubmenu,
    onFormat,
    onHighlight,
    onClearHighlight,
    onOpenLinkPopover,
    onRemoveLink,
    onChangeBlockType,
    onClose,
}) => {
    const menuRef = useRef(null);
    const turnIntoRef = useRef(null);
    const highlightRef = useRef(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    // Position menu with transform to center it and stay within viewport
    useEffect(() => {
        if (!menuRef.current) return;

        const menu = menuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        // Ensure menu doesn't go off-screen horizontally
        let adjustedLeft = position.left;
        const halfWidth = menuRect.width / 2;

        if (position.left - halfWidth < 10) {
            adjustedLeft = halfWidth + 10;
        } else if (position.left + halfWidth > viewportWidth - 10) {
            adjustedLeft = viewportWidth - halfWidth - 10;
        }

        menu.style.left = `${adjustedLeft}px`;
        menu.style.top = `${position.top}px`;
    }, [position]);

    // Calculate popup position when submenu opens
    useEffect(() => {
        if (!menuRef.current) return;

        const buttonRef = activeSubmenu === 'turnInto' ? turnIntoRef : highlightRef;
        if (!buttonRef.current || !activeSubmenu) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Popup dimensions (approximate)
        const popupWidth = activeSubmenu === 'turnInto' ? 220 : 180;
        const popupHeight = activeSubmenu === 'turnInto' ? 320 : 260;

        // Calculate position below the menu, centered on the button
        let left = buttonRect.left + buttonRect.width / 2 - popupWidth / 2;
        let top = menuRect.bottom + 8;

        // Ensure popup stays within viewport
        if (left < 10) left = 10;
        if (left + popupWidth > viewportWidth - 10) {
            left = viewportWidth - popupWidth - 10;
        }
        if (top + popupHeight > viewportHeight - 10) {
            // Show above the menu instead
            top = menuRect.top - popupHeight - 8;
        }

        setPopupPosition({ top, left });
    }, [activeSubmenu]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (activeSubmenu) {
                    onToggleSubmenu(null);
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, activeSubmenu, onToggleSubmenu]);

    const handleFormatClick = (e, command) => {
        e.preventDefault();
        e.stopPropagation();
        onFormat(command);
    };

    const handleHighlightClick = (e, colorName, isTag) => {
        e.preventDefault();
        e.stopPropagation();
        onHighlight(colorName, isTag);
        onToggleSubmenu(null); // Close popup after selection
    };

    const handleClearClick = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        onClearHighlight(type);
        onToggleSubmenu(null); // Close popup after selection
    };

    const handleBlockTypeClick = (e, blockType) => {
        e.preventDefault();
        e.stopPropagation();
        onChangeBlockType(blockType);
    };

    const handleSubmenuToggle = (e, submenuName) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleSubmenu(submenuName);
    };

    const currentBlockLabel = getBlockTypeLabel(currentBlockType);

    // Split colors into rows of 3
    const colorsRow1 = HIGHLIGHT_COLORS.slice(0, 3); // gray, purple, blue
    const colorsRow2 = HIGHLIGHT_COLORS.slice(3);    // green, orange, red

    return (
        <>
            <div
                ref={menuRef}
                className="formatting-menu"
                onMouseDown={(e) => e.preventDefault()}
            >
                <div className="formatting-menu-main">
                    {/* Turn Into */}
                    <div className="formatting-menu-group">
                        <button
                            ref={turnIntoRef}
                            className={`formatting-menu-button turn-into-button ${activeSubmenu === 'turnInto' ? 'active' : ''}`}
                            onClick={(e) => handleSubmenuToggle(e, 'turnInto')}
                            title="Turn into"
                        >
                            <Type size={16} />
                            <span className="block-type-label">{currentBlockLabel}</span>
                            <ChevronDown size={12} />
                        </button>
                    </div>

                    <div className="formatting-menu-divider" />

                    {/* Text Formatting */}
                    <div className="formatting-menu-group">
                        <button
                            className={`formatting-menu-button ${activeFormats.bold ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'bold')}
                            title="Bold (⌘B)"
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            className={`formatting-menu-button ${activeFormats.italic ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'italic')}
                            title="Italic (⌘I)"
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            className={`formatting-menu-button ${activeFormats.underline ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'underline')}
                            title="Underline (⌘U)"
                        >
                            <Underline size={16} />
                        </button>
                        <button
                            className={`formatting-menu-button ${activeFormats.strikeThrough ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'strikeThrough')}
                            title="Strikethrough"
                        >
                            <Strikethrough size={16} />
                        </button>
                    </div>

                    <div className="formatting-menu-divider" />

                    {/* Links */}
                    <div className="formatting-menu-group">
                        <button
                            className={`formatting-menu-button ${activeFormats.link ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenLinkPopover(); }}
                            title="Insert link (⌘K)"
                        >
                            <Link size={16} />
                        </button>
                        <button
                            className={`formatting-menu-button ${!activeFormats.link ? 'disabled' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (activeFormats.link) onRemoveLink(); }}
                            title="Remove link"
                            disabled={!activeFormats.link}
                        >
                            <Unlink size={16} />
                        </button>
                    </div>

                    <div className="formatting-menu-divider" />

                    {/* Highlight */}
                    <div className="formatting-menu-group">
                        <button
                            ref={highlightRef}
                            className={`formatting-menu-button with-dropdown ${activeSubmenu === 'highlight' || activeFormats.highlightColor || activeFormats.tagColor ? 'active' : ''}`}
                            onClick={(e) => handleSubmenuToggle(e, 'highlight')}
                            title="Highlight"
                        >
                            <Highlighter size={16} />
                            <ChevronDown size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Turn Into Popup (separate from menu) */}
            {activeSubmenu === 'turnInto' && (
                <div
                    className="formatting-popup turn-into-popup"
                    style={{ top: popupPosition.top, left: popupPosition.left }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <div className="popup-header">Turn into</div>
                    <div className="popup-content">
                        {BLOCK_TYPE_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.type === currentBlockType;
                            return (
                                <button
                                    key={item.type}
                                    className={`popup-item ${isActive ? 'active' : ''}`}
                                    onClick={(e) => handleBlockTypeClick(e, item.type)}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                    {isActive && <Check size={16} className="check-icon" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Highlight Popup (separate from menu) */}
            {activeSubmenu === 'highlight' && (
                <div
                    className="formatting-popup highlight-popup"
                    style={{ top: popupPosition.top, left: popupPosition.left }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {/* Clear All Button */}
                    <button
                        className="clear-formatting-button"
                        onClick={(e) => handleClearClick(e, null)}
                    >
                        Clear
                    </button>

                    {/* Normal (Background) Section */}
                    <div className="color-section">
                        <div className="color-section-header">Normal</div>
                        <div className="color-row">
                            {colorsRow1.map((color) => (
                                <button
                                    key={`highlight-${color.name}`}
                                    className={`color-swatch highlight-swatch highlight-swatch-${color.name} ${activeFormats.highlightColor === color.name ? 'active' : ''}`}
                                    onClick={(e) => handleHighlightClick(e, color.name, false)}
                                    title={color.label}
                                >
                                    <span className="swatch-letter">A</span>
                                </button>
                            ))}
                        </div>
                        <div className="color-row">
                            {colorsRow2.map((color) => (
                                <button
                                    key={`highlight-${color.name}`}
                                    className={`color-swatch highlight-swatch highlight-swatch-${color.name} ${activeFormats.highlightColor === color.name ? 'active' : ''}`}
                                    onClick={(e) => handleHighlightClick(e, color.name, false)}
                                    title={color.label}
                                >
                                    <span className="swatch-letter">A</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tag Section */}
                    <div className="color-section">
                        <div className="color-section-header">Tag</div>
                        <div className="color-row">
                            {colorsRow1.map((color) => (
                                <button
                                    key={`tag-${color.name}`}
                                    className={`color-swatch tag-swatch tag-swatch-${color.name} ${activeFormats.tagColor === color.name ? 'active' : ''}`}
                                    onClick={(e) => handleHighlightClick(e, color.name, true)}
                                    title={`${color.label} tag`}
                                >
                                    <span className="swatch-letter">A</span>
                                </button>
                            ))}
                        </div>
                        <div className="color-row">
                            {colorsRow2.map((color) => (
                                <button
                                    key={`tag-${color.name}`}
                                    className={`color-swatch tag-swatch tag-swatch-${color.name} ${activeFormats.tagColor === color.name ? 'active' : ''}`}
                                    onClick={(e) => handleHighlightClick(e, color.name, true)}
                                    title={`${color.label} tag`}
                                >
                                    <span className="swatch-letter">A</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FormattingMenu;
