import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiCall, useApiCallWithKey } from './useApiCall';
import { ToastProvider, useToast } from '../components/Toast';
import { setErrorHandlerRefs } from '../services/errorHandler';
import { withRetry } from '../utils/retry';

// Mock dependencies
vi.mock('../utils/retry', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

vi.mock('../components/Toast', async () => {
  const actual = await vi.importActual('../components/Toast');
  return {
    ...actual,
    useToast: vi.fn(() => ({ showToast: vi.fn() })),
  };
});

// Wrapper with ToastProvider
const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

describe('useApiCall', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setErrorHandlerRefs({ showToast: mockShowToast, navigate: vi.fn() });
    useToast.mockReturnValue({ showToast: mockShowToast });
  });

  describe('basic functionality', () => {
    it('returns data on successful API call', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const mockResponse = { data: { id: 1, name: 'Test' } };
      const apiCallFn = () => Promise.resolve(mockResponse);

      let callResult;
      await act(async () => {
        callResult = await result.current.call(apiCallFn);
      });

      expect(callResult).toEqual({
        data: { id: 1, name: 'Test' },
        error: null,
        fieldErrors: null,
      });
    });

    it('manages loading state', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      expect(result.current.loading).toBe(false);

      let resolvePromise;
      const apiCallFn = () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        });

      act(() => {
        result.current.call(apiCallFn);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolvePromise({ data: 'test' });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('shows success toast when successMessage provided', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const apiCallFn = () => Promise.resolve({ data: 'test' });

      await act(async () => {
        await result.current.call(apiCallFn, {
          successMessage: 'Saved successfully!',
        });
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        variant: 'success',
        message: 'Saved successfully!',
      });
    });
  });

  describe('error handling', () => {
    it('returns parsed error on API failure', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const apiError = {
        response: {
          status: 500,
          data: {
            error: {
              code: 'SERVER_ERROR',
              message: 'Internal error',
              displayType: 'toast',
            },
          },
        },
      };
      const apiCallFn = () => Promise.reject(apiError);

      let callResult;
      await act(async () => {
        callResult = await result.current.call(apiCallFn);
      });

      expect(callResult.data).toBeNull();
      expect(callResult.error).toBeDefined();
      expect(callResult.error.code).toBe('SERVER_ERROR');
    });

    it('returns field errors for validation failures', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const validationError = {
        response: {
          status: 400,
          data: {
            errors: {
              email: ['Email is required'],
              password: ['Password too short'],
            },
          },
        },
      };
      const apiCallFn = () => Promise.reject(validationError);

      let callResult;
      await act(async () => {
        callResult = await result.current.call(apiCallFn);
      });

      expect(callResult.fieldErrors).toEqual({
        email: 'Email is required',
        password: 'Password too short',
      });
    });

    it('skips error handler when skipErrorHandler is true', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const apiError = {
        response: {
          status: 500,
          data: { error: { message: 'Error', displayType: 'toast' } },
        },
      };
      const apiCallFn = () => Promise.reject(apiError);

      await act(async () => {
        await result.current.call(apiCallFn, { skipErrorHandler: true });
      });

      // When skipErrorHandler is true, handleApiError is not called, so no toast
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('calls onSuccess callback with data', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const onSuccess = vi.fn();

      const apiCallFn = () => Promise.resolve({ data: { id: 1 } });

      await act(async () => {
        await result.current.call(apiCallFn, { onSuccess });
      });

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    });

    it('calls onError callback with parsed error', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const onError = vi.fn();

      const apiError = {
        response: {
          status: 400,
          data: { error: { code: 'BAD_REQUEST' } },
        },
      };
      const apiCallFn = () => Promise.reject(apiError);

      await act(async () => {
        await result.current.call(apiCallFn, { onError });
      });

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].code).toBe('BAD_REQUEST');
    });
  });

  describe('retry', () => {
    it('passes function to withRetry when retry is enabled', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const apiCallFn = vi.fn(() => Promise.resolve({ data: 'test' }));
      const retryConfig = { maxRetries: 5 };

      await act(async () => {
        await result.current.call(apiCallFn, { retry: true, retryConfig });
      });

      expect(withRetry).toHaveBeenCalledWith(apiCallFn, retryConfig);
    });

    it('calls function directly when retry is disabled', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const apiCallFn = vi.fn(() => Promise.resolve({ data: 'test' }));

      await act(async () => {
        await result.current.call(apiCallFn, { retry: false });
      });

      expect(withRetry).not.toHaveBeenCalled();
      expect(apiCallFn).toHaveBeenCalled();
    });
  });
});

describe('useApiCallWithKey', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setErrorHandlerRefs({ showToast: mockShowToast, navigate: vi.fn() });
    useToast.mockReturnValue({ showToast: mockShowToast });
  });

  it('tracks loading state by key', async () => {
    const { result } = renderHook(() => useApiCallWithKey(), { wrapper });

    expect(result.current.isLoading('save')).toBe(false);
    expect(result.current.isLoading('delete')).toBe(false);

    let resolveSave;
    const saveCallFn = () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      });

    act(() => {
      result.current.call('save', saveCallFn);
    });

    await waitFor(() => {
      expect(result.current.isLoading('save')).toBe(true);
      expect(result.current.isLoading('delete')).toBe(false);
    });

    await act(async () => {
      resolveSave({ data: 'saved' });
    });

    await waitFor(() => {
      expect(result.current.isLoading('save')).toBe(false);
    });
  });

  it('handles multiple concurrent calls with different keys', async () => {
    const { result } = renderHook(() => useApiCallWithKey(), { wrapper });

    let resolveSave, resolveDelete;
    const saveCallFn = () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      });
    const deleteCallFn = () =>
      new Promise((resolve) => {
        resolveDelete = resolve;
      });

    act(() => {
      result.current.call('save', saveCallFn);
      result.current.call('delete', deleteCallFn);
    });

    await waitFor(() => {
      expect(result.current.isLoading('save')).toBe(true);
      expect(result.current.isLoading('delete')).toBe(true);
    });

    await act(async () => {
      resolveSave({ data: 'saved' });
    });

    await waitFor(() => {
      expect(result.current.isLoading('save')).toBe(false);
      expect(result.current.isLoading('delete')).toBe(true);
    });

    await act(async () => {
      resolveDelete({ data: 'deleted' });
    });

    await waitFor(() => {
      expect(result.current.isLoading('delete')).toBe(false);
    });
  });

  it('shows success toast when successMessage provided', async () => {
    const { result } = renderHook(() => useApiCallWithKey(), { wrapper });

    const apiCallFn = () => Promise.resolve({ data: 'test' });

    await act(async () => {
      await result.current.call('test', apiCallFn, {
        successMessage: 'Done!',
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      variant: 'success',
      message: 'Done!',
    });
  });
});
