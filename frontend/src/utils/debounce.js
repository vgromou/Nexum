/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @return {Function} The new debounced function with a cancel() method.
 */
export function debounce(func, wait) {
    let timeout;

    function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            timeout = null;
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    }

    /**
     * Cancels any pending debounced execution.
     */
    executedFunction.cancel = function() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return executedFunction;
}
