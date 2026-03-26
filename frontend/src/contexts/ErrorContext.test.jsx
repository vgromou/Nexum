import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import { ErrorProvider, useError } from './ErrorContext';
import { getErrorHandlerRefs } from '../services/errorHandler';

// Test component that uses useError hook
function TestComponent() {
  const { handleError, parseError, showToast, navigate } = useError();

  return (
    <div>
      <span data-testid="has-handleError">{String(!!handleError)}</span>
      <span data-testid="has-parseError">{String(!!parseError)}</span>
      <span data-testid="has-showToast">{String(!!showToast)}</span>
      <span data-testid="has-navigate">{String(!!navigate)}</span>
    </div>
  );
}

// Wrapper with all required providers
function TestWrapper({ children }) {
  return (
    <ToastProvider>
      <MemoryRouter>
        <ErrorProvider>{children}</ErrorProvider>
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('ErrorContext', () => {
  describe('ErrorProvider', () => {
    it('provides error handling utilities', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-handleError').textContent).toBe('true');
      expect(screen.getByTestId('has-parseError').textContent).toBe('true');
      expect(screen.getByTestId('has-showToast').textContent).toBe('true');
      expect(screen.getByTestId('has-navigate').textContent).toBe('true');
    });

    it('sets error handler refs on mount', () => {
      render(
        <TestWrapper>
          <div>Test</div>
        </TestWrapper>
      );

      const refs = getErrorHandlerRefs();
      expect(refs.showToast).toBeDefined();
      expect(refs.navigate).toBeDefined();
    });
  });

  describe('useError', () => {
    it('throws error when used outside ErrorProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useError must be used within an ErrorProvider');

      consoleSpy.mockRestore();
    });
  });
});
