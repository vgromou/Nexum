/**
 * Auth API - Authentication endpoint functions
 */

import client from './client';
import { setAccessToken, clearAccessToken } from './tokenManager';

/**
 * Login with email/username and password
 * @param {string} login - Email or username
 * @param {string} password - User password
 * @returns {Promise<{user: object, mustChangePassword: boolean}>}
 */
export const login = async (login, password) => {
  const response = await client.post('/api/auth/login', {
    login,
    password,
  });

  const { accessToken, user, mustChangePassword } = response.data;
  setAccessToken(accessToken);

  return { user, mustChangePassword };
};

/**
 * Logout - revoke refresh token
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await client.post('/api/auth/logout', {});
  } catch {
    // Ignore errors - clear state anyway
  } finally {
    clearAccessToken();
  }
};

/**
 * Refresh access token using refresh token cookie
 * @returns {Promise<{accessToken: string}>}
 */
export const refresh = async () => {
  const response = await client.post('/api/auth/refresh', {});
  const { accessToken } = response.data;
  setAccessToken(accessToken);
  return { accessToken };
};

/**
 * Get current user profile
 * @returns {Promise<object>} User profile data
 */
export const getMe = async () => {
  const response = await client.get('/api/me');
  return response.data;
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Response object
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await client.post('/api/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response;
};

export default {
  login,
  logout,
  refresh,
  getMe,
  changePassword,
};
