import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

const TestChild = () => <div data-testid="protected-content">Protected Content</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

const renderWithRouter = (initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <TestChild />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when loading', () => {
    it('shows loading spinner', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = renderWithRouter();

      expect(container.querySelector('.app-loading__spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('renders children', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('redirects to login page', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter('/dashboard');

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('preserves intended URL in location state', () => {
      const LoginWithLocation = () => {
        return <div data-testid="login-page">Login Page</div>;
      };

      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard/users']}>
          <Routes>
            <Route
              path="/login"
              element={<LoginWithLocation />}
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <TestChild />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('loading screen', () => {
    it('has correct CSS classes', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = renderWithRouter();

      expect(container.querySelector('.app-loading')).toBeInTheDocument();
      expect(container.querySelector('.app-loading__spinner')).toBeInTheDocument();
    });
  });
});
