import React from 'react';
import { ICON_COLORS, COLOR_ORDER } from './constants';
import './EmojiPicker.css';

/**
 * ColorPicker - Dropdown for selecting icon color
 */
const ColorPicker = ({ currentColor, onColorChange, onClose }) => {
    const handleColorClick = (colorName) => {
        onColorChange(colorName);
        onClose();
    };

    return (
        <div className="color-picker-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="color-picker-grid">
                {COLOR_ORDER.map((row, rowIndex) => (
                    <div key={rowIndex} className="color-picker-row">
                        {row.map((colorName) => (
                            <button
                                key={colorName}
                                className={`color-picker-swatch ${currentColor === colorName ? 'selected' : ''}`}
                                style={{ backgroundColor: ICON_COLORS[colorName] }}
                                onClick={() => handleColorClick(colorName)}
                                title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                                aria-label={`Select ${colorName} color`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
