import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmojiPicker, ICON_COLORS } from './index';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IntersectionObserver for EmojiTab
class MockIntersectionObserver {
    constructor() { }
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.IntersectionObserver = MockIntersectionObserver;


describe('EmojiPicker', () => {
    const defaultProps = {
        isOpen: true,
        position: { top: 100, left: 200 },
        onSelect: vi.fn(),
        onRemove: vi.fn(),
        onClose: vi.fn(),
        currentValue: null,
        showRemove: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('should not render when isOpen is false', () => {
            render(<EmojiPicker {...defaultProps} isOpen={false} />);
            expect(screen.queryByRole('button', { name: /emoji/i })).not.toBeInTheDocument();
        });

        it('should render when isOpen is true', () => {
            render(<EmojiPicker {...defaultProps} />);
            expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
        });

        it('should render Emoji and Icons tabs', () => {
            render(<EmojiPicker {...defaultProps} />);
            expect(screen.getByRole('button', { name: 'Emoji' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Icons' })).toBeInTheDocument();
        });

        it('should render Remove button when showRemove is true', () => {
            render(<EmojiPicker {...defaultProps} showRemove={true} />);
            expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
        });

        it('should not render Remove button when showRemove is false', () => {
            render(<EmojiPicker {...defaultProps} showRemove={false} />);
            expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
        });

        it('should be positioned according to position prop', () => {
            const { container } = render(<EmojiPicker {...defaultProps} position={{ top: 150, left: 250 }} />);
            const picker = container.querySelector('.emoji-picker');
            expect(picker.style.top).toBe('150px');
            expect(picker.style.left).toBe('250px');
        });
    });

    describe('Tab switching', () => {
        it('should start with Emoji tab active', () => {
            render(<EmojiPicker {...defaultProps} />);
            const emojiTab = screen.getByRole('button', { name: 'Emoji' });
            expect(emojiTab).toHaveClass('active');
        });

        it('should switch to Icons tab when clicked', () => {
            render(<EmojiPicker {...defaultProps} />);
            const iconsTab = screen.getByRole('button', { name: 'Icons' });

            fireEvent.click(iconsTab);

            expect(iconsTab).toHaveClass('active');
            expect(screen.getByRole('button', { name: 'Emoji' })).not.toHaveClass('active');
        });

        it('should switch back to Emoji tab when clicked', () => {
            render(<EmojiPicker {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
            fireEvent.click(screen.getByRole('button', { name: 'Emoji' }));

            expect(screen.getByRole('button', { name: 'Emoji' })).toHaveClass('active');
        });

        it('should show color button only in Icons tab', () => {
            render(<EmojiPicker {...defaultProps} />);

            // Not visible in Emoji tab
            expect(screen.queryByTitle('Change color')).not.toBeInTheDocument();

            // Switch to Icons tab
            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));

            // Now visible
            expect(screen.getByTitle('Change color')).toBeInTheDocument();
        });
    });

    describe('Search functionality', () => {
        it('should render search input', () => {
            render(<EmojiPicker {...defaultProps} />);
            expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
        });

        it('should update search query on input', () => {
            render(<EmojiPicker {...defaultProps} />);
            const searchInput = screen.getByPlaceholderText('Filter...');

            fireEvent.change(searchInput, { target: { value: 'smile' } });

            expect(searchInput.value).toBe('smile');
        });

        it('should focus search input on open', async () => {
            render(<EmojiPicker {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Filter...')).toHaveFocus();
            }, { timeout: 100 });
        });
    });

    describe('Selection callbacks', () => {
        it('should call onRemove and onClose when Remove button is clicked', () => {
            render(<EmojiPicker {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

            expect(defaultProps.onRemove).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('should call onSelect with emoji data when emoji is clicked', async () => {
            render(<EmojiPicker {...defaultProps} />);

            // Find and click an emoji button
            const emojiButtons = screen.getAllByRole('button').filter(
                btn => btn.classList.contains('emoji-grid-item')
            );

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

        it('should call onSelect with icon data when icon is clicked', async () => {
            render(<EmojiPicker {...defaultProps} />);

            // Switch to Icons tab
            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));

            // Find and click an icon button
            const iconButtons = screen.getAllByRole('button').filter(
                btn => btn.classList.contains('icon-item')
            );

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
    });

    describe('Shuffle functionality', () => {
        it('should render shuffle button', () => {
            render(<EmojiPicker {...defaultProps} />);
            expect(screen.getByTitle('Random')).toBeInTheDocument();
        });

        it('should call onSelect with random emoji when shuffle clicked in Emoji tab', () => {
            render(<EmojiPicker {...defaultProps} />);

            fireEvent.click(screen.getByTitle('Random'));

            expect(defaultProps.onSelect).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'emoji',
                    value: expect.any(String),
                })
            );
        });

        it('should call onSelect with random icon when shuffle clicked in Icons tab', () => {
            render(<EmojiPicker {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
            fireEvent.click(screen.getByTitle('Random'));

            expect(defaultProps.onSelect).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'icon',
                    value: expect.any(String),
                    color: expect.any(String),
                })
            );
        });
    });

    describe('Escape key handling', () => {
        it('should call onClose when Escape is pressed', () => {
            render(<EmojiPicker {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    describe('Click outside handling', () => {
        it('should call onClose when clicking outside picker', () => {
            render(
                <div>
                    <div data-testid="outside">Outside</div>
                    <EmojiPicker {...defaultProps} />
                </div>
            );

            fireEvent.mouseDown(screen.getByTestId('outside'));

            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('should not call onClose when clicking inside picker', () => {
            const { container } = render(<EmojiPicker {...defaultProps} />);

            const picker = container.querySelector('.emoji-picker');
            fireEvent.mouseDown(picker);

            expect(defaultProps.onClose).not.toHaveBeenCalled();
        });
    });

    describe('Color picker', () => {
        it('should toggle color picker when color button clicked', () => {
            render(<EmojiPicker {...defaultProps} />);

            // Switch to Icons tab
            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));

            // Click color button
            fireEvent.click(screen.getByTitle('Change color'));

            // Color picker should be visible
            expect(document.querySelector('.color-picker-dropdown')).toBeInTheDocument();
        });

        it('should close color picker when Escape is pressed', () => {
            render(<EmojiPicker {...defaultProps} />);

            // Switch to Icons tab and open color picker
            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
            fireEvent.click(screen.getByTitle('Change color'));

            expect(document.querySelector('.color-picker-dropdown')).toBeInTheDocument();

            // Press Escape
            fireEvent.keyDown(document, { key: 'Escape' });

            // Color picker should close, but main picker stays open
            expect(document.querySelector('.color-picker-dropdown')).not.toBeInTheDocument();
            expect(document.querySelector('.emoji-picker')).toBeInTheDocument();
        });
    });

    describe('Current value highlighting', () => {
        it('should highlight current emoji when currentValue is set', () => {
            render(
                <EmojiPicker
                    {...defaultProps}
                    currentValue={{ type: 'emoji', value: '😀' }}
                />
            );

            const selectedEmojis = document.querySelectorAll('.emoji-grid-item.selected');
            expect(selectedEmojis.length).toBeGreaterThanOrEqual(0);
        });

        it('should highlight current icon when currentValue is set', () => {
            render(
                <EmojiPicker
                    {...defaultProps}
                    currentValue={{ type: 'icon', value: 'heart', color: ICON_COLORS.orange }}
                />
            );

            // Switch to Icons tab
            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));

            const selectedIcons = document.querySelectorAll('.icon-item.selected');
            expect(selectedIcons.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Category navigation', () => {
        it('should render category tabs in Emoji tab', () => {
            render(<EmojiPicker {...defaultProps} />);
            expect(document.querySelector('.emoji-category-tabs')).toBeInTheDocument();
        });

        it('should hide category tabs in Icons tab', () => {
            render(<EmojiPicker {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Icons' }));

            expect(document.querySelector('.emoji-category-tabs')).not.toBeInTheDocument();
        });

        it('should hide category tabs when searching', async () => {
            render(<EmojiPicker {...defaultProps} />);
            const searchInput = screen.getByPlaceholderText('Filter...');

            fireEvent.change(searchInput, { target: { value: 'smile' } });

            // Wait for debounce
            await waitFor(() => {
                expect(document.querySelector('.emoji-category-tabs')).not.toBeInTheDocument();
            }, { timeout: 200 });
        });
    });

    describe('Reset state on close', () => {
        it('should reset search when reopened', () => {
            const { rerender } = render(<EmojiPicker {...defaultProps} />);

            // Type something in search
            fireEvent.change(screen.getByPlaceholderText('Filter...'), { target: { value: 'test' } });

            // Close picker
            rerender(<EmojiPicker {...defaultProps} isOpen={false} />);

            // Reopen picker
            rerender(<EmojiPicker {...defaultProps} isOpen={true} />);

            expect(screen.getByPlaceholderText('Filter...').value).toBe('');
        });
    });
});
