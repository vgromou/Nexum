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
        const responseData = error.response?.data;

        // Handle ASP.NET validation errors (400 Bad Request)
        if (responseData?.errors) {
          const validationErrors = responseData.errors;
          setErrors({
            username: validationErrors.Login?.[0] || '',
            password: validationErrors.Password?.[0] || '',
            general: '',
          });
          return;
        }

        // Handle our custom API errors
        const errorData = responseData?.error;
        const message = errorData?.message;
        const displayType = errorData?.displayType;

        if (displayType === 'field') {
          // Show error under form fields
          setErrors({
            username: ' ',
            password: message || 'Invalid username or password',
            general: '',
          });
        } else {
          // Default: show as general error (page/toast/inline)
          setErrors((prev) => ({ ...prev, general: message || 'Login failed' }));
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
