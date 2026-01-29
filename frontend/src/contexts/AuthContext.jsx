/**
 * AuthContext - Global authentication state management
 */

import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  login as apiLogin,
  logout as apiLogout,
  refresh as apiRefresh,
  getMe,
  setSessionExpiredCallback,
  clearAccessToken,
  hasAccessToken,
} from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  /**
   * Handle session expiry - show modal instead of redirecting
   */
  const handleSessionExpired = useCallback(() => {
    setIsSessionExpired(true);
    setIsAuthenticated(false);
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    setSessionExpiredCallback(handleSessionExpired);

    const initAuth = async () => {
      try {
        // Try to refresh token to restore session
        await apiRefresh();
        const userData = await getMe();
        setUser(userData);
        setIsAuthenticated(true);
        setMustChangePassword(userData.mustChangePassword || false);
      } catch {
        // No valid session
        clearAccessToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [handleSessionExpired]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (loginValue, password) => {
    const result = await apiLogin(loginValue, password);
    setUser(result.user);
    setIsAuthenticated(true);
    setIsSessionExpired(false);
    setMustChangePassword(result.mustChangePassword || false);
    return result;
  }, []);

  /**
   * Logout and clear state
   */
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    setMustChangePassword(false);
  }, []);

  /**
   * Re-authenticate after session expiry (from modal)
   */
  const reAuthenticate = useCallback(async (loginValue, password) => {
    const result = await apiLogin(loginValue, password);
    setUser(result.user);
    setIsAuthenticated(true);
    setIsSessionExpired(false);
    setMustChangePassword(result.mustChangePassword || false);
    return result;
  }, []);

  /**
   * Clear session expired state (after successful re-auth)
   */
  const clearSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  /**
   * Update user data (after profile edit)
   */
  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      setMustChangePassword(userData.mustChangePassword || false);
      return userData;
    } catch {
      return null;
    }
  }, []);

  /**
   * Mark password as changed
   */
  const onPasswordChanged = useCallback(() => {
    setMustChangePassword(false);
    setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isSessionExpired,
      isLoading,
      mustChangePassword,
      login,
      logout,
      reAuthenticate,
      clearSessionExpired,
      updateUser,
      refreshUser,
      onPasswordChanged,
    }),
    [
      user,
      isAuthenticated,
      isSessionExpired,
      isLoading,
      mustChangePassword,
      login,
      logout,
      reAuthenticate,
      clearSessionExpired,
      updateUser,
      refreshUser,
      onPasswordChanged,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
