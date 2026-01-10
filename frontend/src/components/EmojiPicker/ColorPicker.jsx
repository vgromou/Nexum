import React from 'react';
import { ICON_COLORS } from './constants';

/**
 * ColorPicker - Standalone dropdown for selecting icon color
 * Note: For the main emoji picker, colors are now shown in the IconTab.
 * This component is kept for backward compatibility and standalone use.
 */
const ColorPicker = ({ currentColor, onColorChange, onClose }) => {
    const colorNames = Object.keys(ICON_COLORS);

    const handleColorClick = (colorName) => {
        onColorChange(colorName);
        onClose?.();
    };

    return (
        <div className="color-picker-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="color-picker-grid">
                {colorNames.map((colorName) => (
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
        </div>
    );
};

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
