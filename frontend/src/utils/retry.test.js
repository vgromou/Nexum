import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, withRetryWrapper, RETRY_CONFIG } from './retry';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withRetry', () => {
    it('returns result on successful call', async () => {
      const apiCall = vi.fn().mockResolvedValue({ data: 'success' });

      const result = await withRetry(apiCall);

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('retries on network error with ERR_NETWORK code', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: 'success' });

      const promise = withRetry(apiCall);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('retries on timeout error with ECONNABORTED code', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({ data: 'success' });

      const promise = withRetry(apiCall);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('does not retry on errors without response and without network error code', async () => {
      const unknownError = new Error('Unknown error');
      const apiCall = vi.fn().mockRejectedValue(unknownError);

      await expect(withRetry(apiCall)).rejects.toEqual(unknownError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable status codes', async () => {
      const serverError = { response: { status: 503 } };
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue({ data: 'success' });

      const promise = withRetry(apiCall);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('retries when details.retryable is true', async () => {
      const retryableError = {
        response: {
          status: 400,
          data: { error: { details: { retryable: true } } },
        },
      };
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue({ data: 'success' });

      const promise = withRetry(apiCall);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('does not retry when details.retryable is false', async () => {
      const nonRetryableError = {
        response: {
          status: 503,
          data: { error: { details: { retryable: false } } },
        },
      };
      const apiCall = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(withRetry(apiCall)).rejects.toEqual(nonRetryableError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('does not retry on non-retryable status codes', async () => {
      const clientError = { response: { status: 400 } };
      const apiCall = vi.fn().mockRejectedValue(clientError);

      await expect(withRetry(apiCall)).rejects.toEqual(clientError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 401', async () => {
      const authError = { response: { status: 401 } };
      const apiCall = vi.fn().mockRejectedValue(authError);

      await expect(withRetry(apiCall)).rejects.toEqual(authError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 403', async () => {
      const forbiddenError = { response: { status: 403 } };
      const apiCall = vi.fn().mockRejectedValue(forbiddenError);

      await expect(withRetry(apiCall)).rejects.toEqual(forbiddenError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 404', async () => {
      const notFoundError = { response: { status: 404 } };
      const apiCall = vi.fn().mockRejectedValue(notFoundError);

      await expect(withRetry(apiCall)).rejects.toEqual(notFoundError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 422', async () => {
      const validationError = { response: { status: 422 } };
      const apiCall = vi.fn().mockRejectedValue(validationError);

      await expect(withRetry(apiCall)).rejects.toEqual(validationError);
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable error codes', async () => {
      const errorWithCode = {
        response: {
          status: 400,
          data: { error: { code: 'NETWORK_ERROR' } },
        },
      };
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(errorWithCode)
        .mockResolvedValue({ data: 'success' });

      const promise = withRetry(apiCall);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('exhausts retries and throws last error', async () => {
      const serverError = { response: { status: 500 } };
      const apiCall = vi.fn().mockRejectedValue(serverError);

      const promise = withRetry(apiCall, { maxRetries: 2 });

      let caughtError;
      promise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await Promise.resolve(); // Flush microtasks

      expect(caughtError).toEqual(serverError);
      expect(apiCall).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('respects server-provided retryAfterMs', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: { error: { details: { retryAfterMs: 5000 } } },
        },
      };
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue({ data: 'success' });

      const promise = withRetry(apiCall);

      // Advance time less than retryAfterMs
      await vi.advanceTimersByTimeAsync(4000);
      expect(apiCall).toHaveBeenCalledTimes(1);

      // Advance remaining time
      await vi.advanceTimersByTimeAsync(1000);
      expect(apiCall).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toEqual({ data: 'success' });
    });

    it('uses exponential backoff', async () => {
      const serverError = { response: { status: 500 } };
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue({ data: 'success' });

      // Mock Math.random to return 0 (no jitter)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      const promise = withRetry(apiCall, { baseDelayMs: 1000 });

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(apiCall).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms (exponential)
      await vi.advanceTimersByTimeAsync(2000);
      expect(apiCall).toHaveBeenCalledTimes(3);

      await promise;
      randomSpy.mockRestore();
    });

    it('caps delay at maxDelayMs', async () => {
      const serverError = { response: { status: 500 } };
      const apiCall = vi.fn().mockRejectedValue(serverError);

      // Mock Math.random to return 0 (no jitter)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      const promise = withRetry(apiCall, {
        maxRetries: 5,
        baseDelayMs: 5000,
        maxDelayMs: 10000,
      });

      let caughtError;
      promise.catch((e) => {
        caughtError = e;
      });

      // First delay would be 5000ms
      await vi.advanceTimersByTimeAsync(5000);
      expect(apiCall).toHaveBeenCalledTimes(2);

      // Second delay would be 10000ms (capped at max)
      await vi.advanceTimersByTimeAsync(10000);
      expect(apiCall).toHaveBeenCalledTimes(3);

      // Third delay is also capped at 10000ms
      await vi.advanceTimersByTimeAsync(10000);
      expect(apiCall).toHaveBeenCalledTimes(4);

      await vi.runAllTimersAsync();
      await Promise.resolve(); // Flush microtasks

      expect(caughtError).toEqual(serverError);
      randomSpy.mockRestore();
    });

    it('uses custom config', async () => {
      const serverError = { response: { status: 500 } };
      const apiCall = vi.fn().mockRejectedValue(serverError);

      const promise = withRetry(apiCall, { maxRetries: 1 });

      let caughtError;
      promise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await Promise.resolve(); // Flush microtasks

      expect(caughtError).toEqual(serverError);
      expect(apiCall).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('withRetryWrapper', () => {
    it('wraps API function with retry logic', async () => {
      const serverError = { response: { status: 503 } };
      const apiFunc = vi
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue({ data: 'success' });

      const wrappedFunc = withRetryWrapper(apiFunc);
      const promise = wrappedFunc('arg1', 'arg2');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      expect(apiFunc).toHaveBeenCalledTimes(2);
      expect(apiFunc).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('passes custom config to wrapper', async () => {
      const serverError = { response: { status: 500 } };
      const apiFunc = vi.fn().mockRejectedValue(serverError);

      const wrappedFunc = withRetryWrapper(apiFunc, { maxRetries: 1 });
      const promise = wrappedFunc();

      let caughtError;
      promise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await Promise.resolve(); // Flush microtasks

      expect(caughtError).toEqual(serverError);
      expect(apiFunc).toHaveBeenCalledTimes(2);
    });
  });

  describe('RETRY_CONFIG', () => {
    it('has expected default values', () => {
      expect(RETRY_CONFIG).toEqual({
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        retryableCodes: [
          'NETWORK_ERROR',
          'SERVER_UNAVAILABLE',
          'OPERATION_TIMEOUT',
        ],
      });
    });
  });
});
