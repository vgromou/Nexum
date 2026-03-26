/**
 * ProtectedRoute - Wrapper for routes that require authentication
 *
 * Redirects unauthenticated users to login page while preserving the intended URL.
 */

import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';

/**
 * Loading screen displayed while checking auth state
 */
function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="app-loading__spinner" />
    </div>
  );
}

/**
 * ProtectedRoute component
 *
 * @example
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated, preserving intended URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
