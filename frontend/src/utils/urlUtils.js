/**
 * URL utility functions for link handling.
 */

/**
 * Validates if a string is a valid URL.
 * Accepts URLs with protocols (http://, https://) or domain patterns without protocol.
 * @param {string} string - The string to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (string) => {
    if (!string || !string.trim()) return false;

    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        // Check for domain pattern without protocol
        return /^[\w-]+(\.[\w-]+)+/.test(string.trim());
    }
};

/**
 * Normalizes a URL by adding https:// if no protocol is present.
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL
 */
export const normalizeUrl = (url) => {
    if (!url || !url.trim()) return '';

    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};
