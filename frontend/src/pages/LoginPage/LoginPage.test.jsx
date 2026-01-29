import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';
import { AuthContext } from '../../contexts/AuthContext';

// Mock AuthContext provider wrapper
const createWrapper = (contextValue) => {
  return ({ children }) => (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const defaultContext = {
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    isSessionExpired: false,
    mustChangePassword: false,
    logout: vi.fn(),
    reAuthenticate: vi.fn(),
    clearSessionExpired: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
    onPasswordChanged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders login page container', () => {
      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });
      expect(document.querySelector('.login-page')).toBeInTheDocument();
    });

    it('renders AuthModal with isOpen true', () => {
      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders in login mode', () => {
      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });
      expect(screen.getByText('Sign into your account')).toBeInTheDocument();
    });

    it('renders username and password fields', () => {
      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });
      expect(screen.getByText(/username or email/i)).toBeInTheDocument();
      expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls login with credentials on form submit', async () => {
      mockLogin.mockResolvedValue({ user: {}, mustChangePassword: false });

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it('shows loading state during login', async () => {
      // Make login hang
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('displays general error for INVALID_CREDENTIALS', async () => {
      const error = new Error('Invalid credentials');
      error.response = {
        data: {
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid login or password',
        },
      };
      mockLogin.mockRejectedValue(error);

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid login or password')).toBeInTheDocument();
      });
    });

    it('displays general error for ACCOUNT_DEACTIVATED', async () => {
      const error = new Error('Account deactivated');
      error.response = {
        data: {
          errorCode: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated',
        },
      };
      mockLogin.mockRejectedValue(error);

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'pass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Your account has been deactivated')).toBeInTheDocument();
      });
    });

    it('displays general error for ACCOUNT_LOCKED', async () => {
      const error = new Error('Account locked');
      error.response = {
        data: {
          errorCode: 'ACCOUNT_LOCKED',
          message: 'Account is locked. Try again in 12 minutes',
        },
      };
      mockLogin.mockRejectedValue(error);

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'pass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Account is locked. Try again in 12 minutes')
        ).toBeInTheDocument();
      });
    });

    it('displays field error for VALIDATION_ERROR with login details', async () => {
      const error = new Error('Validation error');
      error.response = {
        data: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Login is required',
          details: { login: 'Login is required' },
        },
      };
      mockLogin.mockRejectedValue(error);

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login is required')).toBeInTheDocument();
      });
    });

    it('displays default error message when no message provided', async () => {
      const error = new Error('Network error');
      mockLogin.mockRejectedValue(error);

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'pass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('clears errors on new submission', async () => {
      const error = new Error('Invalid credentials');
      error.response = {
        data: {
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid login or password',
        },
      };
      mockLogin
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ user: {}, mustChangePassword: false });

      render(<LoginPage />, { wrapper: createWrapper(defaultContext) });

      const inputs = screen.getAllByPlaceholderText(/paste or type/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submit - should show error
      fireEvent.change(inputs[0], { target: { value: 'testuser' } });
      fireEvent.change(inputs[1], { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid login or password')).toBeInTheDocument();
      });

      // Second submit - error should be cleared
      fireEvent.change(inputs[1], { target: { value: 'correct' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Invalid login or password')).not.toBeInTheDocument();
      });
    });
  });
});
