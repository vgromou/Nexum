/**
 * Retry Mechanism with Exponential Backoff
 *
 * Features:
 * - Exponential backoff with jitter
 * - Server-provided retry delays (retryAfterMs)
 * - Configurable retry count
 * - Retryable status codes and error codes
 */

/** Default retry configuration */
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableCodes: ['NETWORK_ERROR', 'SERVER_UNAVAILABLE', 'OPERATION_TIMEOUT'],
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @param {object} config - Retry configuration
 * @returns {boolean}
 */
const isRetryable = (error, config) => {
  // Network error (no response) - only retry actual network failures
  // Check for axios network error code to avoid retrying CORS or blocked requests
  if (!error.response) {
    return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
  }

  const status = error.response?.status;
  const errorData = error.response?.data?.error;
  const code = errorData?.code;
  const retryable = errorData?.details?.retryable;

  // Explicitly marked as retryable
  if (retryable === true) {
    return true;
  }

  // Explicitly marked as not retryable
  if (retryable === false) {
    return false;
  }

  // Check retryable status codes
  if (config.retryableStatuses.includes(status)) {
    return true;
  }

  // Check retryable error codes
  if (config.retryableCodes.includes(code)) {
    return true;
  }

  return false;
};

/**
 * Calculate delay before next retry
 * @param {number} attempt - Current attempt number (0-based)
 * @param {Error} error - Error from last attempt
 * @param {object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
const calculateDelay = (attempt, error, config) => {
  // Use server-provided delay if available (rate limiting)
  const serverDelay = error.response?.data?.error?.details?.retryAfterMs;
  if (serverDelay && typeof serverDelay === 'number' && serverDelay > 0) {
    return serverDelay;
  }

  // Exponential backoff: 1s, 2s, 4s, 8s...
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Add jitter (0-30% of delay) to prevent thundering herd
  const jitter = Math.random() * 0.3 * exponentialDelay;

  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
};

/**
 * Execute API call with automatic retry on transient failures
 *
 * @param {Function} apiCall - Async function to execute
 * @param {object} [config] - Retry configuration (uses RETRY_CONFIG defaults)
 * @returns {Promise<*>} Result of apiCall
 * @throws {Error} Last error if all retries exhausted
 *
 * @example
 * // Basic usage
 * const response = await withRetry(() => api.savePage(pageData));
 *
 * @example
 * // Custom config
 * const response = await withRetry(
 *   () => api.uploadFile(file),
 *   { maxRetries: 5, baseDelayMs: 2000 }
 * );
 */
export const withRetry = async (apiCall, config = {}) => {
  const mergedConfig = { ...RETRY_CONFIG, ...config };
  let lastError;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      const shouldRetry =
        attempt < mergedConfig.maxRetries && isRetryable(error, mergedConfig);

      if (!shouldRetry) {
        throw error;
      }

      const delay = calculateDelay(attempt, error, mergedConfig);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Create a retryable version of an API function
 *
 * @param {Function} apiFunc - API function to wrap
 * @param {object} [config] - Retry configuration
 * @returns {Function} Wrapped function with retry logic
 *
 * @example
 * const savePageWithRetry = withRetryWrapper(api.savePage, { maxRetries: 5 });
 * const response = await savePageWithRetry(pageData);
 */
export const withRetryWrapper = (apiFunc, config = {}) => {
  return (...args) => withRetry(() => apiFunc(...args), config);
};
