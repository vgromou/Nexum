import { useState, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import AuthModal from './components/AuthModal';
import './App.css';

/**
 * Loading screen while checking auth state
 */
function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="app-loading__spinner" />
    </div>
  );
}

/**
 * Main app content with auth routing
 */
function AppContent() {
  const {
    isAuthenticated,
    isSessionExpired,
    isLoading,
    reAuthenticate,
    clearSessionExpired,
  } = useAuth();

  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState('');

  const handleReAuth = useCallback(
    async ({ username, password }) => {
      setReAuthLoading(true);
      setReAuthError('');

      try {
        await reAuthenticate(username, password);
        clearSessionExpired();
      } catch (error) {
        const message =
          error.response?.data?.message || 'Invalid login or password';
        setReAuthError(message);
      } finally {
        setReAuthLoading(false);
      }
    },
    [reAuthenticate, clearSessionExpired]
  );

  // Show loading while checking initial auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Main content */}
      {isAuthenticated ? <Layout /> : <LoginPage />}

      {/* Session expired modal - always rendered at app level */}
      <AuthModal
        isOpen={isSessionExpired}
        mode="sessionExpired"
        onSubmit={handleReAuth}
        isLoading={reAuthLoading}
        generalError={reAuthError}
      />
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
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
