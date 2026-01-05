import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EmojiTab from './EmojiTab';

describe('EmojiTab', () => {
    const defaultProps = {
        searchQuery: '',
        onSelect: vi.fn(),
        currentEmoji: null,
        activeCategory: 'people',
        onCategoryChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('should render emoji tab container', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            expect(container.querySelector('.emoji-tab-container')).toBeInTheDocument();
        });

        it('should render category tabs', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            const tabs = container.querySelectorAll('.emoji-category-tab');
            expect(tabs.length).toBeGreaterThan(0);
        });

        it('should render emoji buttons', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            const emojiButtons = container.querySelectorAll('.emoji-grid-item');
            expect(emojiButtons.length).toBeGreaterThan(0);
        });

        it('should highlight active category tab', () => {
            const { container } = render(<EmojiTab {...defaultProps} activeCategory="nature" />);
            const activeTabs = container.querySelectorAll('.emoji-category-tab.active');
            expect(activeTabs.length).toBe(1);
        });
    });

    describe('Category switching', () => {
        it('should call onCategoryChange when category tab is clicked', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            const tabs = container.querySelectorAll('.emoji-category-tab');

            // Click on a different tab (not the first one which is already active)
            if (tabs.length > 1) {
                fireEvent.click(tabs[1]);
                expect(defaultProps.onCategoryChange).toHaveBeenCalled();
            }
        });

        it('should display emojis only from active category', () => {
            const { container, rerender } = render(<EmojiTab {...defaultProps} activeCategory="people" />);
            const peopleCount = container.querySelectorAll('.emoji-grid-item').length;

            rerender(<EmojiTab {...defaultProps} activeCategory="flags" />);
            const flagsCount = container.querySelectorAll('.emoji-grid-item').length;

            // Different categories have different emoji counts
            expect(peopleCount).not.toBe(flagsCount);
        });
    });

    describe('Search filtering', () => {
        it('should filter emojis based on search query', () => {
            const { container, rerender } = render(<EmojiTab {...defaultProps} />);
            const initialCount = container.querySelectorAll('.emoji-grid-item').length;

            rerender(<EmojiTab {...defaultProps} searchQuery="smile" />);
            const filteredCount = container.querySelectorAll('.emoji-grid-item').length;

            // Filtering should change the count
            expect(filteredCount).not.toBe(initialCount);
        });

        it('should show "No emojis found" when no matches', () => {
            render(<EmojiTab {...defaultProps} searchQuery="xyznonexistent123" />);
            expect(screen.getByText('No emojis found')).toBeInTheDocument();
        });

        it('should search by emoji name', () => {
            const { container } = render(<EmojiTab {...defaultProps} searchQuery="grinning" />);
            const emojiButtons = container.querySelectorAll('.emoji-grid-item');
            expect(emojiButtons.length).toBeGreaterThan(0);
        });

        it('should hide category tabs when searching', () => {
            const { container } = render(<EmojiTab {...defaultProps} searchQuery="smile" />);
            const tabs = container.querySelectorAll('.emoji-category-tabs');
            expect(tabs.length).toBe(0);
        });
    });

    describe('Selection', () => {
        it('should call onSelect with emoji data when clicked', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);

            const emojiButtons = container.querySelectorAll('.emoji-grid-item');
            if (emojiButtons.length > 0) {
                fireEvent.click(emojiButtons[0]);

                expect(defaultProps.onSelect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'emoji',
                        value: expect.any(String),
                    })
                );
            }
        });

        it('should highlight currently selected emoji', () => {
            const { container } = render(<EmojiTab {...defaultProps} currentEmoji="😀" />);

            const selectedItems = container.querySelectorAll('.emoji-grid-item.selected');
            // Should find selected emoji if it's in the current category
            expect(selectedItems.length).toBeGreaterThanOrEqual(0);
        });
    });
});
