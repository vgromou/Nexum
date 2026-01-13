import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { ICON_COLORS } from './constants';
import { ICON_LIST } from './iconList';
import { toPascalCase } from './utils';

/**
 * IconTab - Displays icon grid with color picker at bottom
 * 
 * Features:
 * - Searchable icon grid (Lucide icons)
 * - Color picker bar at bottom with 10 color swatches
 * - Selected color persisted to localStorage
 */
const IconTab = ({
    searchQuery,
    onSelect,
    currentIcon,
    iconColor,
    onColorChange
}) => {
    // Filter icons based on search query
    const filteredIcons = useMemo(() => {
        if (!searchQuery) return ICON_LIST;

        const query = searchQuery.toLowerCase();
        return ICON_LIST.filter(icon =>
            icon.name.toLowerCase().includes(query) ||
            icon.keywords?.some(kw => kw.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    // Get actual color value
    const colorValue = ICON_COLORS[iconColor] || ICON_COLORS.default;

    // Handle icon selection
    const handleSelect = (iconName) => {
        onSelect({
            type: 'icon',
            value: iconName,
            color: colorValue
        });
    };

    // Color names for iteration
    const colorNames = Object.keys(ICON_COLORS);

    return (
        <div className="icon-tab-container">
            <div className="emoji-grid-container">
                <div className="emoji-category-section">
                    <div className="emoji-category-header">Icons</div>
                    <div className="emoji-grid icon-grid">
                        {filteredIcons.length > 0 ? (
                            filteredIcons.map((item) => {
                                const IconComponent = LucideIcons[toPascalCase(item.name)];
                                const isSelected = currentIcon === item.name;

                                if (!IconComponent) return null;

                                const iconLabel = item.name.replace(/-/g, ' ');
                                return (
                                    <button
                                        key={item.name}
                                        className={`emoji-grid-item icon-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelect(item.name)}
                                        title={iconLabel}
                                        aria-label={iconLabel}
                                        aria-pressed={isSelected}
                                    >
                                        <IconComponent size={20} color={colorValue} strokeWidth={2} aria-hidden="true" />
                                    </button>
                                );
                            })
                        ) : (
                            <div className="emoji-grid-empty">
                                <span>No icons found</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Color picker bar at bottom */}
            <div className="icon-color-bar" role="group" aria-label="Icon color picker">
                {colorNames.map((colorName) => {
                    const colorLabel = colorName.charAt(0).toUpperCase() + colorName.slice(1);
                    return (
                        <button
                            key={colorName}
                            className={`icon-color-swatch ${iconColor === colorName ? 'active' : ''}`}
                            onClick={() => onColorChange(colorName)}
                            title={colorLabel}
                            aria-label={`Select ${colorLabel} color`}
                            aria-pressed={iconColor === colorName}
                        >
                            <span
                                className="swatch-color"
                                style={{ backgroundColor: ICON_COLORS[colorName] }}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default IconTab;
