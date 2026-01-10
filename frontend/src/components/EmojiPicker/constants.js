/**
 * Icon color palette matching text highlight colors
 * Order: default, gray, brown, orange, yellow, green, blue, purple, magenta, red
 */
export const ICON_COLORS = {
    default: '#1F2937',
    gray: '#6B7280',
    brown: '#92400E',
    orange: '#C2410C',
    yellow: '#A16207',
    green: '#166534',
    blue: '#1E40AF',
    purple: '#7C3AED',
    magenta: '#DB2777',
    red: '#DC2626',
};

export const DEFAULT_ICON_COLOR = 'default';

/**
 * Emoji categories with Lucide icon names
 * Order matches Figma design
 */
export const EMOJI_CATEGORIES = [
    { id: 'recent', name: 'Recent', icon: 'Clock' },
    { id: 'people', name: 'People', icon: 'Smile' },
    { id: 'nature', name: 'Nature', icon: 'Leaf' },
    { id: 'food', name: 'Food', icon: 'Carrot' },
    { id: 'activities', name: 'Activities', icon: 'Dribbble' },
    { id: 'travel', name: 'Travel', icon: 'Plane' },
    { id: 'objects', name: 'Objects', icon: 'Lightbulb' },
    { id: 'symbols', name: 'Symbols', icon: 'CircleCheck' },
    { id: 'flags', name: 'Flags', icon: 'Flag' },
];

export const STORAGE_KEYS = {
    RECENT_EMOJIS: 'emoji-picker-recent',
    ICON_COLOR: 'emoji-picker-icon-color',
};

export const MAX_RECENT_EMOJIS = 36;
export const SEARCH_DEBOUNCE_MS = 150;
export const FOCUS_DELAY_MS = 50;
