/**
 * Shared utilities for EmojiPicker components
 */

/**
 * Convert kebab-case to PascalCase for Lucide icon names
 * @param {string} str - kebab-case string (e.g., 'arrow-right')
 * @returns {string} PascalCase string (e.g., 'ArrowRight')
 */
export const toPascalCase = (str) => {
    if (!str) return '';
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
};
