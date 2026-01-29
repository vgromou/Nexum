import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock the API module
vi.mock('./api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getMe: vi.fn(),
  setSessionExpiredCallback: vi.fn(),
  clearAccessToken: vi.fn(),
  hasAccessToken: vi.fn(),
}));

// Mock Layout component
vi.mock('./components/Layout/Layout', () => ({
  default: () => <div data-testid="layout">Layout</div>,
}));

// Mock LoginPage component
vi.mock('./pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

// Mock AuthModal component
vi.mock('./components/AuthModal', () => ({
  default: ({ isOpen, mode }) =>
    isOpen ? (
      <div data-testid="auth-modal" data-mode={mode}>
        Auth Modal
      </div>
    ) : null,
}));

import * as api from './api';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    api.refresh.mockRejectedValue(new Error('No session'));
    api.hasAccessToken.mockReturnValue(false);
  });

  describe('routing', () => {
    it('renders login page for unauthenticated users at root', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('renders login page at /login path', async () => {
      window.history.pushState({}, '', '/login');

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('renders layout for authenticated users', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      api.refresh.mockResolvedValue({ accessToken: 'token' });
      api.getMe.mockResolvedValue(mockUser);

      window.history.pushState({}, '', '/');

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('layout')).toBeInTheDocument();
      });
    });

    it('redirects authenticated users from /login to /', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      api.refresh.mockResolvedValue({ accessToken: 'token' });
      api.getMe.mockResolvedValue(mockUser);

      window.history.pushState({}, '', '/login');

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('layout')).toBeInTheDocument();
      });
    });

    it('redirects unauthenticated users from protected routes to /login', async () => {
      window.history.pushState({}, '', '/dashboard');

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while checking auth state', async () => {
      // Make refresh hang to keep loading state
      api.refresh.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<App />);

      expect(container.querySelector('.app-loading__spinner')).toBeInTheDocument();
    });
  });

  describe('session expired modal', () => {
    it('does not show session expired modal initially', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
      });
    });
  });
});
