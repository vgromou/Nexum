import { useLocation, useNavigate } from 'react-router-dom';
import './ErrorPage.css';

/**
 * Error codes to user-friendly titles
 */
const ERROR_TITLES = {
  FORBIDDEN: 'Доступ запрещён',
  NOT_FOUND: 'Страница не найдена',
  SERVER_ERROR: 'Ошибка сервера',
  CRITICAL_ERROR: 'Критическая ошибка',
};

/**
 * ErrorPage Component
 *
 * Full-page error display for critical errors.
 * Receives error details via router state from errorHandler.
 */
const ErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { code, message, traceId } = location.state || {};

  const title = ERROR_TITLES[code] || 'Произошла ошибка';
  const displayMessage = message || 'Что-то пошло не так. Попробуйте позже.';

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="error-page">
      <div className="error-page__content">
        <div className="error-page__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="error-page__title">{title}</h1>
        <p className="error-page__message">{displayMessage}</p>

        {traceId && (
          <p className="error-page__trace">
            Код ошибки: <code>{traceId}</code>
          </p>
        )}

        <div className="error-page__actions">
          <button
            type="button"
            className="error-page__button error-page__button--primary"
            onClick={handleGoHome}
          >
            На главную
          </button>
          <button
            type="button"
            className="error-page__button error-page__button--secondary"
            onClick={handleGoBack}
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
