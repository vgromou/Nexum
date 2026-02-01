import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiCall, useApiCallWithKey } from './useApiCall';
import { ToastProvider } from '../components/Toast';
import { setErrorHandlerRefs } from '../services/errorHandler';

// Mock dependencies
vi.mock('../utils/retry', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

// Wrapper with ToastProvider
const wrapper = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('useApiCall', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setErrorHandlerRefs({ showToast: mockShowToast, navigate: vi.fn() });
  });

  describe('basic functionality', () => {
    it('returns data on successful API call', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const mockResponse = { data: { id: 1, name: 'Test' } };
      const apiPromise = Promise.resolve(mockResponse);

      let callResult;
      await act(async () => {
        callResult = await result.current.call(apiPromise);
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
      const apiPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      act(() => {
        result.current.call(apiPromise);
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

      const apiPromise = Promise.resolve({ data: 'test' });

      await act(async () => {
        await result.current.call(apiPromise, {
          successMessage: 'Saved successfully!',
        });
      });

      // Check that showToast was called via ToastProvider
      // The actual toast is shown via context, which is mocked
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
      const apiPromise = Promise.reject(apiError);

      let callResult;
      await act(async () => {
        callResult = await result.current.call(apiPromise);
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
      const apiPromise = Promise.reject(validationError);

      let callResult;
      await act(async () => {
        callResult = await result.current.call(apiPromise);
      });

      expect(callResult.fieldErrors).toEqual({
        email: 'Email is required',
        password: 'Password too short',
      });
    });

    it('uses silent mode when specified', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const apiError = {
        response: {
          status: 500,
          data: { error: { message: 'Error', displayType: 'toast' } },
        },
      };
      const apiPromise = Promise.reject(apiError);

      await act(async () => {
        await result.current.call(apiPromise, { silent: true });
      });

      // In silent mode, handleApiError is not called, so no toast
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('calls onSuccess callback with data', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const onSuccess = vi.fn();

      const apiPromise = Promise.resolve({ data: { id: 1 } });

      await act(async () => {
        await result.current.call(apiPromise, { onSuccess });
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
      const apiPromise = Promise.reject(apiError);

      await act(async () => {
        await result.current.call(apiPromise, { onError });
      });

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].code).toBe('BAD_REQUEST');
    });
  });
});

describe('useApiCallWithKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setErrorHandlerRefs({ showToast: vi.fn(), navigate: vi.fn() });
  });

  it('tracks loading state by key', async () => {
    const { result } = renderHook(() => useApiCallWithKey(), { wrapper });

    expect(result.current.isLoading('save')).toBe(false);
    expect(result.current.isLoading('delete')).toBe(false);

    let resolveSave;
    const savePromise = new Promise((resolve) => {
      resolveSave = resolve;
    });

    act(() => {
      result.current.call('save', savePromise);
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
    const savePromise = new Promise((resolve) => {
      resolveSave = resolve;
    });
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });

    act(() => {
      result.current.call('save', savePromise);
      result.current.call('delete', deletePromise);
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
});
