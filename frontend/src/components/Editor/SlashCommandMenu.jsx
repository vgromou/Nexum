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

// Delay before hiding scrollbar after scrolling stops
const SCROLL_HIDE_DELAY_MS = 1000;

const MENU_ITEMS = [
    { type: 'paragraph', label: 'Normal Text', icon: Type, description: 'Plain text paragraph', shortcut: null },
    { type: 'h1', label: 'Heading 1', icon: Heading1, description: 'Large section heading', shortcut: '#' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading', shortcut: '##' },
    { type: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small section heading', shortcut: '###' },
    { type: 'h4', label: 'Heading 4', icon: Heading4, description: 'Smallest heading', shortcut: '####' },
    { type: 'bulleted-list', label: 'Bulleted List', icon: List, description: 'Unordered list item', shortcut: '-' },
    { type: 'numbered-list', label: 'Numbered List', icon: ListOrdered, description: 'Ordered list item', shortcut: '1.' },
    { type: 'quote', label: 'Quote', icon: Quote, description: 'Block quote', shortcut: '"' },
];

const SlashCommandMenu = ({ position, filter, currentBlockType, onSelect, onClose }) => {
    // Filter menu items based on search - computed first so safeInitialIndex can use it
    const filteredItems = useMemo(() =>
        MENU_ITEMS.filter(item =>
            item.label.toLowerCase().includes(filter.toLowerCase()) ||
            item.description.toLowerCase().includes(filter.toLowerCase())
        ), [filter]
    );

    // Compute safe initial index within filteredItems
    const safeInitialIndex = useMemo(() => {
        const index = filteredItems.findIndex(item => item.type === currentBlockType);
        return index !== -1 ? index : 0;
    }, [filteredItems, currentBlockType]);

    // Initialize with callback to get correct initial value
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const initialFilteredItems = MENU_ITEMS.filter(item =>
            item.label.toLowerCase().includes(filter.toLowerCase()) ||
            item.description.toLowerCase().includes(filter.toLowerCase())
        );
        const index = initialFilteredItems.findIndex(item => item.type === currentBlockType);
        return index !== -1 ? index : 0;
    });
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

    // Sync selection when filter or currentBlockType changes
    const prevFilterRef = useRef(filter);
    const prevBlockTypeRef = useRef(currentBlockType);
    useEffect(() => {
        if (prevFilterRef.current !== filter || prevBlockTypeRef.current !== currentBlockType) {
            prevFilterRef.current = filter;
            prevBlockTypeRef.current = currentBlockType;
            setSelectedIndex(safeInitialIndex);
        }
    }, [filter, currentBlockType, safeInitialIndex]);

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
    }, [filteredItems, selectedIndex, onSelect, onClose, isMouseHovering]);

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
        const selectedEl = menuRef.current?.querySelector('.slash-menu-item.highlighted');
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
            className={`slash-command-menu ${isScrolling ? 'scrolling' : ''}`}
            ref={menuRef}
            style={{ top: displayPosition.top, left: displayPosition.left }}
        >
            <div className="slash-menu-scroll-wrapper" onScroll={handleScroll}>
                <div className="slash-menu-header">
                    <span className="slash-menu-header-line-left"></span>
                    <span>Basic blocks</span>
                    <span className="slash-menu-header-line-right"></span>
                </div>
                <div
                    className="slash-menu-items"
                    onMouseEnter={() => setIsMouseHovering(true)}
                    onMouseLeave={() => {
                        setIsMouseHovering(false);
                        // Reset keyboard navigation to safe index within filteredItems
                        setSelectedIndex(safeInitialIndex);
                    }}
                >
                    {filteredItems.map((item, index) => {
                        const Icon = item.icon;
                        const isCurrentType = item.type === currentBlockType;
                        const isHighlighted = index === selectedIndex;
                        return (
                            <div
                                key={item.type}
                                className={`slash-menu-item ${isCurrentType ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                                onClick={() => onSelect(item.type)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="slash-menu-item-left">
                                    <div className="slash-menu-item-icon">
                                        <Icon size={18} />
                                    </div>
                                    <div className="slash-menu-item-label">{item.label}</div>
                                </div>
                                {item.shortcut && (
                                    <div className="slash-menu-item-shortcut">{item.shortcut}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SlashCommandMenu;
