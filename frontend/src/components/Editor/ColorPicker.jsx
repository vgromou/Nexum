import React, { useState, useEffect } from 'react';
import './ColorPicker.css';

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

const STORAGE_KEY = 'colorPickerRecentlyUsed';
const MAX_RECENT = 5;

/**
 * Gets recently used colors from localStorage.
 * @returns {Array<{type: 'text'|'bg', name: string}>}
 */
const getRecentlyUsed = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Saves a color to recently used.
 * @param {'text'|'bg'} type - Type of color
 * @param {string} name - Color name
 */
const saveRecentlyUsed = (type, name) => {
    try {
        const recent = getRecentlyUsed();
        // Remove if already exists
        const filtered = recent.filter(c => !(c.type === type && c.name === name));
        // Add to front
        const updated = [{ type, name }, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch {
        return [];
    }
};

/**
 * ColorPicker - A popup for selecting text and background colors.
 * Shows three sections: Recently Used, Text Color, Background Color.
 */
const ColorPicker = ({
    position,
    activeTextColor = null,
    activeBgColor = null,
    onTextColorChange,
    onBgColorChange,
    onClose,
}) => {
    const [recentlyUsed, setRecentlyUsed] = useState(getRecentlyUsed());

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleTextColorClick = (e, colorName) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = saveRecentlyUsed('text', colorName);
        setRecentlyUsed(updated);
        onTextColorChange(colorName);
    };

    const handleBgColorClick = (e, colorName) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = saveRecentlyUsed('bg', colorName);
        setRecentlyUsed(updated);
        onBgColorChange(colorName);
    };

    const handleRecentClick = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.type === 'text') {
            onTextColorChange(item.name);
        } else {
            onBgColorChange(item.name);
        }
    };

    // Split colors into rows of 5
    const colorsRow1 = HIGHLIGHT_COLORS.slice(0, 5);
    const colorsRow2 = HIGHLIGHT_COLORS.slice(5);

    return (
        <div
            className="color-picker"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            {/* Recently Used Section */}
            <div className="color-picker-section">
                <div className="color-picker-header">Recently used</div>
                <div className="color-picker-palette">
                    <div className="color-picker-row">
                        {recentlyUsed.length > 0 ? (
                            recentlyUsed.map((item, index) => (
                                <button
                                    key={`recent-${index}`}
                                    className={`color-picker-swatch ${item.type === 'text' ? 'text-swatch' : 'bg-swatch'} color-${item.name}`}
                                    onClick={(e) => handleRecentClick(e, item)}
                                    title={`${item.type === 'text' ? 'Text' : 'Background'}: ${item.name}`}
                                >
                                    {item.type === 'text' && <span className="swatch-letter">A</span>}
                                </button>
                            ))
                        ) : (
                            <span className="color-picker-empty">No recent colors</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Text Color Section */}
            <div className="color-picker-section">
                <div className="color-picker-header">Text color</div>
                <div className="color-picker-palette">
                    <div className="color-picker-row">
                        {colorsRow1.map((color) => (
                            <button
                                key={`text-${color.name}`}
                                className={`color-picker-swatch text-swatch color-${color.name} ${activeTextColor === color.name ? 'active' : ''}`}
                                onClick={(e) => handleTextColorClick(e, color.name)}
                                title={color.label}
                            >
                                <span className="swatch-letter">A</span>
                            </button>
                        ))}
                    </div>
                    <div className="color-picker-row">
                        {colorsRow2.map((color) => (
                            <button
                                key={`text-${color.name}`}
                                className={`color-picker-swatch text-swatch color-${color.name} ${activeTextColor === color.name ? 'active' : ''}`}
                                onClick={(e) => handleTextColorClick(e, color.name)}
                                title={color.label}
                            >
                                <span className="swatch-letter">A</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Background Color Section */}
            <div className="color-picker-section">
                <div className="color-picker-header">Background color</div>
                <div className="color-picker-palette">
                    <div className="color-picker-row">
                        {colorsRow1.map((color) => (
                            <button
                                key={`bg-${color.name}`}
                                className={`color-picker-swatch bg-swatch color-${color.name} ${activeBgColor === color.name ? 'active' : ''}`}
                                onClick={(e) => handleBgColorClick(e, color.name)}
                                title={color.label}
                            />
                        ))}
                    </div>
                    <div className="color-picker-row">
                        {colorsRow2.map((color) => (
                            <button
                                key={`bg-${color.name}`}
                                className={`color-picker-swatch bg-swatch color-${color.name} ${activeBgColor === color.name ? 'active' : ''}`}
                                onClick={(e) => handleBgColorClick(e, color.name)}
                                title={color.label}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorPicker;
