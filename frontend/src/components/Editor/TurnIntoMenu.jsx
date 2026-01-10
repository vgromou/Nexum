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
import './TurnIntoMenu.css';

// Menu items - same as slash menu for now
const MENU_ITEMS = [
    { type: 'paragraph', label: 'Normal Text', icon: Type, shortcut: null },
    { type: 'h1', label: 'Heading 1', icon: Heading1, shortcut: '#' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, shortcut: '##' },
    { type: 'h3', label: 'Heading 3', icon: Heading3, shortcut: '###' },
    { type: 'h4', label: 'Heading 4', icon: Heading4, shortcut: '####' },
    { type: 'bulleted-list', label: 'Bulleted List', icon: List, shortcut: '-' },
    { type: 'numbered-list', label: 'Numbered List', icon: ListOrdered, shortcut: '1.' },
    { type: 'quote', label: 'Quote', icon: Quote, shortcut: '"' },
];

// Delay before hiding scrollbar after scrolling stops
const SCROLL_HIDE_DELAY_MS = 1000;

const TurnIntoMenu = ({ position, currentBlockType, onSelect, onClose }) => {
    // Compute initial index based on currentBlockType
    const initialIndex = useMemo(() => {
        const index = MENU_ITEMS.findIndex(item => item.type === currentBlockType);
        return index !== -1 ? index : 0;
    }, [currentBlockType]);

    const [selectedIndex, setSelectedIndex] = useState(initialIndex);
    const [adjustedPosition, setAdjustedPosition] = useState(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isMouseHovering, setIsMouseHovering] = useState(false);
    const menuRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // Handle scroll - show scrollbar while scrolling
    const handleScroll = () => {
        setIsScrolling(true);
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        // Hide scrollbar after delay
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, SCROLL_HIDE_DELAY_MS);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

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
            // Not enough space below - position above
            newTop = position.top - menuRect.height - 8;

            // If still goes above viewport, position at top
            if (newTop < 8) {
                newTop = 8;
            }
        }

        // Check right edge overflow
        if (newLeft + menuRect.width > viewportWidth - 8) {
            newLeft = viewportWidth - menuRect.width - 8;
        }

        // Check left edge
        if (newLeft < 8) {
            newLeft = 8;
        }

        setAdjustedPosition({ top: newTop, left: newLeft });
    }, [position]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Skip arrow navigation if mouse is hovering
            if (isMouseHovering && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < MENU_ITEMS.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (MENU_ITEMS[selectedIndex]) {
                    onSelect(MENU_ITEMS[selectedIndex].type);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, onSelect, onClose, isMouseHovering]);

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
        const selectedEl = menuRef.current?.querySelector('.turn-into-menu-item.highlighted');
        if (selectedEl && selectedEl.scrollIntoView) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Use adjusted position if available, otherwise fallback to original
    const displayPosition = adjustedPosition || position;

    return (
        <div
            className={`turn-into-menu ${isScrolling ? 'scrolling' : ''}`}
            ref={menuRef}
            style={{ top: displayPosition.top, left: displayPosition.left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="turn-into-menu-scroll-wrapper" onScroll={handleScroll}>
                <div className="turn-into-menu-header">
                    <span className="turn-into-menu-header-line-left"></span>
                    <span>Basic blocks</span>
                    <span className="turn-into-menu-header-line-right"></span>
                </div>
                <div
                    className="turn-into-menu-items"
                    onMouseEnter={() => setIsMouseHovering(true)}
                    onMouseLeave={() => {
                        setIsMouseHovering(false);
                        // Reset keyboard navigation to currentBlockType position
                        setSelectedIndex(initialIndex);
                    }}
                >
                    {MENU_ITEMS.map((item, index) => {
                        const Icon = item.icon;
                        const isCurrentType = item.type === currentBlockType;
                        const isHighlighted = index === selectedIndex;
                        return (
                            <div
                                key={item.type}
                                className={`turn-into-menu-item ${isCurrentType ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                                onClick={() => onSelect(item.type)}
                                onMouseEnter={() => setSelectedIndex(initialIndex)}
                            >
                                <div className="turn-into-menu-item-left">
                                    <div className="turn-into-menu-item-icon">
                                        <Icon size={18} />
                                    </div>
                                    <div className="turn-into-menu-item-label">{item.label}</div>
                                </div>
                                {item.shortcut && (
                                    <div className="turn-into-menu-item-shortcut">{item.shortcut}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TurnIntoMenu;
