import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    List,
    ListOrdered,
    Quote
} from 'lucide-react';

const MENU_ITEMS = [
    { type: 'paragraph', label: 'Normal Text', icon: Type, description: 'Plain text paragraph' },
    { type: 'h1', label: 'Heading 1', icon: Heading1, description: 'Large section heading' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading' },
    { type: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small section heading' },
    { type: 'h4', label: 'Heading 4', icon: Heading4, description: 'Smallest heading' },
    { type: 'bulleted-list', label: 'Bulleted List', icon: List, description: 'Unordered list item' },
    { type: 'numbered-list', label: 'Numbered List', icon: ListOrdered, description: 'Ordered list item' },
    { type: 'quote', label: 'Quote', icon: Quote, description: 'Block quote' },
];

const SlashCommandMenu = ({ position, filter, onSelect, onClose }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [adjustedPosition, setAdjustedPosition] = useState(null);
    const menuRef = useRef(null);

    // Adjust position if menu doesn't fit below cursor
    useLayoutEffect(() => {
        if (!menuRef.current) return;

        const menu = menuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let newTop = position.top;
        let newLeft = position.left;

        // Check if menu extends beyond bottom of viewport
        const bottomOverflow = (position.top + menuRect.height) - viewportHeight;

        if (bottomOverflow > 0) {
            // Not enough space below - position to the right of the cursor
            // Move menu above the cursor position (position.top is bottom of cursor line)
            // We place menu so its bottom aligns near the cursor top
            const cursorLineHeight = 26; // Approximate line height
            newTop = position.top - cursorLineHeight - menuRect.height;

            // Move to the right of cursor
            newLeft = position.left + 8;

            // If still goes above viewport, position at top
            if (newTop < 8) {
                newTop = 8;
            }

            // If goes off right edge, position at right edge
            if (newLeft + menuRect.width > viewportWidth - 8) {
                newLeft = viewportWidth - menuRect.width - 8;
            }
        }

        // Check right edge overflow (for default position)
        if (newLeft + menuRect.width > viewportWidth - 8) {
            newLeft = viewportWidth - menuRect.width - 8;
        }

        setAdjustedPosition({ top: newTop, left: newLeft });
    }, [position]);

    // Filter menu items based on search - memoized to avoid recalculation
    const filteredItems = useMemo(() =>
        MENU_ITEMS.filter(item =>
            item.label.toLowerCase().includes(filter.toLowerCase()) ||
            item.description.toLowerCase().includes(filter.toLowerCase())
        ), [filter]
    );

    // Reset selection when filter changes
    const prevFilterRef = useRef(filter);
    useEffect(() => {
        if (prevFilterRef.current !== filter) {
            prevFilterRef.current = filter;
            setSelectedIndex(0);
        }
    }, [filter]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredItems.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex].type);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, onSelect, onClose]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Scroll selected item into view
    useEffect(() => {
        const selectedEl = menuRef.current?.querySelector('.slash-menu-item.selected');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Use adjusted position if available, otherwise fallback to original
    const displayPosition = adjustedPosition || position;

    if (filteredItems.length === 0) {
        return (
            <div
                className="slash-command-menu"
                ref={menuRef}
                style={{ top: displayPosition.top, left: displayPosition.left }}
            >
                <div className="slash-menu-empty">No results</div>
            </div>
        );
    }

    return (
        <div
            className="slash-command-menu"
            ref={menuRef}
            style={{ top: displayPosition.top, left: displayPosition.left }}
        >
            <div className="slash-menu-header">Basic blocks</div>
            <div className="slash-menu-items">
                {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.type}
                            className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => onSelect(item.type)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="slash-menu-item-icon">
                                <Icon size={20} />
                            </div>
                            <div className="slash-menu-item-content">
                                <div className="slash-menu-item-label">{item.label}</div>
                                <div className="slash-menu-item-description">{item.description}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SlashCommandMenu;
