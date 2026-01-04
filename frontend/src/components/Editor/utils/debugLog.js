/**
 * Debug logging utilities for the block editor.
 * Logs are only output in development mode.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Debug logger that only outputs in development mode.
 * @param {string} namespace - The namespace/component for the log (e.g., 'CrossBlockSelection')
 * @param {string} message - The log message
 * @param {...any} args - Additional arguments to log
 */
export const debugLog = (namespace, message, ...args) => {
    if (isDevelopment) {
        console.log(`[${namespace}] ${message}`, ...args);
    }
};

/**
 * Creates a namespaced logger for a specific component.
 * @param {string} namespace - The namespace for all logs from this logger
 * @returns {Function} A logger function that auto-prefixes the namespace
 */
export const createLogger = (namespace) => {
    return (message, ...args) => {
        if (isDevelopment) {
            console.log(`[${namespace}] ${message}`, ...args);
        }
    };
};

export default debugLog;
