import { render, screen, fireEvent, act } from '@testing-library/react';
import SlashCommandMenu from './SlashCommandMenu';

describe('SlashCommandMenu', () => {
    const defaultProps = {
        position: { top: 100, left: 100 },
        filter: '',
        onSelect: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Element.scrollIntoView is not implemented in JSDOM
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('renders menu items', () => {
        render(<SlashCommandMenu {...defaultProps} />);

        expect(screen.getByText('Normal Text')).toBeInTheDocument();
        expect(screen.getByText('Heading 1')).toBeInTheDocument();
        expect(screen.getByText('Bulleted List')).toBeInTheDocument();
    });

    it('filters items', () => {
        render(<SlashCommandMenu {...defaultProps} filter="Heading" />);

        expect(screen.getByText('Heading 1')).toBeInTheDocument();
        expect(screen.getByText('Heading 2')).toBeInTheDocument();
        expect(screen.queryByText('Bulleted List')).not.toBeInTheDocument();
    });

    it('selects item on click', () => {
        render(<SlashCommandMenu {...defaultProps} />);

        fireEvent.click(screen.getByText('Heading 1'));

        expect(defaultProps.onSelect).toHaveBeenCalledWith('h1');
    });

    it('selects item on Enter key', () => {
        render(<SlashCommandMenu {...defaultProps} currentBlockType="paragraph" />);

        fireEvent.keyDown(document, { key: 'Enter' });

        // With no highlight, Enter selects currentBlockType
        expect(defaultProps.onSelect).toHaveBeenCalledWith('paragraph');
    });

    it('shows no results if filter matches nothing', () => {
        render(<SlashCommandMenu {...defaultProps} filter="xyz" />);
        expect(screen.getByText('No results')).toBeInTheDocument();
    });

    describe('Shortcut display', () => {
        it('renders shortcuts for items that have them', () => {
            render(<SlashCommandMenu {...defaultProps} />);

            // Heading 1 has shortcut '#'
            expect(screen.getByText('#')).toBeInTheDocument();
            // Heading 2 has shortcut '##'
            expect(screen.getByText('##')).toBeInTheDocument();
            // Bulleted List has shortcut '-'
            expect(screen.getByText('-')).toBeInTheDocument();
            // Quote has shortcut '"'
            expect(screen.getByText('"')).toBeInTheDocument();
        });

        it('does not render shortcut element for Normal Text (null shortcut)', () => {
            const { container } = render(<SlashCommandMenu {...defaultProps} />);

            // Find the Normal Text item
            const normalTextItem = screen.getByText('Normal Text').closest('.slash-menu-item');
            expect(normalTextItem).toBeInTheDocument();

            // It should not have a shortcut element
            const shortcutEl = normalTextItem.querySelector('.slash-menu-item-shortcut');
            expect(shortcutEl).not.toBeInTheDocument();
        });
    });

    describe('Scroll behavior', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('adds scrolling class when scrolling', () => {
            const { container } = render(<SlashCommandMenu {...defaultProps} />);

            const scrollWrapper = container.querySelector('.slash-menu-scroll-wrapper');
            expect(scrollWrapper).toBeInTheDocument();

            const menu = container.querySelector('.slash-command-menu');
            expect(menu).not.toHaveClass('scrolling');

            // Trigger scroll
            fireEvent.scroll(scrollWrapper);

            expect(menu).toHaveClass('scrolling');
        });

        it('removes scrolling class after 1 second of inactivity', async () => {
            const { container } = render(<SlashCommandMenu {...defaultProps} />);

            const scrollWrapper = container.querySelector('.slash-menu-scroll-wrapper');
            const menu = container.querySelector('.slash-command-menu');

            // Trigger scroll
            fireEvent.scroll(scrollWrapper);
            expect(menu).toHaveClass('scrolling');

            // Advance time by 1 second and wrap in act for state update
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(menu).not.toHaveClass('scrolling');
        });

        it('clears timeout on unmount to prevent memory leaks', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const { container, unmount } = render(<SlashCommandMenu {...defaultProps} />);

            const scrollWrapper = container.querySelector('.slash-menu-scroll-wrapper');

            // Trigger scroll to start a timeout
            fireEvent.scroll(scrollWrapper);

            // Unmount the component
            unmount();

            // clearTimeout should have been called during cleanup
            expect(clearTimeoutSpy).toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
        });
    });

    describe('Header structure', () => {
        it('renders header with "Basic blocks" text', () => {
            render(<SlashCommandMenu {...defaultProps} />);

            expect(screen.getByText('Basic blocks')).toBeInTheDocument();
        });

        it('renders header decorative lines', () => {
            const { container } = render(<SlashCommandMenu {...defaultProps} />);

            expect(container.querySelector('.slash-menu-header-line-left')).toBeInTheDocument();
            expect(container.querySelector('.slash-menu-header-line-right')).toBeInTheDocument();
        });
    });

    describe('UI structure', () => {
        it('does not render description elements in the UI', () => {
            const { container } = render(<SlashCommandMenu {...defaultProps} />);

            // Description should not be rendered in the UI
            const descriptions = container.querySelectorAll('.slash-menu-item-description');
            expect(descriptions.length).toBe(0);
        });

        it('still filters items by description even though not displayed', () => {
            // Filter by description text "Unordered" should find Bulleted List
            render(<SlashCommandMenu {...defaultProps} filter="Unordered" />);

            expect(screen.getByText('Bulleted List')).toBeInTheDocument();
            expect(screen.queryByText('Numbered List')).not.toBeInTheDocument();
        });
    });

    describe('currentBlockType (selected state)', () => {
        it('applies selected class to item matching currentBlockType', () => {
            const { container } = render(
                <SlashCommandMenu {...defaultProps} currentBlockType="h1" />
            );

            const h1Item = screen.getByText('Heading 1').closest('.slash-menu-item');
            expect(h1Item).toHaveClass('selected');

            // Other items should not have selected class
            const normalTextItem = screen.getByText('Normal Text').closest('.slash-menu-item');
            expect(normalTextItem).not.toHaveClass('selected');
        });

        it('applies selected class to paragraph when currentBlockType is paragraph', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="paragraph" />);

            const paragraphItem = screen.getByText('Normal Text').closest('.slash-menu-item');
            expect(paragraphItem).toHaveClass('selected');
        });

        it('does not apply selected class when currentBlockType is not in menu', () => {
            const { container } = render(
                <SlashCommandMenu {...defaultProps} currentBlockType="unknown-type" />
            );

            const selectedItems = container.querySelectorAll('.slash-menu-item.selected');
            expect(selectedItems.length).toBe(0);
        });
    });

    describe('Keyboard and mouse interaction', () => {
        it('applies highlighted class to currentBlockType item by default', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="h1" />);

            // currentBlockType item should be highlighted by default
            const h1Item = screen.getByText('Heading 1').closest('.slash-menu-item');
            expect(h1Item).toHaveClass('highlighted');
        });

        it('moves highlight down with ArrowDown from currentBlockType', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="h1" />);

            // Press ArrowDown to move to next item
            fireEvent.keyDown(document, { key: 'ArrowDown' });

            // Should highlight Heading 2 (next after h1)
            const h2Item = screen.getByText('Heading 2').closest('.slash-menu-item');
            expect(h2Item).toHaveClass('highlighted');
        });

        it('moves highlight up with ArrowUp from currentBlockType', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="h2" />);

            // Press ArrowUp to move to previous item
            fireEvent.keyDown(document, { key: 'ArrowUp' });

            // Should highlight Heading 1 (previous before h2)
            const h1Item = screen.getByText('Heading 1').closest('.slash-menu-item');
            expect(h1Item).toHaveClass('highlighted');
        });

        it('resets to currentBlockType position when mouse enters and leaves', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="h1" />);

            const menuItems = screen.getByText('Normal Text').closest('.slash-menu-items');
            const h1Item = screen.getByText('Heading 1').closest('.slash-menu-item');

            // Initially h1 is highlighted
            expect(h1Item).toHaveClass('highlighted');

            // Move with keyboard
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(h1Item).not.toHaveClass('highlighted');

            // Mouse enters and leaves
            fireEvent.mouseEnter(menuItems);
            fireEvent.mouseLeave(menuItems);

            // Should reset to currentBlockType (h1)
            expect(h1Item).toHaveClass('highlighted');
        });

        it('blocks keyboard navigation when mouse is hovering', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="paragraph" />);

            const menuItems = screen.getByText('Normal Text').closest('.slash-menu-items');

            // Mouse enters the items container (sets isMouseHovering to true)
            fireEvent.mouseEnter(menuItems);

            // Try to navigate with keyboard - should be blocked
            fireEvent.keyDown(document, { key: 'ArrowDown' });

            // First item should still be highlighted (no change)
            const firstItem = screen.getByText('Normal Text').closest('.slash-menu-item');
            expect(firstItem).toHaveClass('highlighted');
        });

        // Regression test: Bug fix - onMouseEnter was using initialIndex instead of current item index
        it('highlights the actual hovered item, not the initial index (regression)', () => {
            render(<SlashCommandMenu {...defaultProps} currentBlockType="paragraph" />);

            // Hover over different items and verify each one gets highlighted
            const quoteItem = screen.getByText('Quote').closest('.slash-menu-item');
            const h2Item = screen.getByText('Heading 2').closest('.slash-menu-item');

            // Hover over Quote (index 7) - should highlight Quote, not Normal Text (index 0)
            fireEvent.mouseEnter(quoteItem);
            expect(quoteItem).toHaveClass('highlighted');
            expect(screen.getByText('Normal Text').closest('.slash-menu-item')).not.toHaveClass('highlighted');

            // Hover over Heading 2 (index 2)
            fireEvent.mouseEnter(h2Item);
            expect(h2Item).toHaveClass('highlighted');
            expect(quoteItem).not.toHaveClass('highlighted');
        });
    });

    describe('Filter with currentBlockType out of bounds (regression)', () => {
        // Regression test: Bug fix - initialIndex was computed from full MENU_ITEMS array
        // but used as index into filteredItems, causing out-of-bounds access
        it('handles currentBlockType not in filtered results gracefully', () => {
            // currentBlockType is "quote" (index 7 in full list)
            // but filter only shows headings (4 items, indices 0-3)
            render(<SlashCommandMenu {...defaultProps} filter="Heading" currentBlockType="quote" />);

            // Should default to first item (index 0) since quote is not in filtered results
            const h1Item = screen.getByText('Heading 1').closest('.slash-menu-item');
            expect(h1Item).toHaveClass('highlighted');

            // Should be able to navigate normally
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            const h2Item = screen.getByText('Heading 2').closest('.slash-menu-item');
            expect(h2Item).toHaveClass('highlighted');
        });

        it('selects first filtered item on Enter when currentBlockType is not in filter', () => {
            const onSelect = vi.fn();
            render(
                <SlashCommandMenu
                    {...defaultProps}
                    filter="Heading"
                    currentBlockType="quote"
                    onSelect={onSelect}
                />
            );

            // Press Enter - should select Heading 1 (first filtered item), not undefined
            fireEvent.keyDown(document, { key: 'Enter' });

            expect(onSelect).toHaveBeenCalledWith('h1');
        });

        it('resets to safe index when mouse leaves and currentBlockType is not in filter', () => {
            render(<SlashCommandMenu {...defaultProps} filter="Heading" currentBlockType="quote" />);

            const menuItems = screen.getByText('Heading 1').closest('.slash-menu-items');

            // Navigate with keyboard
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            fireEvent.keyDown(document, { key: 'ArrowDown' });

            // Mouse enter and leave
            fireEvent.mouseEnter(menuItems);
            fireEvent.mouseLeave(menuItems);

            // Should reset to first item (safe fallback since quote not in filter)
            const h1Item = screen.getByText('Heading 1').closest('.slash-menu-item');
            expect(h1Item).toHaveClass('highlighted');
        });

        it('highlights currentBlockType when it is in filtered results', () => {
            render(<SlashCommandMenu {...defaultProps} filter="Heading" currentBlockType="h2" />);

            // h2 is in filtered results, so it should be highlighted
            const h2Item = screen.getByText('Heading 2').closest('.slash-menu-item');
            expect(h2Item).toHaveClass('highlighted');
        });
    });

    describe('Positioning logic', () => {
        // Helper to mock window dimensions and element rect
        const setupPositioningTest = (windowHeight, windowWidth, rectHeight = 200, rectWidth = 150) => {
            window.innerHeight = windowHeight;
            window.innerWidth = windowWidth;

            // Mock getBoundingClientRect
            Element.prototype.getBoundingClientRect = vi.fn(() => ({
                height: rectHeight,
                width: rectWidth,
                top: 0,
                left: 0,
                right: rectWidth,
                bottom: rectHeight,
            }));
        };

        it('uses default position when there is sufficient space', () => {
            setupPositioningTest(800, 1000);
            render(<SlashCommandMenu {...defaultProps} position={{ top: 100, left: 100 }} />);

            const menu = screen.getByText('Normal Text').closest('.slash-command-menu');
            expect(menu).toHaveStyle({ top: '100px', left: '100px' });
        });

        it('repositions to right-side when bottom overflow occurs', () => {
            // Very short window, menu (height 200) won't fit at top 500
            setupPositioningTest(600, 1000, 200, 150);
            const initialTop = 500;
            const initialLeft = 100;

            render(<SlashCommandMenu {...defaultProps} position={{ top: initialTop, left: initialLeft }} />);

            const menu = screen.getByText('Normal Text').closest('.slash-command-menu');

            // Expected calculation:
            // newTop = initialTop - cursorLineHeight(26) - menuHeight(200)
            // 500 - 226 = 274
            // newLeft = initialLeft + 8 = 108

            expect(menu).toHaveStyle({ top: '274px', left: '108px' });
        });

        it('prevents top overflow when repositioning upwards', () => {
            // Very short window and very low position
            setupPositioningTest(400, 1000, 300, 150); // Tall menu
            const initialTop = 350; // Near bottom
            // newTop would be 350 - 26 - 300 = 24. This is > 8, so it's fine.
            // Let's make it go negative. 
            // 200 - 26 - 300 = -126. Should cap at 8.

            render(<SlashCommandMenu {...defaultProps} position={{ top: 200, left: 100 }} />);

            // We need to force bottom overflow first. 
            // Window height 400. Top 200. Menu 300. 200+300 = 500 > 400. Overflow!

            const menu = screen.getByText('Normal Text').closest('.slash-command-menu');
            expect(menu).toHaveStyle({ top: '8px' });
        });

        it('adjusts left position if it overflows right edge', () => {
            setupPositioningTest(800, 500, 200, 200); // 500 width, 200 menu width
            const initialLeft = 400; // 400 + 200 = 600 > 500.

            render(<SlashCommandMenu {...defaultProps} position={{ top: 100, left: initialLeft }} />);

            const menu = screen.getByText('Normal Text').closest('.slash-command-menu');

            // Expected: newLeft = viewportWidth - menuWidth - 8
            // 500 - 200 - 8 = 292
            expect(menu).toHaveStyle({ left: '292px' });
        });
    });
});
