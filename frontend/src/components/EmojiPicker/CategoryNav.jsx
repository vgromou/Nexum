import React from 'react';
import * as LucideIcons from 'lucide-react';
import { EMOJI_CATEGORIES } from './constants';

/**
 * CategoryNav - Bottom navigation bar for emoji categories
 * Uses Lucide icons spread across full width
 * Note: This component is kept for backward compatibility but 
 * category tabs are now integrated into EmojiTab.jsx
 */
const CategoryNav = ({ activeCategory, onCategoryClick }) => {
    return (
        <div className="emoji-category-tabs">
            {EMOJI_CATEGORIES.map((category) => {
                const IconComponent = LucideIcons[category.icon];
                return (
                    <button
                        key={category.id}
                        className={`emoji-category-tab ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => onCategoryClick(category.id)}
                        title={category.name}
                        aria-label={`Jump to ${category.name}`}
                    >
                        {IconComponent && <IconComponent size={18} strokeWidth={1.5} />}
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryNav;
