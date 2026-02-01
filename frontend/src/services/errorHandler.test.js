import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';
import {
  parseError,
  handleApiError,
  setErrorHandlerRefs,
  getErrorHandlerRefs,
  createErrorHandler,
} from './errorHandler';

vi.mock('@sentry/react', () => ({
  getClient: vi.fn(),
  withScope: vi.fn(),
  captureException: vi.fn(),
}));

describe('errorHandler', () => {
  const mockShowToast = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    setErrorHandlerRefs({ showToast: mockShowToast, navigate: mockNavigate });
    vi.clearAllMocks();
    // Default: Sentry not initialized
    vi.mocked(Sentry.getClient).mockReturnValue(undefined);
  });

  afterEach(() => {
    setErrorHandlerRefs({ showToast: null, navigate: null });
  });

  describe('parseError', () => {
    it('handles network error (no response)', () => {
      const error = new Error('Network Error');

      const result = parseError(error);

      expect(result).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Не удалось подключиться к серверу',
        displayType: 'toast',
        status: null,
        traceId: null,
        details: null,
        fieldErrors: null,
      });
    });

    it('handles ASP.NET validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: {
            title: 'Validation failed',
            errors: {
              Email: ['Email is required', 'Email must be valid'],
              Password: ['Password too short'],
            },
            traceId: 'trace-123',
          },
        },
      };

      const result = parseError(error);

      expect(result).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        displayType: 'field',
        status: 400,
        traceId: 'trace-123',
        details: null,
        fieldErrors: {
          Email: 'Email is required',
          Password: 'Password too short',
        },
      });
    });

    it('handles custom API error format', () => {
      const error = {
        response: {
          status: 403,
          data: {
            error: {
              code: 'ACCESS_DENIED',
              message: 'You do not have permission',
              displayType: 'page',
              traceId: 'trace-456',
              details: { requiredRole: 'admin' },
            },
          },
        },
      };

      const result = parseError(error);

      expect(result).toEqual({
        code: 'ACCESS_DENIED',
        message: 'You do not have permission',
        displayType: 'page',
        status: 403,
        traceId: 'trace-456',
        details: { requiredRole: 'admin' },
        fieldErrors: null,
      });
    });

    it('uses default message for known status codes', () => {
      const error = {
        response: {
          status: 401,
          data: {},
        },
      };

      const result = parseError(error);

      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.message).toBe('Необходима авторизация');
    });

    it('handles 404 status', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      };

      const result = parseError(error);

      expect(result.code).toBe('NOT_FOUND');
      expect(result.message).toBe('Ресурс не найден');
    });

    it('handles 500 status', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };

      const result = parseError(error);

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.message).toBe('Внутренняя ошибка сервера');
    });

    it('handles 429 rate limit status', () => {
      const error = {
        response: {
          status: 429,
          data: {},
        },
      };

      const result = parseError(error);

      expect(result.code).toBe('RATE_LIMITED');
      expect(result.message).toBe('Слишком много запросов');
    });
  });

  describe('handleApiError', () => {
    it('shows toast for toast displayType', () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: {
              code: 'SERVER_ERROR',
              message: 'Something went wrong',
              displayType: 'toast',
            },
          },
        },
      };

      handleApiError(error);

      expect(mockShowToast).toHaveBeenCalledWith({
        variant: 'error',
        message: 'Something went wrong',
      });
    });

    it('navigates to error page for page displayType', () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: {
              code: 'CRITICAL_ERROR',
              message: 'Critical failure',
              displayType: 'page',
              traceId: 'trace-789',
            },
          },
        },
      };

      handleApiError(error);

      expect(mockNavigate).toHaveBeenCalledWith('/error', {
        state: {
          code: 'CRITICAL_ERROR',
          message: 'Critical failure',
          traceId: 'trace-789',
        },
      });
    });

    it('does not show toast for field displayType', () => {
      const error = {
        response: {
          status: 400,
          data: {
            errors: {
              Email: ['Invalid email'],
            },
          },
        },
      };

      handleApiError(error);

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('returns parsed error for component use', () => {
      const error = {
        response: {
          status: 400,
          data: {
            errors: {
              Email: ['Invalid email'],
            },
          },
        },
      };

      const result = handleApiError(error);

      expect(result.fieldErrors).toEqual({ Email: 'Invalid email' });
    });

    it('respects silent option', () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: {
              message: 'Error',
              displayType: 'toast',
            },
          },
        },
      };

      handleApiError(error, { silent: true });

      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('respects overrideDisplayType option', () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: {
              message: 'Error',
              displayType: 'toast',
            },
          },
        },
      };

      handleApiError(error, { overrideDisplayType: 'silent' });

      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('uses fallbackMessage for unknown errors', () => {
      const error = {
        response: {
          status: 418,
          data: {},
        },
      };

      handleApiError(error, { fallbackMessage: 'Custom message' });

      expect(mockShowToast).toHaveBeenCalledWith({
        variant: 'error',
        message: 'Custom message',
      });
    });
  });

  describe('setErrorHandlerRefs / getErrorHandlerRefs', () => {
    it('sets and gets refs correctly', () => {
      const newShowToast = vi.fn();
      const newNavigate = vi.fn();

      setErrorHandlerRefs({ showToast: newShowToast, navigate: newNavigate });

      const refs = getErrorHandlerRefs();
      expect(refs.showToast).toBe(newShowToast);
      expect(refs.navigate).toBe(newNavigate);
    });
  });

  describe('createErrorHandler', () => {
    it('creates handler with default options', () => {
      const handler = createErrorHandler({ silent: true });

      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Error', displayType: 'toast' } },
        },
      };

      handler(error);

      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('allows overriding default options', () => {
      const handler = createErrorHandler({ silent: true });

      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Error', displayType: 'toast' } },
        },
      };

      handler(error, { silent: false });

      expect(mockShowToast).toHaveBeenCalled();
    });
  });

  describe('Sentry integration', () => {
    it('reports error to Sentry when initialized', () => {
      const mockScope = {
        setTag: vi.fn(),
        setExtra: vi.fn(),
      };
      vi.mocked(Sentry.getClient).mockReturnValue({});
      vi.mocked(Sentry.withScope).mockImplementation((callback) =>
        callback(mockScope)
      );

      const error = {
        response: {
          status: 500,
          data: {
            error: {
              code: 'SERVER_ERROR',
              message: 'Something went wrong',
              displayType: 'toast',
              traceId: 'trace-123',
              details: { foo: 'bar' },
            },
          },
        },
      };

      handleApiError(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(mockScope.setTag).toHaveBeenCalledWith('errorCode', 'SERVER_ERROR');
      expect(mockScope.setTag).toHaveBeenCalledWith('displayType', 'toast');
      expect(mockScope.setTag).toHaveBeenCalledWith('traceId', 'trace-123');
      expect(mockScope.setExtra).toHaveBeenCalledWith('details', { foo: 'bar' });
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('does not report to Sentry when not initialized', () => {
      vi.mocked(Sentry.getClient).mockReturnValue(undefined);

      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Error' } },
        },
      };

      handleApiError(error);

      expect(Sentry.withScope).not.toHaveBeenCalled();
    });
  });
});
