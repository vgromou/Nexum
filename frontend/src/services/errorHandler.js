/**
 * Centralized Error Handler
 *
 * Handles API errors with configurable display strategies:
 * - toast: Show toast notification
 * - field: Return error for field-level display
 * - page: Navigate to error page
 * - none: Log only, no UI feedback (Sentry only)
 *
 * Integrates with:
 * - Toast notifications
 * - React Router navigation
 * - Sentry (when configured)
 */

import * as Sentry from '@sentry/react';

/**
 * Check if Sentry is initialized
 * @returns {boolean}
 */
const isSentryInitialized = () => {
  return Sentry.getClient() !== undefined;
};

// References set by ErrorProvider
let errorHandlerRefs = {
  showToast: null,
  navigate: null,
};

/**
 * Set references for toast and navigate functions
 * Called by ErrorProvider on mount
 * @param {object} refs - { showToast, navigate }
 */
export const setErrorHandlerRefs = (refs) => {
  errorHandlerRefs = { ...errorHandlerRefs, ...refs };
};

/**
 * Get current error handler references
 * @returns {object} Current refs
 */
export const getErrorHandlerRefs = () => errorHandlerRefs;

/**
 * Default error messages by error code
 */
const DEFAULT_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Не удалось подключиться к серверу',
  VALIDATION_FAILED: 'Проверьте введенные данные',
  UNAUTHORIZED: 'Необходима авторизация',
  FORBIDDEN: 'Доступ запрещен',
  NOT_FOUND: 'Ресурс не найден',
  SERVER_ERROR: 'Внутренняя ошибка сервера',
  OPERATION_TIMEOUT: 'Превышено время ожидания',
  RATE_LIMITED: 'Слишком много запросов',
};

/**
 * Parse error response to extract error details
 * @param {Error} error - Axios error or Error object
 * @returns {object} Parsed error details
 */
export const parseError = (error) => {
  // Network error (no response)
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: DEFAULT_ERROR_MESSAGES.NETWORK_ERROR,
      displayType: 'toast',
      status: null,
      traceId: null,
      details: null,
      fieldErrors: null,
    };
  }

  const { status, data } = error.response;

  // ASP.NET validation errors format
  if (data?.errors && typeof data.errors === 'object') {
    const fieldErrors = {};
    for (const [field, messages] of Object.entries(data.errors)) {
      fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
    }
    return {
      code: 'VALIDATION_FAILED',
      message: data.title || DEFAULT_ERROR_MESSAGES.VALIDATION_FAILED,
      displayType: 'field',
      status,
      traceId: data.traceId || null,
      details: null,
      fieldErrors,
    };
  }

  // Custom API error format: { error: { code, message, displayType, details } }
  if (data?.error) {
    const apiError = data.error;
    return {
      code: apiError.code || 'UNKNOWN_ERROR',
      message:
        apiError.message ||
        DEFAULT_ERROR_MESSAGES[apiError.code] ||
        'Произошла ошибка',
      displayType: apiError.displayType || 'toast',
      status,
      traceId: apiError.traceId || null,
      details: apiError.details || null,
      fieldErrors: null,
    };
  }

  // Fallback for unexpected error format
  return {
    code: getCodeFromStatus(status),
    message:
      data?.message ||
      data?.title ||
      DEFAULT_ERROR_MESSAGES[getCodeFromStatus(status)] ||
      'Произошла ошибка',
    displayType: 'toast',
    status,
    traceId: null,
    details: null,
    fieldErrors: null,
  };
};

/**
 * Get error code from HTTP status
 * @param {number} status - HTTP status code
 * @returns {string} Error code
 */
const getCodeFromStatus = (status) => {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 408:
      return 'OPERATION_TIMEOUT';
    case 422:
      return 'VALIDATION_FAILED';
    case 429:
      return 'RATE_LIMITED';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
  }
};

/**
 * Handle API error with appropriate display strategy
 * @param {Error} error - Error to handle
 * @param {object} [options] - Handler options
 * @param {string} [options.fallbackMessage] - Custom message if none in error
 * @param {string} [options.overrideDisplayType] - Force specific display type ('none' to skip UI)
 * @returns {object} Parsed error for component use
 */
export const handleApiError = (error, options = {}) => {
  const parsed = parseError(error);
  const { fallbackMessage, overrideDisplayType } = options;

  // Override message if provided and no specific message
  if (fallbackMessage && parsed.code === 'UNKNOWN_ERROR') {
    parsed.message = fallbackMessage;
  }

  // Override display type if specified
  const displayType = overrideDisplayType || parsed.displayType;

  // Log to Sentry if initialized
  if (isSentryInitialized()) {
    Sentry.withScope((scope) => {
      scope.setTag('errorCode', parsed.code);
      scope.setTag('displayType', displayType);
      if (parsed.traceId) {
        scope.setTag('traceId', parsed.traceId);
      }
      if (parsed.details) {
        scope.setExtra('details', parsed.details);
      }
      Sentry.captureException(error);
    });
  }

  // Handle based on display type
  switch (displayType) {
    case 'toast':
      if (errorHandlerRefs.showToast) {
        errorHandlerRefs.showToast({
          variant: 'error',
          message: parsed.message,
        });
      }
      break;

    case 'page':
      if (errorHandlerRefs.navigate) {
        errorHandlerRefs.navigate('/error', {
          state: {
            code: parsed.code,
            message: parsed.message,
            traceId: parsed.traceId,
          },
        });
      }
      break;

    case 'field':
      // Field errors are returned for component handling
      break;

    case 'none':
      // No UI action - error logged to Sentry only
      break;
  }

  return parsed;
};

/**
 * Create error handler with pre-configured options
 * @param {object} defaultOptions - Default options for handler
 * @returns {Function} Configured error handler
 */
export const createErrorHandler = (defaultOptions) => {
  return (error, options = {}) =>
    handleApiError(error, { ...defaultOptions, ...options });
};
