import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ColorPicker from './ColorPicker';
import { ICON_COLORS } from './constants';

describe('ColorPicker', () => {
    const defaultProps = {
        currentColor: 'orange',
        onColorChange: vi.fn(),
        onClose: vi.fn(),
    };

    const colorNames = Object.keys(ICON_COLORS);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render color picker dropdown', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);
            expect(container.querySelector('.color-picker-dropdown')).toBeInTheDocument();
        });

        it('should render color grid', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);
            expect(container.querySelector('.color-picker-grid')).toBeInTheDocument();
        });

        it('should render all color swatches', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);
            const swatches = container.querySelectorAll('.color-picker-swatch');
            expect(swatches.length).toBe(colorNames.length);
        });

        it('should set correct background colors', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const orangeSwatch = container.querySelector(`[title="Orange"]`);
            expect(orangeSwatch).toHaveStyle({ backgroundColor: ICON_COLORS.orange });
        });
    });

    describe('Selection', () => {
        it('should highlight currently selected color', () => {
            const { container } = render(<ColorPicker {...defaultProps} currentColor="blue" />);

            const selectedSwatches = container.querySelectorAll('.color-picker-swatch.selected');
            expect(selectedSwatches.length).toBe(1);
            expect(selectedSwatches[0]).toHaveAttribute('title', 'Blue');
        });

        it('should call onColorChange when color is clicked', () => {
            render(<ColorPicker {...defaultProps} />);

            const redSwatch = screen.getByTitle('Red');
            fireEvent.click(redSwatch);

            expect(defaultProps.onColorChange).toHaveBeenCalledWith('red');
        });

        it('should call onClose when color is clicked', () => {
            render(<ColorPicker {...defaultProps} />);

            const blueSwatch = screen.getByTitle('Blue');
            fireEvent.click(blueSwatch);

            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('should work without onClose prop', () => {
            render(<ColorPicker {...defaultProps} onClose={undefined} />);

            const redSwatch = screen.getByTitle('Red');
            fireEvent.click(redSwatch);

            expect(defaultProps.onColorChange).toHaveBeenCalledWith('red');
        });
    });

    describe('Event propagation', () => {
        it('should stop propagation on click', () => {
            const parentHandler = vi.fn();

            render(
                <div onClick={parentHandler}>
                    <ColorPicker {...defaultProps} />
                </div>
            );

            const dropdown = document.querySelector('.color-picker-dropdown');
            fireEvent.click(dropdown);

            expect(parentHandler).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('should have aria-label on color swatches', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);
            const swatches = container.querySelectorAll('.color-picker-swatch');

            swatches.forEach(swatch => {
                expect(swatch).toHaveAttribute('aria-label');
            });
        });

        it('should have title attributes for tooltips', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);
            const swatches = container.querySelectorAll('.color-picker-swatch');

            swatches.forEach(swatch => {
                expect(swatch).toHaveAttribute('title');
            });
        });
    });

    describe('Color order', () => {
        it('should render colors in order from constants', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);
            const swatches = container.querySelectorAll('.color-picker-swatch');

            swatches.forEach((swatch, index) => {
                const expectedColorName = colorNames[index];
                const expectedTitle = expectedColorName.charAt(0).toUpperCase() + expectedColorName.slice(1);
                expect(swatch).toHaveAttribute('title', expectedTitle);
            });
        });
    });
});
