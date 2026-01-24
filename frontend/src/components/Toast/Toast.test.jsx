import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';
import { ToastProvider, useToast } from './ToastProvider';

// Helper component to test useToast hook
const ToastTrigger = ({ options }) => {
    const { showToast } = useToast();
    return (
        <button onClick={() => showToast(options)} data-testid="trigger">
            Show Toast
        </button>
    );
};

describe('Toast', () => {
    describe('Rendering', () => {
        it('renders with message', () => {
            render(<Toast message="Test message" showProgress={false} />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Test message')).toBeInTheDocument();
        });

        it('renders with default success variant', () => {
            render(<Toast message="Success!" showProgress={false} />);
            expect(screen.getByRole('alert')).toHaveClass('toast', 'toast--success');
        });

        it('renders close button', () => {
            render(<Toast message="Test" showProgress={false} />);
            expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
        });

        it('renders SVG frame with background and colored layers', () => {
            render(<Toast message="Test" showProgress={false} />);
            const frame = screen.getByRole('alert').querySelector('.toast__frame');
            const frameBg = screen.getByRole('alert').querySelector('.toast__frame-bg');
            const frameColor = screen.getByRole('alert').querySelector('.toast__frame-color');
            expect(frame).toBeInTheDocument();
            expect(frameBg).toBeInTheDocument();
            expect(frameColor).toBeInTheDocument();
        });
    });

    describe('Variants', () => {
        it.each([
            ['success', 'toast--success'],
            ['error', 'toast--error'],
            ['warning', 'toast--warning'],
            ['info', 'toast--info'],
        ])('renders %s variant with correct class', (variant, expectedClass) => {
            render(<Toast variant={variant} message="Test" showProgress={false} />);
            expect(screen.getByRole('alert')).toHaveClass(expectedClass);
        });

        it('renders icon for success variant', () => {
            render(<Toast variant="success" message="Success" showProgress={false} />);
            const icon = screen.getByRole('alert').querySelector('.toast__icon');
            expect(icon).toBeInTheDocument();
        });

        it('renders icon for error variant', () => {
            render(<Toast variant="error" message="Error" showProgress={false} />);
            const icon = screen.getByRole('alert').querySelector('.toast__icon');
            expect(icon).toBeInTheDocument();
        });

        it('renders icon for warning variant', () => {
            render(<Toast variant="warning" message="Warning" showProgress={false} />);
            const icon = screen.getByRole('alert').querySelector('.toast__icon');
            expect(icon).toBeInTheDocument();
        });

        it('renders icon for info variant', () => {
            render(<Toast variant="info" message="Info" showProgress={false} />);
            const icon = screen.getByRole('alert').querySelector('.toast__icon');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Icon Sizes', () => {
        it('renders medium icon size by default', () => {
            render(<Toast message="Test" showProgress={false} />);
            const icon = screen.getByRole('alert').querySelector('.toast__icon');
            expect(icon).toHaveClass('toast__icon--md');
        });

        it('renders small icon size when specified', () => {
            render(<Toast message="Test" iconSize="sm" showProgress={false} />);
            const icon = screen.getByRole('alert').querySelector('.toast__icon');
            expect(icon).toHaveClass('toast__icon--sm');
        });
    });

    describe('Close Button', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('calls onClose when close button is clicked', () => {
            const handleClose = vi.fn();
            render(<Toast message="Test" onClose={handleClose} showProgress={false} />);

            fireEvent.click(screen.getByRole('button', { name: /close/i }));
            // Wait for exit animation
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('hides toast when close button is clicked', () => {
            render(<Toast message="Test" showProgress={false} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: /close/i }));
            // Wait for exit animation
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('Auto-dismiss', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('auto-dismisses after duration', () => {
            const handleClose = vi.fn();
            render(<Toast message="Test" duration={5000} onClose={handleClose} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(5000);
            });
            // Wait for exit animation
            act(() => {
                vi.advanceTimersByTime(200);
            });

            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('uses default 10 second duration', () => {
            const handleClose = vi.fn();
            render(<Toast message="Test" onClose={handleClose} />);

            act(() => {
                vi.advanceTimersByTime(9999);
            });
            expect(handleClose).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(1);
            });
            // Wait for exit animation
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('does not auto-dismiss when showProgress is false', () => {
            const handleClose = vi.fn();
            render(<Toast message="Test" showProgress={false} onClose={handleClose} />);

            act(() => {
                vi.advanceTimersByTime(15000);
            });
            expect(handleClose).not.toHaveBeenCalled();
        });
    });

    describe('Pause on Hover', () => {
        it('pauses animation on mouse enter when showProgress is true', () => {
            // We need to render without triggering the timer
            render(<Toast message="Test" duration={5000} paused={false} showProgress={true} />);

            const toast = screen.getByRole('alert');
            fireEvent.mouseEnter(toast);

            expect(toast).toHaveClass('toast--paused');
        });

        it('does not pause when showProgress is false', () => {
            render(<Toast message="Test" duration={5000} paused={false} showProgress={false} />);

            const toast = screen.getByRole('alert');
            fireEvent.mouseEnter(toast);

            expect(toast).not.toHaveClass('toast--paused');
        });

        it('resumes animation on mouse leave', () => {
            render(<Toast message="Test" duration={5000} paused={false} showProgress={true} />);

            const toast = screen.getByRole('alert');
            fireEvent.mouseEnter(toast);
            expect(toast).toHaveClass('toast--paused');

            fireEvent.mouseLeave(toast);
            expect(toast).not.toHaveClass('toast--paused');
        });
    });

    describe('Accessibility', () => {
        it('has alert role', () => {
            render(<Toast message="Test" showProgress={false} />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('has aria-live polite', () => {
            render(<Toast message="Test" showProgress={false} />);
            expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
        });

        it('close button has accessible label', () => {
            render(<Toast message="Test" showProgress={false} />);
            expect(screen.getByRole('button', { name: /close notification/i })).toBeInTheDocument();
        });
    });

    describe('Custom Props', () => {
        it('applies additional className', () => {
            render(<Toast message="Test" className="custom-toast" showProgress={false} />);
            expect(screen.getByRole('alert')).toHaveClass('toast', 'custom-toast');
        });

        it('forwards additional props', () => {
            render(<Toast message="Test" data-testid="custom-toast" showProgress={false} />);
            expect(screen.getByTestId('custom-toast')).toBeInTheDocument();
        });
    });

    describe('CSS Custom Properties', () => {
        it('sets --toast-duration style', () => {
            render(<Toast message="Test" duration={5000} showProgress={false} />);
            const toast = screen.getByRole('alert');
            expect(toast).toHaveStyle({ '--toast-duration': '5000ms' });
        });
    });
});

describe('ToastProvider', () => {
    describe('Rendering', () => {
        it('renders children', () => {
            render(
                <ToastProvider>
                    <div data-testid="child">Child content</div>
                </ToastProvider>
            );
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });

        it('renders toast container', () => {
            render(
                <ToastProvider>
                    <div>Content</div>
                </ToastProvider>
            );
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
        });
    });

    describe('Positions', () => {
        it.each([
            ['top-right', 'toast-container--top-right'],
            ['top-left', 'toast-container--top-left'],
            ['top-center', 'toast-container--top-center'],
            ['bottom-right', 'toast-container--bottom-right'],
            ['bottom-left', 'toast-container--bottom-left'],
            ['bottom-center', 'toast-container--bottom-center'],
        ])('renders %s position with correct class', (position, expectedClass) => {
            render(
                <ToastProvider position={position}>
                    <div>Content</div>
                </ToastProvider>
            );
            expect(screen.getByLabelText('Notifications')).toHaveClass(expectedClass);
        });
    });

    describe('useToast Hook', () => {
        it('throws error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                const TestComponent = () => {
                    useToast();
                    return null;
                };
                render(<TestComponent />);
            }).toThrow('useToast must be used within a ToastProvider');

            consoleError.mockRestore();
        });

        it('shows toast when showToast is called', () => {
            render(
                <ToastProvider>
                    <ToastTrigger options={{ message: 'Test toast', showProgress: false }} />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger'));
            expect(screen.getByText('Test toast')).toBeInTheDocument();
        });

        it('shows toast with specified variant', () => {
            render(
                <ToastProvider>
                    <ToastTrigger options={{ variant: 'error', message: 'Error toast', showProgress: false }} />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger'));
            expect(screen.getByRole('alert')).toHaveClass('toast--error');
        });

        it('removes toast when closed', () => {
            vi.useFakeTimers();
            render(
                <ToastProvider>
                    <ToastTrigger options={{ message: 'Test toast', showProgress: false }} />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger'));
            expect(screen.getByText('Test toast')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /close/i }));
            // Wait for exit animation
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
            vi.useRealTimers();
        });
    });

    describe('Multiple Toasts', () => {
        it('can show multiple toasts', () => {
            render(
                <ToastProvider>
                    <ToastTrigger options={{ message: 'Toast 1', showProgress: false }} />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger'));
            fireEvent.click(screen.getByTestId('trigger'));

            expect(screen.getAllByRole('alert')).toHaveLength(2);
        });

        it('limits toasts to maxToasts', () => {
            render(
                <ToastProvider maxToasts={2}>
                    <ToastTrigger options={{ message: 'Toast', showProgress: false }} />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger'));
            fireEvent.click(screen.getByTestId('trigger'));
            fireEvent.click(screen.getByTestId('trigger'));

            expect(screen.getAllByRole('alert')).toHaveLength(2);
        });

        it('each toast has unique mask ID', () => {
            render(
                <ToastProvider>
                    <ToastTrigger options={{ message: 'Toast', showProgress: false }} />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger'));
            fireEvent.click(screen.getByTestId('trigger'));

            const masks = screen.getByLabelText('Notifications').querySelectorAll('mask');
            const maskIds = Array.from(masks).map(mask => mask.id);
            const uniqueIds = new Set(maskIds);

            expect(uniqueIds.size).toBe(maskIds.length);
        });
    });

    describe('Default Position', () => {
        it('uses bottom-right as default position', () => {
            render(
                <ToastProvider>
                    <div>Content</div>
                </ToastProvider>
            );
            expect(screen.getByLabelText('Notifications')).toHaveClass('toast-container--bottom-right');
        });
    });

    describe('Toast Order', () => {
        it('adds new toasts at the beginning of the stack', () => {
            let toastId = 0;
            const ToastTriggerWithId = () => {
                const { showToast } = useToast();
                return (
                    <button
                        onClick={() => showToast({ message: `Toast ${++toastId}`, showProgress: false })}
                        data-testid="trigger"
                    >
                        Show Toast
                    </button>
                );
            };

            render(
                <ToastProvider>
                    <ToastTriggerWithId />
                </ToastProvider>
            );

            fireEvent.click(screen.getByTestId('trigger')); // Toast 1
            fireEvent.click(screen.getByTestId('trigger')); // Toast 2

            const toasts = screen.getAllByRole('alert');
            // Newest toast (Toast 2) should be first in the DOM
            expect(toasts[0]).toHaveTextContent('Toast 2');
            expect(toasts[1]).toHaveTextContent('Toast 1');
        });
    });
});
