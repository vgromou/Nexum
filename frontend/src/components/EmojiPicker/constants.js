/**
 * Icon color palette matching Notion's design system
 */
export const ICON_COLORS = {
    black: '#37352F',
    gray: '#9B9A97',
    brown: '#64473A',
    orange: '#D9730D',
    yellow: '#DFAB01',
    green: '#0F7B6C',
    blue: '#0B6E99',
    purple: '#6940A5',
    pink: '#AD1A72',
    red: '#E03E3E',
};

export const COLOR_ORDER = [
    ['black', 'gray', 'brown', 'yellow', 'orange'],
    ['green', 'blue', 'purple', 'pink', 'red'],
];

export const DEFAULT_ICON_COLOR = 'black';

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

export const MAX_RECENT_EMOJIS = 32;
export const SEARCH_DEBOUNCE_MS = 150;
export const FOCUS_DELAY_MS = 50;
