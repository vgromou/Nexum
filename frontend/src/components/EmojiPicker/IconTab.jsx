import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { ICON_LIST } from './iconList';
import { ICON_COLORS } from './constants';
import { toPascalCase } from './utils';
import './EmojiPicker.css';

/**
 * IconTab - Icon grid with search and color
 */
const IconTab = ({
    searchQuery,
    onSelect,
    currentIcon,
    iconColor
}) => {
    // Filter icons based on search query
    const filteredIcons = useMemo(() => {
        if (!searchQuery.trim()) {
            return ICON_LIST;
        }

        const query = searchQuery.toLowerCase().trim();
        return ICON_LIST.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.keywords.some(k => k.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    const handleSelect = (iconName) => {
        onSelect({
            type: 'icon',
            value: iconName,
            color: ICON_COLORS[iconColor] || ICON_COLORS.orange,
        });
    };

    const colorValue = ICON_COLORS[iconColor] || ICON_COLORS.orange;

    if (filteredIcons.length === 0) {
        return (
            <div className="emoji-grid-empty">
                <span>No icons found</span>
            </div>
        );
    }

    return (
        <div className="emoji-grid-container">
            <div className="emoji-category-section">
                <div className="emoji-category-header">Icons</div>
                <div className="emoji-grid icon-grid">
                    {filteredIcons.map((item) => {
                        const IconComponent = LucideIcons[toPascalCase(item.name)];
                        const isSelected = currentIcon === item.name;

                        if (!IconComponent) return null;

                        return (
                            <button
                                key={item.name}
                                className={`emoji-grid-item icon-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(item.name)}
                                title={item.name.replace(/-/g, ' ')}
                            >
                                <IconComponent size={20} color={colorValue} strokeWidth={2} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

IconTab.displayName = 'IconTab';

export default IconTab;
