import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../../components/AuthModal';
import './LoginPage.css';

/**
 * LoginPage Component
 *
 * A full-page login screen with the AuthModal centered on a secondary background.
 * Uses AuthContext for authentication.
 */
const LoginPage = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: '',
  });

  const handleSubmit = useCallback(
    async ({ username, password }) => {
      setErrors({ username: '', password: '', general: '' });
      setIsLoading(true);

      try {
        await login(username, password);
      } catch (error) {
        const errorCode = error.response?.data?.errorCode;
        const message =
          error.response?.data?.message || 'Login failed. Please try again.';

        // Handle specific error codes
        if (errorCode === 'VALIDATION_ERROR') {
          // Check if it's a specific field error
          const details = error.response?.data?.details;
          if (details?.login) {
            setErrors((prev) => ({ ...prev, username: details.login }));
          } else if (details?.password) {
            setErrors((prev) => ({ ...prev, password: details.password }));
          } else {
            setErrors((prev) => ({ ...prev, general: message }));
          }
        } else if (
          errorCode === 'INVALID_CREDENTIALS' ||
          errorCode === 'ACCOUNT_DEACTIVATED' ||
          errorCode === 'ACCOUNT_LOCKED'
        ) {
          setErrors((prev) => ({ ...prev, general: message }));
        } else {
          setErrors((prev) => ({ ...prev, general: message }));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  return (
    <div className="login-page">
      <AuthModal
        isOpen={true}
        mode="login"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        usernameError={errors.username}
        passwordError={errors.password}
        generalError={errors.general}
      />
    </div>
  );
};

export default LoginPage;
