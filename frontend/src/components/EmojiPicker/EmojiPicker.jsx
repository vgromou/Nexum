import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Shuffle } from 'lucide-react';
import EmojiTab from './EmojiTab';
import IconTab from './IconTab';
import ColorPicker from './ColorPicker';
import {
    ICON_COLORS,
    DEFAULT_ICON_COLOR,
    STORAGE_KEYS,
    SEARCH_DEBOUNCE_MS,
    FOCUS_DELAY_MS
} from './constants';
import { getAllEmojis } from './emojiData';
import { ICON_LIST } from './iconList';
import './EmojiPicker.css';

/**
 * EmojiPicker - Notion-style emoji and icon picker popover
 */
const EmojiPicker = ({
    isOpen,
    position,
    onSelect,
    onRemove,
    onClose,
    currentValue,
    showRemove = true,
}) => {
    const [activeTab, setActiveTab] = useState('emoji');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [iconColor, setIconColor] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEYS.ICON_COLOR) || DEFAULT_ICON_COLOR;
        } catch {
            return DEFAULT_ICON_COLOR;
        }
    });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeCategory, setActiveCategory] = useState('recent');

    const containerRef = useRef(null);
    const searchRef = useRef(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Auto-focus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), FOCUS_DELAY_MS);
        }
    }, [isOpen]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setDebouncedQuery('');
            setShowColorPicker(false);
            setActiveCategory('recent');
        }
    }, [isOpen]);

    // Handle click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (showColorPicker) {
                    setShowColorPicker(false);
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, showColorPicker]);

    // Handle color change
    const handleColorChange = useCallback((colorName) => {
        setIconColor(colorName);
        try {
            localStorage.setItem(STORAGE_KEYS.ICON_COLOR, colorName);
        } catch {
            // Ignore storage errors
        }
        setShowColorPicker(false);
    }, []);

    // Handle selection
    const handleSelect = useCallback((selection) => {
        onSelect(selection);
        onClose();
    }, [onSelect, onClose]);

    // Handle remove
    const handleRemove = useCallback(() => {
        onRemove();
        onClose();
    }, [onRemove, onClose]);

    // Handle shuffle
    const handleShuffle = useCallback(() => {
        if (activeTab === 'emoji') {
            const allEmojis = getAllEmojis();
            const randomEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
            handleSelect({ type: 'emoji', value: randomEmoji.e });
        } else {
            const randomIcon = ICON_LIST[Math.floor(Math.random() * ICON_LIST.length)];
            handleSelect({
                type: 'icon',
                value: randomIcon.name,
                color: ICON_COLORS[iconColor]
            });
        }
    }, [activeTab, handleSelect, iconColor]);



    if (!isOpen) return null;

    const currentEmoji = currentValue?.type === 'emoji' ? currentValue.value : null;
    const currentIcon = currentValue?.type === 'icon' ? currentValue.value : null;

    return (
        <div
            ref={containerRef}
            className="emoji-picker"
            style={{ top: position.top, left: position.left }}
        >
            {/* Header with tabs */}
            <div className="emoji-picker-header">
                <div className="emoji-picker-tabs">
                    <button
                        className={`emoji-picker-tab ${activeTab === 'emoji' ? 'active' : ''}`}
                        onClick={() => setActiveTab('emoji')}
                    >
                        Emoji
                    </button>
                    <button
                        className={`emoji-picker-tab ${activeTab === 'icons' ? 'active' : ''}`}
                        onClick={() => setActiveTab('icons')}
                    >
                        Icons
                    </button>
                </div>
                {showRemove && (
                    <button className="emoji-picker-remove" onClick={handleRemove}>
                        Remove
                    </button>
                )}
            </div>

            {/* Search bar */}
            <div className="emoji-picker-search">
                <div className="emoji-picker-search-input-wrapper">
                    <Search size={16} className="emoji-picker-search-icon" />
                    <input
                        ref={searchRef}
                        type="text"
                        className="emoji-picker-search-input"
                        placeholder="Filter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="emoji-picker-search-actions">
                    <button
                        className="emoji-picker-action-btn"
                        onClick={handleShuffle}
                        title="Random"
                    >
                        <Shuffle size={16} />
                    </button>
                    {activeTab === 'icons' && (
                        <button
                            className="emoji-picker-color-btn"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            title="Change color"
                        >
                            <span
                                className="emoji-picker-color-indicator"
                                style={{ backgroundColor: ICON_COLORS[iconColor] }}
                            />
                        </button>
                    )}
                </div>
                {showColorPicker && (
                    <ColorPicker
                        currentColor={iconColor}
                        onColorChange={handleColorChange}
                        onClose={() => setShowColorPicker(false)}
                    />
                )}
            </div>

            {/* Content area */}
            <div className="emoji-picker-content">
                {activeTab === 'emoji' ? (
                    <EmojiTab
                        searchQuery={debouncedQuery}
                        onSelect={handleSelect}
                        currentEmoji={currentEmoji}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                    />
                ) : (
                    <IconTab
                        searchQuery={debouncedQuery}
                        onSelect={handleSelect}
                        currentIcon={currentIcon}
                        iconColor={iconColor}
                    />
                )}
            </div>
        </div>
    );
};

export default EmojiPicker;
