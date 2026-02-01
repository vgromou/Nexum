import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../../components/AuthModal';
import { handleApiError } from '../../services/errorHandler';
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
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = useCallback(
    async ({ username, password }) => {
      setFieldErrors({});
      setIsLoading(true);

      try {
        await login(username, password);
      } catch (error) {
        const parsed = handleApiError(error);
        if (parsed.fieldErrors) {
          setFieldErrors(parsed.fieldErrors);
        } else if (parsed.displayType === 'field') {
          // Field error without specific field - show on password field
          setFieldErrors({ password: parsed.message });
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
        usernameError={fieldErrors.login}
        passwordError={fieldErrors.password}
      />
    </div>
  );
};

export default LoginPage;
