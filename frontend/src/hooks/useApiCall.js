/**
 * useApiCall Hook
 *
 * Convenient wrapper for API calls with:
 * - Loading state management
 * - Automatic error handling via errorHandler
 * - Success toast notifications
 * - Field errors extraction for forms
 * - Optional retry with exponential backoff
 */

import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { handleApiError, parseError } from '../services/errorHandler';
import { withRetry } from '../utils/retry';

/**
 * Hook for making API calls with built-in loading and error handling
 *
 * @returns {{
 *   call: (apiPromise: Promise, options?: object) => Promise<{data: any, error: object|null, fieldErrors: object|null}>,
 *   loading: boolean
 * }}
 *
 * @example
 * // Simple usage
 * const { call, loading } = useApiCall();
 * const { data, error } = await call(api.getUser(userId));
 *
 * @example
 * // With success message
 * const { data } = await call(api.saveData(formData), {
 *   successMessage: 'Сохранено!'
 * });
 *
 * @example
 * // Form with field errors
 * const { data, fieldErrors } = await call(api.register(formData));
 * if (fieldErrors) {
 *   setFormErrors(fieldErrors);
 * }
 *
 * @example
 * // With retry
 * const { data } = await call(api.uploadFile(file), {
 *   retry: true,
 *   retryConfig: { maxRetries: 5 }
 * });
 */
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const call = useCallback(
    async (apiPromise, options = {}) => {
      const {
        successMessage,
        retry = false,
        retryConfig,
        silent = false,
        onSuccess,
        onError,
      } = options;

      setLoading(true);

      try {
        let response;

        if (retry) {
          // Wrap in retry logic
          response = await withRetry(() => apiPromise, retryConfig);
        } else {
          response = await apiPromise;
        }

        // Show success toast if message provided
        if (successMessage) {
          showToast({ variant: 'success', message: successMessage });
        }

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data);
        }

        return { data: response.data, error: null, fieldErrors: null };
      } catch (error) {
        // Parse the error
        const parsed = silent
          ? parseError(error)
          : handleApiError(error);

        // Call error callback if provided
        if (onError) {
          onError(parsed);
        }

        return {
          data: null,
          error: parsed,
          fieldErrors: parsed.fieldErrors,
        };
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  return { call, loading };
}

/**
 * Hook for making API calls with custom loading state key
 * Useful when you need multiple independent loading states
 *
 * @returns {{
 *   call: (key: string, apiPromise: Promise, options?: object) => Promise,
 *   isLoading: (key: string) => boolean,
 *   loadingKeys: Set<string>
 * }}
 *
 * @example
 * const { call, isLoading } = useApiCallWithKey();
 *
 * await call('saveUser', api.saveUser(data));
 * await call('deleteUser', api.deleteUser(id));
 *
 * // In render
 * <Button loading={isLoading('saveUser')}>Save</Button>
 * <Button loading={isLoading('deleteUser')}>Delete</Button>
 */
export function useApiCallWithKey() {
  const [loadingKeys, setLoadingKeys] = useState(new Set());
  const { showToast } = useToast();

  const isLoading = useCallback(
    (key) => loadingKeys.has(key),
    [loadingKeys]
  );

  const call = useCallback(
    async (key, apiPromise, options = {}) => {
      const {
        successMessage,
        retry = false,
        retryConfig,
        silent = false,
        onSuccess,
        onError,
      } = options;

      setLoadingKeys((prev) => new Set(prev).add(key));

      try {
        let response;

        if (retry) {
          response = await withRetry(() => apiPromise, retryConfig);
        } else {
          response = await apiPromise;
        }

        if (successMessage) {
          showToast({ variant: 'success', message: successMessage });
        }

        if (onSuccess) {
          onSuccess(response.data);
        }

        return { data: response.data, error: null, fieldErrors: null };
      } catch (error) {
        const parsed = silent
          ? parseError(error)
          : handleApiError(error);

        if (onError) {
          onError(parsed);
        }

        return {
          data: null,
          error: parsed,
          fieldErrors: parsed.fieldErrors,
        };
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [showToast]
  );

  return { call, isLoading, loadingKeys };
}

export default useApiCall;
