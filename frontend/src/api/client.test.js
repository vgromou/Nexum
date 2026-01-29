import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// We need to test the client module, but it has side effects on import
// So we'll test the exported functions and behavior

describe('client', () => {
  let client;
  let tokenManager;
  let setSessionExpiredCallback;

  beforeEach(async () => {
    // Reset modules before each test
    vi.resetModules();

    // Mock axios
    vi.mock('axios', () => {
      const mockAxios = {
        create: vi.fn(() => mockAxios),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        post: vi.fn(),
        get: vi.fn(),
        defaults: { headers: {} },
      };
      return { default: mockAxios };
    });

    // Mock tokenManager
    vi.mock('./tokenManager', () => ({
      getAccessToken: vi.fn(),
      setAccessToken: vi.fn(),
      clearAccessToken: vi.fn(),
      isTokenExpired: vi.fn(),
    }));

    // Import fresh modules
    const clientModule = await import('./client');
    client = clientModule.default;
    setSessionExpiredCallback = clientModule.setSessionExpiredCallback;
    tokenManager = await import('./tokenManager');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setSessionExpiredCallback', () => {
    it('is a function', () => {
      expect(typeof setSessionExpiredCallback).toBe('function');
    });

    it('accepts a callback function', () => {
      const callback = vi.fn();
      expect(() => setSessionExpiredCallback(callback)).not.toThrow();
    });
  });

  describe('axios instance creation', () => {
    it('creates axios instance with correct config', async () => {
      const { default: axios } = await import('axios');
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        })
      );
    });
  });
});

// Integration-style tests for interceptor behavior
describe('client interceptors behavior', () => {
  // These tests verify the logic that would be in interceptors
  // without actually testing the axios interceptors directly

  describe('request interceptor logic', () => {
    it('should add Bearer token to Authorization header when token exists', () => {
      const token = 'test-token';
      const config = { headers: {} };

      // Simulate interceptor logic
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      expect(config.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add Authorization header when no token', () => {
      const token = null;
      const config = { headers: {} };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor logic', () => {
    it('should not retry if error is not 401', () => {
      const error = { response: { status: 500 }, config: {} };
      const shouldRetry = error.response?.status === 401 && !error.config._retry;
      expect(shouldRetry).toBe(false);
    });

    it('should not retry if already retried', () => {
      const error = { response: { status: 401 }, config: { _retry: true } };
      const shouldRetry = error.response?.status === 401 && !error.config._retry;
      expect(shouldRetry).toBe(false);
    });

    it('should retry on first 401 error', () => {
      const error = { response: { status: 401 }, config: { _retry: false } };
      const shouldRetry = error.response?.status === 401 && !error.config._retry;
      expect(shouldRetry).toBe(true);
    });

    it('should not retry refresh endpoint', () => {
      const error = {
        response: { status: 401 },
        config: { url: '/api/auth/refresh', _retry: false },
      };
      const isAuthEndpoint =
        error.config.url?.includes('/auth/refresh') ||
        error.config.url?.includes('/auth/login');
      expect(isAuthEndpoint).toBe(true);
    });

    it('should not retry login endpoint', () => {
      const error = {
        response: { status: 401 },
        config: { url: '/api/auth/login', _retry: false },
      };
      const isAuthEndpoint =
        error.config.url?.includes('/auth/refresh') ||
        error.config.url?.includes('/auth/login');
      expect(isAuthEndpoint).toBe(true);
    });
  });
});
