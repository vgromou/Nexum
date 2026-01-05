import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { EMOJI_CATEGORIES, STORAGE_KEYS, MAX_RECENT_EMOJIS } from './constants';
import { EMOJI_DATA } from './emojiData';
import './EmojiPicker.css';

/**
 * EmojiTab - Emoji grid with tabbed categories (one page = one category)
 * Category tabs at bottom, category name header at top of emoji grid
 * First tab is "Recent" showing recently used emojis
 */
const EmojiTab = ({
    searchQuery,
    onSelect,
    currentEmoji,
    activeCategory,
    onCategoryChange
}) => {
    // Get recent emojis from localStorage
    const recentEmojis = useMemo(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.RECENT_EMOJIS);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    // Get category info
    const categoryInfo = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
    const categoryName = categoryInfo?.name || activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

    // Get emojis for current category
    const categoryEmojis = useMemo(() => {
        if (activeCategory === 'recent') {
            // Return recent emojis as emoji objects
            return recentEmojis.map(e => ({ e, n: '', k: [] }));
        }
        return EMOJI_DATA[activeCategory] || [];
    }, [activeCategory, recentEmojis]);

    // Filter emojis based on search query
    const filteredEmojis = useMemo(() => {
        if (!searchQuery.trim()) {
            return categoryEmojis;
        }

        const query = searchQuery.toLowerCase().trim();
        return categoryEmojis.filter(item =>
            item.n.toLowerCase().includes(query) ||
            item.k.some(k => k.toLowerCase().includes(query))
        );
    }, [searchQuery, categoryEmojis]);

    // Search across all categories when there's a search query
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;

        const query = searchQuery.toLowerCase().trim();
        const results = [];

        for (const [category, emojis] of Object.entries(EMOJI_DATA)) {
            const matches = emojis.filter(item =>
                item.n.toLowerCase().includes(query) ||
                item.k.some(k => k.toLowerCase().includes(query))
            );
            results.push(...matches);
        }

        return results;
    }, [searchQuery]);

    const handleSelect = (emoji) => {
        // Add to recent emojis
        try {
            const recent = [...recentEmojis];
            const index = recent.indexOf(emoji);
            if (index > -1) recent.splice(index, 1);
            recent.unshift(emoji);
            const trimmed = recent.slice(0, MAX_RECENT_EMOJIS);
            localStorage.setItem(STORAGE_KEYS.RECENT_EMOJIS, JSON.stringify(trimmed));
        } catch {
            // Ignore storage errors
        }

        onSelect({ type: 'emoji', value: emoji });
    };

    // Use search results when searching, otherwise use category emojis
    const emojisToShow = searchQuery.trim() ? searchResults : filteredEmojis;
    const isSearching = searchQuery.trim().length > 0;

    // Category tabs component
    const CategoryTabs = () => (
        <div className="emoji-category-tabs">
            {EMOJI_CATEGORIES.map((category) => {
                const IconComponent = LucideIcons[category.icon];
                return (
                    <button
                        key={category.id}
                        className={`emoji-category-tab ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => onCategoryChange(category.id)}
                        title={category.name}
                    >
                        {IconComponent && <IconComponent size={16} strokeWidth={1.5} />}
                    </button>
                );
            })}
        </div>
    );

    // Empty state for recent category
    if (activeCategory === 'recent' && recentEmojis.length === 0 && !isSearching) {
        return (
            <div className="emoji-tab-container">
                <div className="emoji-grid-container">
                    <div className="emoji-category-header">
                        {categoryName}
                    </div>
                    <div className="emoji-grid-empty">
                        <span>No recent emojis</span>
                    </div>
                </div>
                <CategoryTabs />
            </div>
        );
    }

    if (!emojisToShow || emojisToShow.length === 0) {
        return (
            <div className="emoji-tab-container">
                <div className="emoji-grid-container">
                    <div className="emoji-grid-empty">
                        <span>No emojis found</span>
                    </div>
                </div>
                {!isSearching && <CategoryTabs />}
            </div>
        );
    }

    return (
        <div className="emoji-tab-container">
            {/* Emoji grid with category header */}
            <div className="emoji-grid-container">
                {!isSearching && (
                    <div className="emoji-category-header">
                        {categoryName}
                    </div>
                )}
                {isSearching && (
                    <div className="emoji-category-header">
                        Search Results
                    </div>
                )}
                <div className="emoji-grid">
                    {emojisToShow.map((item, index) => {
                        const emoji = item.e;
                        const isSelected = currentEmoji === emoji;
                        return (
                            <button
                                key={`${activeCategory}-${index}`}
                                className={`emoji-grid-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(emoji)}
                                title={item.n || emoji}
                            >
                                {emoji}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Category tabs at bottom */}
            {!isSearching && <CategoryTabs />}
        </div>
    );
};

EmojiTab.displayName = 'EmojiTab';

export default EmojiTab;
