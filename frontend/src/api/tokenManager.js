/**
 * Token Manager - JWT access token storage in memory
 *
 * Security: Access tokens are stored in memory (not localStorage) to prevent XSS attacks.
 * Refresh tokens are handled via HTTP-only cookies by the backend.
 */

let accessToken = null;

/**
 * Get current access token
 * @returns {string|null} The access token or null if not set
 */
export const getAccessToken = () => accessToken;

/**
 * Set access token in memory
 * @param {string} token - JWT access token
 */
export const setAccessToken = (token) => {
  accessToken = token;
};

/**
 * Clear access token from memory
 */
export const clearAccessToken = () => {
  accessToken = null;
};

/**
 * Check if access token exists
 * @returns {boolean} True if token exists
 */
export const hasAccessToken = () => accessToken !== null;

/**
 * Parse JWT token payload without verification
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const parseToken = (token) => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Check if access token is expired
 * @returns {boolean} True if token is expired or doesn't exist
 */
export const isTokenExpired = () => {
  const token = getAccessToken();
  if (!token) return true;

  const payload = parseToken(token);
  if (!payload || !payload.exp) return true;

  // Add 10 second buffer before expiration
  const expiresAt = payload.exp * 1000;
  return Date.now() >= expiresAt - 10000;
};

/**
 * Get time until token expiration in milliseconds
 * @returns {number} Milliseconds until expiration, 0 if expired or no token
 */
export const getTokenExpiresIn = () => {
  const token = getAccessToken();
  if (!token) return 0;

  const payload = parseToken(token);
  if (!payload || !payload.exp) return 0;

  const expiresAt = payload.exp * 1000;
  const remaining = expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
};
