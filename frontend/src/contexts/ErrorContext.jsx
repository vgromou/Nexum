/**
 * Error Context
 *
 * Provides error handling capabilities throughout the app.
 * Connects error handler service to Toast and Router.
 */

import { createContext, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  setErrorHandlerRefs,
  getErrorHandlerRefs,
  handleApiError,
  parseError,
} from '../services/errorHandler';

const ErrorContext = createContext(null);

/**
 * Error Provider Component
 *
 * Must be placed inside BrowserRouter and ToastProvider.
 * Connects error handler to toast notifications and router navigation.
 *
 * @example
 * <ToastProvider>
 *   <BrowserRouter>
 *     <ErrorProvider>
 *       <Routes>...</Routes>
 *     </ErrorProvider>
 *   </BrowserRouter>
 * </ToastProvider>
 */
export const ErrorProvider = ({ children }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Set refs for error handler service
  useEffect(() => {
    setErrorHandlerRefs({ showToast, navigate });

    // Cleanup on unmount - only clear if refs still belong to this provider
    return () => {
      const currentRefs = getErrorHandlerRefs();
      if (currentRefs.showToast === showToast && currentRefs.navigate === navigate) {
        setErrorHandlerRefs({ showToast: null, navigate: null });
      }
    };
  }, [showToast, navigate]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      handleError: handleApiError,
      parseError,
      showToast,
      navigate,
    }),
    [showToast, navigate]
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access error handling utilities
 *
 * @returns {{
 *   handleError: (error: Error, options?: object) => object,
 *   parseError: (error: Error) => object,
 *   showToast: Function,
 *   navigate: Function
 * }}
 *
 * @example
 * const { handleError } = useError();
 *
 * try {
 *   await api.saveData(data);
 * } catch (error) {
 *   const parsed = handleError(error);
 *   if (parsed.fieldErrors) {
 *     setErrors(parsed.fieldErrors);
 *   }
 * }
 */
export const useError = () => {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }

  return context;
};

export default ErrorProvider;
