/**
 * HTTP Client - Axios instance with auth interceptors
 *
 * Features:
 * - Automatic Bearer token attachment
 * - Automatic token refresh on 401
 * - Session expiry callback for UI notification
 */

import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isTokenExpired,
} from './tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5066';

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
 * Request interceptor - attach Bearer token
 */
client.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle 401 and auto-refresh
 */
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if not 401 or already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry refresh or login endpoints (exact path match)
    const url = originalRequest.url || '';
    if (
      url === '/api/auth/refresh' ||
      url === '/api/auth/login' ||
      url.endsWith('/auth/refresh') ||
      url.endsWith('/auth/login')
    ) {
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
      // Try to refresh token
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = response.data;
      setAccessToken(accessToken);
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

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Pre-check token and refresh if needed before request
 * Used for critical operations that shouldn't fail
 */
export const ensureValidToken = async () => {
  if (!isTokenExpired()) {
    return true;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const { accessToken } = response.data;
    setAccessToken(accessToken);
    return true;
  } catch {
    clearAccessToken();
    if (onSessionExpired) {
      onSessionExpired();
    }
    return false;
  }
};

export default client;
