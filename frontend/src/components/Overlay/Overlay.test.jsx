import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Overlay from './Overlay';

describe('Overlay', () => {
    describe('rendering', () => {
        it('renders with default dim variant and active state', () => {
            render(<Overlay data-testid="overlay" />);
            const overlay = screen.getByTestId('overlay');
            expect(overlay).toBeInTheDocument();
            expect(overlay).toHaveClass('overlay', 'overlay--dim', 'overlay--active');
        });

        it('renders with blur variant', () => {
            render(<Overlay variant="blur" data-testid="overlay" />);
            const overlay = screen.getByTestId('overlay');
            expect(overlay).toHaveClass('overlay', 'overlay--blur');
        });

        it('renders children', () => {
            render(
                <Overlay>
                    <div data-testid="child">Modal Content</div>
                </Overlay>
            );
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            render(<Overlay className="custom-class" data-testid="overlay" />);
            const overlay = screen.getByTestId('overlay');
            expect(overlay).toHaveClass('overlay', 'custom-class');
        });

        it('has aria-hidden attribute when no children', () => {
            render(<Overlay data-testid="overlay" />);
            const overlay = screen.getByTestId('overlay');
            expect(overlay).toHaveAttribute('aria-hidden', 'true');
        });

        it('does not have aria-hidden when has children', () => {
            render(
                <Overlay data-testid="overlay">
                    <div>Content</div>
                </Overlay>
            );
            const overlay = screen.getByTestId('overlay');
            expect(overlay).not.toHaveAttribute('aria-hidden');
        });
    });

    describe('interactions', () => {
        it('calls onClick when clicked', () => {
            const handleClick = vi.fn();
            render(<Overlay onClick={handleClick} data-testid="overlay" />);

            fireEvent.click(screen.getByTestId('overlay'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('does not throw when clicked without onClick handler', () => {
            render(<Overlay data-testid="overlay" />);
            expect(() => {
                fireEvent.click(screen.getByTestId('overlay'));
            }).not.toThrow();
        });
    });

    describe('variants', () => {
        it('dim variant has correct class', () => {
            render(<Overlay variant="dim" data-testid="overlay" />);
            expect(screen.getByTestId('overlay')).toHaveClass('overlay--dim');
        });

        it('blur variant has correct class', () => {
            render(<Overlay variant="blur" data-testid="overlay" />);
            expect(screen.getByTestId('overlay')).toHaveClass('overlay--blur');
        });
    });

    describe('animation state', () => {
        it('has active class by default', () => {
            render(<Overlay data-testid="overlay" />);
            expect(screen.getByTestId('overlay')).toHaveClass('overlay--active');
        });

        it('has active class when isActive is true', () => {
            render(<Overlay isActive={true} data-testid="overlay" />);
            expect(screen.getByTestId('overlay')).toHaveClass('overlay--active');
        });

        it('does not have active class when isActive is false', () => {
            render(<Overlay isActive={false} data-testid="overlay" />);
            expect(screen.getByTestId('overlay')).not.toHaveClass('overlay--active');
        });
    });

    describe('props spreading', () => {
        it('spreads additional props', () => {
            render(<Overlay data-testid="overlay" data-custom="value" />);
            const overlay = screen.getByTestId('overlay');
            expect(overlay).toHaveAttribute('data-custom', 'value');
        });
    });
});
