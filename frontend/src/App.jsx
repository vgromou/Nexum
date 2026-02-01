import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { ToastProvider } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';
import AuthModal from './components/AuthModal';
import PasswordChangeRequiredModal from './components/PasswordChangeRequiredModal';
import { handleApiError } from './services/errorHandler';
import './App.css';

/**
 * Session expired modal - rendered at app level
 */
function SessionExpiredModal() {
  const { isSessionExpired, reAuthenticate, clearSessionExpired } = useAuth();

  const [reAuthLoading, setReAuthLoading] = useState(false);

  const handleReAuth = useCallback(
    async ({ username, password }) => {
      setReAuthLoading(true);

      try {
        await reAuthenticate(username, password);
        clearSessionExpired();
      } catch (error) {
        handleApiError(error);
      } finally {
        setReAuthLoading(false);
      }
    },
    [reAuthenticate, clearSessionExpired]
  );

  return (
    <AuthModal
      isOpen={isSessionExpired}
      mode="sessionExpired"
      onSubmit={handleReAuth}
      isLoading={reAuthLoading}
    />
  );
}

/**
 * Password change required modal - rendered at app level
 */
function PasswordChangeModal() {
  const { mustChangePassword, onPasswordChanged, logout } = useAuth();

  return (
    <PasswordChangeRequiredModal
      isOpen={mustChangePassword}
      onPasswordChanged={onPasswordChanged}
      onLogout={logout}
    />
  );
}

/**
 * Login page wrapper - redirect to dashboard if already authenticated
 */
function LoginPageWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

/**
 * App routes inside router context
 */
function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Session expired modal - always rendered at app level */}
      <SessionExpiredModal />

      {/* Password change required modal - always rendered at app level */}
      <PasswordChangeModal />
    </>
  );
}

/**
 * Root App component with providers
 */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorProvider>
            <AppRoutes />
          </ErrorProvider>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
