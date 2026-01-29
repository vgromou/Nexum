import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, AuthContext } from './AuthContext';

// Mock the API module
vi.mock('../api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getMe: vi.fn(),
  setSessionExpiredCallback: vi.fn(),
  clearAccessToken: vi.fn(),
  hasAccessToken: vi.fn(),
}));

import * as api from '../api';

// Test component to access context
const TestConsumer = ({ onContextValue }) => {
  const context = React.useContext(AuthContext);
  React.useEffect(() => {
    onContextValue(context);
  }, [context, onContextValue]);
  return (
    <div>
      <span data-testid="loading">{String(context.isLoading)}</span>
      <span data-testid="authenticated">{String(context.isAuthenticated)}</span>
      <span data-testid="sessionExpired">{String(context.isSessionExpired)}</span>
      <span data-testid="user">{context.user ? context.user.email : 'null'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    api.refresh.mockRejectedValue(new Error('No session'));
    api.hasAccessToken.mockReturnValue(false);
  });

  describe('initialization', () => {
    it('shows loading state initially', async () => {
      // Make refresh hang to keep loading state
      api.refresh.mockImplementation(() => new Promise(() => {}));

      render(
        <AuthProvider>
          <TestConsumer onContextValue={() => {}} />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('sets isLoading to false after initialization', async () => {
      api.refresh.mockRejectedValue(new Error('No session'));

      render(
        <AuthProvider>
          <TestConsumer onContextValue={() => {}} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('restores session from refresh token on mount', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      api.refresh.mockResolvedValue({ accessToken: 'token' });
      api.getMe.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestConsumer onContextValue={() => {}} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });
    });

    it('sets isAuthenticated to false when no session', async () => {
      api.refresh.mockRejectedValue(new Error('No session'));

      render(
        <AuthProvider>
          <TestConsumer onContextValue={() => {}} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('sets session expired callback', async () => {
      api.refresh.mockRejectedValue(new Error('No session'));

      render(
        <AuthProvider>
          <TestConsumer onContextValue={() => {}} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(api.setSessionExpiredCallback).toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    it('calls API login and updates state', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      api.refresh.mockRejectedValue(new Error('No session'));
      api.login.mockResolvedValue({ user: mockUser, mustChangePassword: false });

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await contextValue.login('test@example.com', 'password');
      });

      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password');
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });

    it('clears session expired state after login', async () => {
      api.refresh.mockRejectedValue(new Error('No session'));
      api.login.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
        mustChangePassword: false,
      });

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await contextValue.login('test@example.com', 'password');
      });

      expect(screen.getByTestId('sessionExpired').textContent).toBe('false');
    });
  });

  describe('logout', () => {
    it('calls API logout and clears state', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      api.refresh.mockResolvedValue({ accessToken: 'token' });
      api.getMe.mockResolvedValue(mockUser);
      api.logout.mockResolvedValue(undefined);

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await act(async () => {
        await contextValue.logout();
      });

      expect(api.logout).toHaveBeenCalled();
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('reAuthenticate', () => {
    it('calls login and clears session expired state', async () => {
      api.refresh.mockRejectedValue(new Error('No session'));
      api.login.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
        mustChangePassword: false,
      });

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await contextValue.reAuthenticate('test@example.com', 'password');
      });

      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('sessionExpired').textContent).toBe('false');
    });
  });

  describe('updateUser', () => {
    it('updates user data', async () => {
      const mockUser = { id: '123', email: 'test@example.com', firstName: 'John' };
      api.refresh.mockResolvedValue({ accessToken: 'token' });
      api.getMe.mockResolvedValue(mockUser);

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      act(() => {
        contextValue.updateUser({ firstName: 'Jane' });
      });

      expect(contextValue.user.firstName).toBe('Jane');
      // Original fields preserved
      expect(contextValue.user.email).toBe('test@example.com');
    });
  });

  describe('refreshUser', () => {
    it('fetches fresh user data from server', async () => {
      const mockUser = { id: '123', email: 'old@example.com' };
      const updatedUser = { id: '123', email: 'new@example.com' };
      api.refresh.mockResolvedValue({ accessToken: 'token' });
      api.getMe
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('old@example.com');
      });

      await act(async () => {
        await contextValue.refreshUser();
      });

      expect(screen.getByTestId('user').textContent).toBe('new@example.com');
    });
  });

  describe('context value', () => {
    it('provides all expected properties and methods', async () => {
      api.refresh.mockRejectedValue(new Error('No session'));

      let contextValue;
      render(
        <AuthProvider>
          <TestConsumer onContextValue={(ctx) => (contextValue = ctx)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Check all properties exist
      expect(contextValue).toHaveProperty('user');
      expect(contextValue).toHaveProperty('isAuthenticated');
      expect(contextValue).toHaveProperty('isSessionExpired');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('mustChangePassword');

      // Check all methods exist
      expect(typeof contextValue.login).toBe('function');
      expect(typeof contextValue.logout).toBe('function');
      expect(typeof contextValue.reAuthenticate).toBe('function');
      expect(typeof contextValue.clearSessionExpired).toBe('function');
      expect(typeof contextValue.updateUser).toBe('function');
      expect(typeof contextValue.refreshUser).toBe('function');
      expect(typeof contextValue.onPasswordChanged).toBe('function');
    });
  });
});
