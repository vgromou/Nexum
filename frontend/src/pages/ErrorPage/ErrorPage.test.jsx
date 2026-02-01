import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import ErrorPage from './ErrorPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

describe('ErrorPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  const renderErrorPage = (state = {}) => {
    vi.mocked(useLocation).mockReturnValue({ state, pathname: '/error' });
    return render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>
    );
  };

  it('renders default error message when no state provided', () => {
    renderErrorPage();

    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
    expect(
      screen.getByText('Что-то пошло не так. Попробуйте позже.')
    ).toBeInTheDocument();
  });

  it('renders custom error message from state', () => {
    renderErrorPage({
      code: 'SERVER_ERROR',
      message: 'Custom error message',
    });

    expect(screen.getByText('Ошибка сервера')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders FORBIDDEN error correctly', () => {
    renderErrorPage({
      code: 'FORBIDDEN',
      message: 'You do not have access',
    });

    expect(screen.getByText('Доступ запрещён')).toBeInTheDocument();
  });

  it('renders NOT_FOUND error correctly', () => {
    renderErrorPage({
      code: 'NOT_FOUND',
      message: 'Page not found',
    });

    expect(screen.getByText('Страница не найдена')).toBeInTheDocument();
  });

  it('renders traceId when provided', () => {
    renderErrorPage({
      code: 'SERVER_ERROR',
      message: 'Error',
      traceId: 'abc-123-xyz',
    });

    expect(screen.getByText('Код ошибки:')).toBeInTheDocument();
    expect(screen.getByText('abc-123-xyz')).toBeInTheDocument();
  });

  it('does not render traceId when not provided', () => {
    renderErrorPage({
      code: 'SERVER_ERROR',
      message: 'Error',
    });

    expect(screen.queryByText('Код ошибки:')).not.toBeInTheDocument();
  });

  it('navigates to home when "На главную" clicked', () => {
    renderErrorPage();

    fireEvent.click(screen.getByText('На главную'));

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('navigates back when "Назад" clicked', () => {
    renderErrorPage();

    fireEvent.click(screen.getByText('Назад'));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
