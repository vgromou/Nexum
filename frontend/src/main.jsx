import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.jsx';

// Initialize Sentry if DSN is configured
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance monitoring sample rate
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session replay sample rate
    replaysSessionSampleRate: 0.1,
    // Error replay sample rate (capture replay on errors)
    replaysOnErrorSampleRate: 1.0,
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
      }
      return event;
    },
  });

  // Expose Sentry globally for error handler integration
  window.Sentry = Sentry;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
