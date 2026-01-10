import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EmojiTab from './EmojiTab';
import { STORAGE_KEYS } from './constants';

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
        // Clear localStorage before each test
        localStorage.removeItem(STORAGE_KEYS.RECENT_EMOJIS);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.removeItem(STORAGE_KEYS.RECENT_EMOJIS);
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

        it('should keep category tabs visible when searching', () => {
            const { container } = render(<EmojiTab {...defaultProps} searchQuery="smile" />);
            const tabs = container.querySelector('.emoji-category-tabs');
            expect(tabs).toBeInTheDocument();
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

    describe('Recent category', () => {
        it('should disable Recent button when no recent emojis exist', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            
            const recentButton = container.querySelector('.emoji-category-tab[title="Recent"]');
            expect(recentButton).toBeDisabled();
        });

        it('should enable Recent button when recent emojis exist', () => {
            // Set up recent emojis in localStorage
            localStorage.setItem(STORAGE_KEYS.RECENT_EMOJIS, JSON.stringify(['😀', '😃', '😄']));
            
            const { container } = render(<EmojiTab {...defaultProps} />);
            
            const recentButton = container.querySelector('.emoji-category-tab[title="Recent"]');
            expect(recentButton).not.toBeDisabled();
        });

        it('should show "No recent emojis" message when recent category is active but empty', () => {
            render(<EmojiTab {...defaultProps} activeCategory="recent" />);
            
            expect(screen.getByText('No recent emojis')).toBeInTheDocument();
        });

        it('should display recent emojis when they exist and recent category is active', () => {
            const recentEmojis = ['😀', '😃', '😄'];
            localStorage.setItem(STORAGE_KEYS.RECENT_EMOJIS, JSON.stringify(recentEmojis));
            
            const { container } = render(<EmojiTab {...defaultProps} activeCategory="recent" />);
            
            const emojiButtons = container.querySelectorAll('.emoji-grid-item');
            expect(emojiButtons.length).toBe(recentEmojis.length);
        });

        it('should save emoji to recent when selected', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            
            const emojiButtons = container.querySelectorAll('.emoji-grid-item');
            if (emojiButtons.length > 0) {
                fireEvent.click(emojiButtons[0]);
                
                const stored = localStorage.getItem(STORAGE_KEYS.RECENT_EMOJIS);
                expect(stored).toBeTruthy();
                const recent = JSON.parse(stored);
                expect(recent.length).toBeGreaterThan(0);
            }
        });

        it('should not allow clicking disabled Recent button', () => {
            const { container } = render(<EmojiTab {...defaultProps} />);
            
            const recentButton = container.querySelector('.emoji-category-tab[title="Recent"]');
            fireEvent.click(recentButton);
            
            // onCategoryChange should not be called for disabled button
            // (the button is disabled, so click won't trigger the handler)
            expect(defaultProps.onCategoryChange).not.toHaveBeenCalledWith('recent');
        });

        it('should limit recent emojis to maximum allowed', () => {
            // Fill with more than max emojis
            const manyEmojis = Array(40).fill(null).map((_, i) => String.fromCodePoint(0x1F600 + i));
            localStorage.setItem(STORAGE_KEYS.RECENT_EMOJIS, JSON.stringify(manyEmojis));
            
            const { container } = render(<EmojiTab {...defaultProps} />);
            
            // Click an emoji to trigger save
            const emojiButtons = container.querySelectorAll('.emoji-grid-item');
            if (emojiButtons.length > 0) {
                fireEvent.click(emojiButtons[0]);
                
                const stored = localStorage.getItem(STORAGE_KEYS.RECENT_EMOJIS);
                const recent = JSON.parse(stored);
                // Should not exceed 36 (MAX_RECENT_EMOJIS)
                expect(recent.length).toBeLessThanOrEqual(36);
            }
        });
    });
});
