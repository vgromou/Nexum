import React, { useRef, useEffect, useState } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
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
} from 'lucide-react';
import TurnIntoMenu from './TurnIntoMenu';
import ColorPicker from './ColorPicker';
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
    { name: 'default', label: 'Default' },
    { name: 'gray', label: 'Gray' },
    { name: 'brown', label: 'Brown' },
    { name: 'orange', label: 'Orange' },
    { name: 'yellow', label: 'Yellow' },
    { name: 'green', label: 'Green' },
    { name: 'blue', label: 'Blue' },
    { name: 'purple', label: 'Purple' },
    { name: 'magenta', label: 'Magenta' },
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
    onTextColor,
    onClearTextColor,
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
        const popupWidth = activeSubmenu === 'turnInto' ? 220 : 240;
        const popupHeight = activeSubmenu === 'turnInto' ? 320 : 360;

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

    const handleHighlightClick = (e, colorName) => {
        e.preventDefault();
        e.stopPropagation();
        onHighlight(colorName);
        onToggleSubmenu(null); // Close popup after selection
    };

    const handleClearClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClearHighlight();
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

    // Split colors into rows of 5
    const colorsRow1 = HIGHLIGHT_COLORS.slice(0, 5); // default, gray, brown, orange, yellow
    const colorsRow2 = HIGHLIGHT_COLORS.slice(5);    // green, blue, purple, magenta, red

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
                            className={`turn-into-button ${activeSubmenu === 'turnInto' ? 'active' : ''}`}
                            onClick={(e) => handleSubmenuToggle(e, 'turnInto')}
                            title="Turn into"
                        >
                            <Type size={18} />
                            <span className="block-type-label">{currentBlockLabel}</span>
                            <ChevronDown size={12} className="chevron-icon" />
                        </button>
                    </div>

                    <div className="formatting-menu-divider" />

                    {/* Text Formatting */}
                    <div className="formatting-menu-group">
                        <button
                            className={`icon-btn ${activeFormats.bold ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'bold')}
                            title="Bold (⌘B)"
                        >
                            <Bold size={18} />
                        </button>
                        <button
                            className={`icon-btn ${activeFormats.italic ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'italic')}
                            title="Italic (⌘I)"
                        >
                            <Italic size={18} />
                        </button>
                        <button
                            className={`icon-btn ${activeFormats.underline ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'underline')}
                            title="Underline (⌘U)"
                        >
                            <Underline size={18} />
                        </button>
                        <button
                            className={`icon-btn ${activeFormats.strikeThrough ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'strikeThrough')}
                            title="Strikethrough"
                        >
                            <Strikethrough size={18} />
                        </button>
                        <button
                            className={`icon-btn ${activeFormats.inlineCode ? 'active' : ''}`}
                            onClick={(e) => handleFormatClick(e, 'inlineCode')}
                            title="Inline Code"
                        >
                            <Code size={18} />
                        </button>
                    </div>

                    <div className="formatting-menu-divider" />

                    {/* Links */}
                    <div className="formatting-menu-group">
                        <button
                            className={`icon-btn ${activeFormats.link ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenLinkPopover(); }}
                            title="Insert link (⌘K)"
                        >
                            <Link size={18} />
                        </button>
                        <button
                            className={`icon-btn ${!activeFormats.link ? 'disabled' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (activeFormats.link) onRemoveLink(); }}
                            title="Remove link"
                            disabled={!activeFormats.link}
                        >
                            <Unlink size={18} />
                        </button>
                    </div>

                    <div className="formatting-menu-divider" />

                    {/* Highlight */}
                    <div className="formatting-menu-group">
                        <button
                            ref={highlightRef}
                            className={`color-picker-button ${activeSubmenu === 'highlight' || activeFormats.highlightColor || activeFormats.textColor ? 'active' : ''}`}
                            onClick={(e) => handleSubmenuToggle(e, 'highlight')}
                            title="Color"
                        >
                            <Highlighter size={18} />
                            <ChevronDown size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Turn Into Menu (separate component) */}
            {activeSubmenu === 'turnInto' && (
                <TurnIntoMenu
                    position={popupPosition}
                    currentBlockType={currentBlockType}
                    onSelect={(type) => {
                        onChangeBlockType(type);
                        onToggleSubmenu(null);
                    }}
                    onClose={() => onToggleSubmenu(null)}
                />
            )}

            {/* Color Picker Popup (replaces inline highlight popup) */}
            {activeSubmenu === 'highlight' && (
                <ColorPicker
                    position={popupPosition}
                    activeTextColor={activeFormats.textColor}
                    activeBgColor={activeFormats.highlightColor}
                    onTextColorChange={(color) => {
                        onTextColor(color);
                    }}
                    onBgColorChange={(color) => {
                        onHighlight(color);
                    }}
                    onClose={() => onToggleSubmenu(null)}
                />
            )}
        </>
    );
};

export default FormattingMenu;
