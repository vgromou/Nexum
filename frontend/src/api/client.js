/**
 * HTTP Client - Axios instance with auth interceptors
 *
 * Features:
 * - Automatic Bearer token attachment
 * - Automatic token refresh on 401
 * - Session expiry callback for UI notification
 * - Centralized error handling integration
 */

import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isTokenExpired,
  isTokenExpiringSoon,
} from './tokenManager';
import { handleApiError } from '../services/errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5066';

/** Threshold in seconds before token expiry to trigger proactive refresh */
const PROACTIVE_REFRESH_THRESHOLD = 60;

// Callback for session expiry notification (set by AuthContext)
let onSessionExpired = null;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Set callback for session expiry events
 * @param {Function} callback - Function to call when session expires
 */
export const setSessionExpiredCallback = (callback) => {
  onSessionExpired = callback;
};

/**
 * Subscribe to token refresh completion
 * @param {Function} callback - Function to call with new token
 */
const subscribeToRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers that refresh is complete
 * @param {string} token - New access token
 */
const onRefreshComplete = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Notify all subscribers that refresh failed
 * @param {Error} error - Refresh error
 */
const onRefreshError = (error) => {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
};

/**
 * Perform token refresh request
 * @returns {Promise<string>} New access token
 * @throws {Error} If refresh fails
 */
const performTokenRefresh = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/api/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const { accessToken } = response.data;
  setAccessToken(accessToken);
  return accessToken;
};

/**
 * Create configured Axios instance
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for refresh token
});

/**
 * Auth endpoints that should skip proactive refresh
 */
const AUTH_ENDPOINTS = ['/api/auth/refresh', '/api/auth/login'];

/**
 * Check if URL is an auth endpoint that should skip proactive refresh
 */
const isAuthEndpoint = (url) => {
  if (!url) return false;
  return AUTH_ENDPOINTS.some(
    (endpoint) => url === endpoint || url.endsWith(endpoint)
  );
};

/**
 * Pre-check token and refresh if needed before request
 * Used for proactive refresh and critical operations
 */
export const ensureValidToken = async () => {
  if (!isTokenExpired()) {
    return true;
  }

  // If already refreshing, wait for it
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeToRefresh((token, err) => {
        resolve(!err && !!token);
      });
    });
  }

  isRefreshing = true;

  try {
    const accessToken = await performTokenRefresh();
    onRefreshComplete(accessToken);
    return true;
  } catch {
    clearAccessToken();
    onRefreshError(new Error('Refresh failed'));
    if (onSessionExpired) {
      onSessionExpired();
    }
    return false;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Request interceptor - proactive token refresh and attach Bearer token
 */
client.interceptors.request.use(
  async (config) => {
    // Skip proactive refresh for auth endpoints
    if (isAuthEndpoint(config.url)) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }

    // Proactive refresh if token expires within threshold
    if (getAccessToken() && isTokenExpiringSoon(PROACTIVE_REFRESH_THRESHOLD)) {
      await ensureValidToken();
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle 401, auto-refresh, and centralized error handling
 */
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or login endpoints
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      // If already refreshing, wait for completion
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((token, err) => {
            if (err) {
              reject(err);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = await performTokenRefresh();
        onRefreshComplete(accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed - session expired
        clearAccessToken();
        onRefreshError(refreshError);

        if (onSessionExpired) {
          onSessionExpired();
        }

        if (originalRequest?.handleErrors) {
          const parsed = handleApiError(refreshError);
          refreshError.parsed = parsed;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Centralized error handling for non-401 errors
    // Use handleErrors: true in request config to enable automatic error handling
    // Use handleErrors: false or omit to handle errors manually in component
    if (originalRequest?.handleErrors) {
      const parsed = handleApiError(error);
      // Attach parsed error to the error object for component access
      error.parsed = parsed;
    }

    return Promise.reject(error);
  }
);

export default client;
