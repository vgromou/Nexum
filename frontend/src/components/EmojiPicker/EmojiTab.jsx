import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { EMOJI_CATEGORIES, STORAGE_KEYS } from './constants';
import { getAllEmojis, getEmojisByCategory } from './emojiData';

/**
 * EmojiTab - Displays emoji grid with category navigation
 * 
 * Features:
 * - Category tabs at bottom (Recent, Smileys, People, Nature, Food, Activities, Travel, Objects, Symbols)
 * - Searchable emoji grid
 * - Recent emojis stored in localStorage
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

    // Filter emojis based on search query
    const filteredEmojis = useMemo(() => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return getAllEmojis().filter(emoji =>
                // Search by name (n is a string)
                emoji.n.toLowerCase().includes(query) ||
                // Search by keywords (k is an array)
                emoji.k?.some(keyword => keyword.toLowerCase().includes(query))
            );
        }

        if (activeCategory === 'recent') {
            return recentEmojis.map(e => ({ e, n: e }));
        }

        return getEmojisByCategory(activeCategory);
    }, [searchQuery, activeCategory, recentEmojis]);

    // Handle emoji selection
    const handleSelect = (emoji) => {
        // Save to recent emojis
        try {
            const recent = [emoji];
            const stored = localStorage.getItem(STORAGE_KEYS.RECENT_EMOJIS);
            if (stored) {
                const existing = JSON.parse(stored).filter(e => e !== emoji);
                recent.push(...existing.slice(0, 35)); // Keep 36 total
            }
            localStorage.setItem(STORAGE_KEYS.RECENT_EMOJIS, JSON.stringify(recent));
        } catch {
            // Ignore storage errors
        }

        onSelect({ type: 'emoji', value: emoji });
    };

    // Check if recent is empty
    const hasRecentEmojis = recentEmojis.length > 0;

    // Category tabs component - appears at bottom
    const CategoryTabs = () => (
        <div className="emoji-category-tabs">
            {EMOJI_CATEGORIES.map((category) => {
                const IconComponent = LucideIcons[category.icon];
                const isDisabled = category.id === 'recent' && !hasRecentEmojis;
                return (
                    <button
                        key={category.id}
                        className={`emoji-category-tab ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => onCategoryChange(category.id)}
                        title={category.name}
                        aria-label={category.name}
                        aria-pressed={activeCategory === category.id}
                        disabled={isDisabled}
                    >
                        {IconComponent && <IconComponent size={20} strokeWidth={1.5} />}
                    </button>
                );
            })}
        </div>
    );

    // Get display title
    const getTitle = () => {
        if (searchQuery) return 'Search Results';
        const category = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
        return category ? category.name : 'Emojis';
    };

    return (
        <div className="emoji-tab-container">
            <div className="emoji-grid-container">
                <div className="emoji-category-section">
                    <div className="emoji-category-header">{getTitle()}</div>
                    <div className="emoji-grid">
                        {filteredEmojis.length > 0 ? (
                            filteredEmojis.map((emoji) => {
                                const isSelected = currentEmoji === emoji.e;
                                const emojiName = typeof emoji.n === 'string' ? emoji.n : (emoji.n?.[0] || emoji.e);
                                return (
                                    <button
                                        key={emoji.e}
                                        className={`emoji-grid-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelect(emoji.e)}
                                        title={emojiName}
                                        aria-label={emojiName}
                                        aria-pressed={isSelected}
                                    >
                                        <span className="emoji-char" aria-hidden="true">{emoji.e}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="emoji-grid-empty">
                                {activeCategory === 'recent' ? 'No recent emojis' : 'No emojis found'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CategoryTabs />
        </div>
    );
};

export default EmojiTab;
