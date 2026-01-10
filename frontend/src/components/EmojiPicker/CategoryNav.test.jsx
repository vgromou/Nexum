import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CategoryNav from './CategoryNav';
import { EMOJI_CATEGORIES } from './constants';

describe('CategoryNav', () => {
    const defaultProps = {
        activeCategory: 'people',
        onCategoryClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render category navigation container', () => {
            const { container } = render(<CategoryNav {...defaultProps} />);
            expect(container.querySelector('.emoji-category-tabs')).toBeInTheDocument();
        });

        it('should render button for each category', () => {
            const { container } = render(<CategoryNav {...defaultProps} />);
            const buttons = container.querySelectorAll('.emoji-category-tab');
            expect(buttons.length).toBe(EMOJI_CATEGORIES.length);
        });

        it('should render icons for each category', () => {
            const { container } = render(<CategoryNav {...defaultProps} />);
            const buttons = container.querySelectorAll('.emoji-category-tab');

            buttons.forEach(button => {
                expect(button.querySelector('svg')).toBeInTheDocument();
            });
        });
    });

    describe('Active state', () => {
        it('should mark the active category button', () => {
            const { container } = render(<CategoryNav {...defaultProps} activeCategory="nature" />);

            const activeButtons = container.querySelectorAll('.emoji-category-tab.active');
            expect(activeButtons.length).toBe(1);
            expect(activeButtons[0]).toHaveAttribute('title', 'Nature');
        });

        it('should update active state when prop changes', () => {
            const { container, rerender } = render(<CategoryNav {...defaultProps} activeCategory="people" />);

            let activeButton = container.querySelector('.emoji-category-tab.active');
            expect(activeButton).toHaveAttribute('title', 'People');

            rerender(<CategoryNav {...defaultProps} activeCategory="food" />);

            activeButton = container.querySelector('.emoji-category-tab.active');
            expect(activeButton).toHaveAttribute('title', 'Food');
        });
    });

    describe('Click handler', () => {
        it('should call onCategoryClick with category id when clicked', () => {
            render(<CategoryNav {...defaultProps} />);

            const natureButton = screen.getByTitle('Nature');
            fireEvent.click(natureButton);

            expect(defaultProps.onCategoryClick).toHaveBeenCalledWith('nature');
        });

        it('should call onCategoryClick for each category', () => {
            render(<CategoryNav {...defaultProps} />);

            EMOJI_CATEGORIES.forEach(category => {
                const button = screen.getByTitle(category.name);
                fireEvent.click(button);

                expect(defaultProps.onCategoryClick).toHaveBeenCalledWith(category.id);
            });
        });
    });

    describe('Accessibility', () => {
        it('should have aria-label on category buttons', () => {
            const { container } = render(<CategoryNav {...defaultProps} />);
            const buttons = container.querySelectorAll('.emoji-category-tab');

            buttons.forEach(button => {
                expect(button).toHaveAttribute('aria-label');
            });
        });

        it('should have title attributes for tooltips', () => {
            const { container } = render(<CategoryNav {...defaultProps} />);
            const buttons = container.querySelectorAll('.emoji-category-tab');

            buttons.forEach((button, index) => {
                expect(button).toHaveAttribute('title', EMOJI_CATEGORIES[index].name);
            });
        });
    });
});
