import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from './useAuth';
import { AuthContext } from '../contexts/AuthContext';

describe('useAuth', () => {
  const mockContextValue = {
    user: { id: '123', email: 'test@example.com' },
    isAuthenticated: true,
    isSessionExpired: false,
    isLoading: false,
    mustChangePassword: false,
    login: vi.fn(),
    logout: vi.fn(),
    reAuthenticate: vi.fn(),
    clearSessionExpired: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
    onPasswordChanged: vi.fn(),
  };

  const wrapper = ({ children }) => (
    <AuthContext.Provider value={mockContextValue}>
      {children}
    </AuthContext.Provider>
  );

  it('returns context value when used within AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockContextValue);
  });

  it('returns user from context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({ id: '123', email: 'test@example.com' });
  });

  it('returns isAuthenticated from context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns login function from context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.login).toBe(mockContextValue.login);
  });

  it('returns logout function from context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.logout).toBe(mockContextValue.logout);
  });

  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  describe('with different context states', () => {
    it('handles loading state', () => {
      const loadingContext = { ...mockContextValue, isLoading: true };
      const loadingWrapper = ({ children }) => (
        <AuthContext.Provider value={loadingContext}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper: loadingWrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('handles unauthenticated state', () => {
      const unauthContext = {
        ...mockContextValue,
        isAuthenticated: false,
        user: null,
      };
      const unauthWrapper = ({ children }) => (
        <AuthContext.Provider value={unauthContext}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper: unauthWrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('handles session expired state', () => {
      const expiredContext = { ...mockContextValue, isSessionExpired: true };
      const expiredWrapper = ({ children }) => (
        <AuthContext.Provider value={expiredContext}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper: expiredWrapper });

      expect(result.current.isSessionExpired).toBe(true);
    });

    it('handles mustChangePassword state', () => {
      const passwordContext = { ...mockContextValue, mustChangePassword: true };
      const passwordWrapper = ({ children }) => (
        <AuthContext.Provider value={passwordContext}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper: passwordWrapper });

      expect(result.current.mustChangePassword).toBe(true);
    });
  });
});
