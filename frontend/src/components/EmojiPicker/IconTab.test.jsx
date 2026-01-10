import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IconTab from './IconTab';
import { ICON_COLORS } from './constants';

describe('IconTab', () => {
    const defaultProps = {
        searchQuery: '',
        onSelect: vi.fn(),
        currentIcon: null,
        iconColor: 'orange',
        onColorChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render icon grid container', () => {
            const { container } = render(<IconTab {...defaultProps} />);
            expect(container.querySelector('.emoji-grid-container')).toBeInTheDocument();
        });

        it('should render "Icons" header', () => {
            render(<IconTab {...defaultProps} />);
            expect(screen.getByText('Icons')).toBeInTheDocument();
        });

        it('should render icon buttons', () => {
            const { container } = render(<IconTab {...defaultProps} />);
            const iconButtons = container.querySelectorAll('.icon-item');
            expect(iconButtons.length).toBeGreaterThan(0);
        });

        it('should render color bar at bottom', () => {
            const { container } = render(<IconTab {...defaultProps} />);
            expect(container.querySelector('.icon-color-bar')).toBeInTheDocument();
        });

        it('should render all 10 color swatches', () => {
            const { container } = render(<IconTab {...defaultProps} />);
            const swatches = container.querySelectorAll('.icon-color-swatch');
            expect(swatches.length).toBe(10);
        });
    });

    describe('Search filtering', () => {
        it('should filter icons based on search query', () => {
            const { container, rerender } = render(<IconTab {...defaultProps} />);
            const initialCount = container.querySelectorAll('.icon-item').length;

            rerender(<IconTab {...defaultProps} searchQuery="heart" />);
            const filteredCount = container.querySelectorAll('.icon-item').length;

            expect(filteredCount).toBeLessThan(initialCount);
        });

        it('should show "No icons found" when no matches', () => {
            render(<IconTab {...defaultProps} searchQuery="xyznonexistent123" />);
            expect(screen.getByText('No icons found')).toBeInTheDocument();
        });

        it('should search by icon keywords', () => {
            const { container } = render(<IconTab {...defaultProps} searchQuery="love" />);
            const iconButtons = container.querySelectorAll('.icon-item');
            // "love" is typically a keyword for heart icon
            expect(iconButtons.length).toBeGreaterThan(0);
        });
    });

    describe('Selection', () => {
        it('should call onSelect with icon data when clicked', () => {
            const { container } = render(<IconTab {...defaultProps} />);

            const iconButtons = container.querySelectorAll('.icon-item');
            if (iconButtons.length > 0) {
                fireEvent.click(iconButtons[0]);

                expect(defaultProps.onSelect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'icon',
                        value: expect.any(String),
                        color: expect.any(String),
                    })
                );
            }
        });

        it('should include correct color in selection', () => {
            const { container } = render(<IconTab {...defaultProps} iconColor="blue" />);

            const iconButtons = container.querySelectorAll('.icon-item');
            if (iconButtons.length > 0) {
                fireEvent.click(iconButtons[0]);

                expect(defaultProps.onSelect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        color: ICON_COLORS.blue,
                    })
                );
            }
        });

        it('should highlight currently selected icon', () => {
            const { container } = render(<IconTab {...defaultProps} currentIcon="heart" />);

            const selectedItems = container.querySelectorAll('.icon-item.selected');
            expect(selectedItems.length).toBe(1);
        });
    });

    describe('Color handling', () => {
        it('should use orange color by default', () => {
            const { container } = render(<IconTab {...defaultProps} iconColor="orange" />);
            const iconButtons = container.querySelectorAll('.icon-item');

            if (iconButtons.length > 0) {
                fireEvent.click(iconButtons[0]);

                expect(defaultProps.onSelect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        color: ICON_COLORS.orange,
                    })
                );
            }
        });

        it('should use specified color from props', () => {
            const { container } = render(<IconTab {...defaultProps} iconColor="purple" />);
            const iconButtons = container.querySelectorAll('.icon-item');

            if (iconButtons.length > 0) {
                fireEvent.click(iconButtons[0]);

                expect(defaultProps.onSelect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        color: ICON_COLORS.purple,
                    })
                );
            }
        });

        it('should fallback to default for unknown color', () => {
            const { container } = render(<IconTab {...defaultProps} iconColor="unknowncolor" />);
            const iconButtons = container.querySelectorAll('.icon-item');

            if (iconButtons.length > 0) {
                fireEvent.click(iconButtons[0]);

                expect(defaultProps.onSelect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        color: ICON_COLORS.default,
                    })
                );
            }
        });

        it('should call onColorChange when swatch is clicked', () => {
            const { container } = render(<IconTab {...defaultProps} />);
            const swatches = container.querySelectorAll('.icon-color-swatch');

            if (swatches.length > 0) {
                fireEvent.click(swatches[1]); // Click second swatch (gray)

                expect(defaultProps.onColorChange).toHaveBeenCalled();
            }
        });

        it('should mark active color swatch', () => {
            const { container } = render(<IconTab {...defaultProps} iconColor="orange" />);
            const activeSwatches = container.querySelectorAll('.icon-color-swatch.active');

            expect(activeSwatches.length).toBe(1);
        });
    });

    describe('Icon title attributes', () => {
        it('should set title attribute with icon name', () => {
            const { container } = render(<IconTab {...defaultProps} />);
            const iconButtons = container.querySelectorAll('.icon-item');

            if (iconButtons.length > 0) {
                expect(iconButtons[0]).toHaveAttribute('title');
            }
        });
    });
});
