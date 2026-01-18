import { render, screen, fireEvent, act } from '@testing-library/react';
import TurnIntoMenu from './TurnIntoMenu';

describe('TurnIntoMenu', () => {
    const defaultProps = {
        position: { top: 100, left: 100 },
        currentBlockType: 'paragraph',
        onSelect: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Element.scrollIntoView is not implemented in JSDOM
        Element.prototype.scrollIntoView = vi.fn();
    });

    describe('Rendering', () => {
        it('renders all menu items', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            expect(screen.getByText('Normal Text')).toBeInTheDocument();
            expect(screen.getByText('Heading 1')).toBeInTheDocument();
            expect(screen.getByText('Heading 2')).toBeInTheDocument();
            expect(screen.getByText('Heading 3')).toBeInTheDocument();
            expect(screen.getByText('Heading 4')).toBeInTheDocument();
            expect(screen.getByText('Bulleted List')).toBeInTheDocument();
            expect(screen.getByText('Numbered List')).toBeInTheDocument();
            expect(screen.getByText('Quote')).toBeInTheDocument();
        });

        it('renders header with "Basic blocks" text', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            expect(screen.getByText('Basic blocks')).toBeInTheDocument();
        });

        it('renders header decorative lines', () => {
            const { container } = render(<TurnIntoMenu {...defaultProps} />);

            expect(container.querySelector('.turn-into-menu-header-line-left')).toBeInTheDocument();
            expect(container.querySelector('.turn-into-menu-header-line-right')).toBeInTheDocument();
        });

        it('positions at given coordinates', () => {
            const { container } = render(
                <TurnIntoMenu {...defaultProps} position={{ top: 200, left: 300 }} />
            );

            const menu = container.querySelector('.turn-into-menu');
            expect(menu).toHaveStyle({ top: '200px', left: '300px' });
        });
    });

    describe('Shortcut display', () => {
        it('renders shortcuts for items that have them', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            expect(screen.getByText('#')).toBeInTheDocument();
            expect(screen.getByText('##')).toBeInTheDocument();
            expect(screen.getByText('###')).toBeInTheDocument();
            expect(screen.getByText('####')).toBeInTheDocument();
            expect(screen.getByText('-')).toBeInTheDocument();
            expect(screen.getByText('1.')).toBeInTheDocument();
            expect(screen.getByText('"')).toBeInTheDocument();
        });

        it('does not render shortcut element for Normal Text (null shortcut)', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            const normalTextItem = screen.getByText('Normal Text').closest('.turn-into-menu-item');
            const shortcutEl = normalTextItem.querySelector('.turn-into-menu-item-shortcut');
            expect(shortcutEl).not.toBeInTheDocument();
        });
    });

    describe('Selection behavior', () => {
        it('calls onSelect when item is clicked', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            fireEvent.click(screen.getByText('Heading 1'));

            expect(defaultProps.onSelect).toHaveBeenCalledWith('h1');
        });

        it('selects item on Enter key', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />);

            fireEvent.keyDown(document, { key: 'Enter' });

            expect(defaultProps.onSelect).toHaveBeenCalledWith('paragraph');
        });

        it('closes on Escape key', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    describe('currentBlockType (selected state)', () => {
        it('applies selected class to item matching currentBlockType', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="h1" />);

            const h1Item = screen.getByText('Heading 1').closest('.turn-into-menu-item');
            expect(h1Item).toHaveClass('selected');

            const normalTextItem = screen.getByText('Normal Text').closest('.turn-into-menu-item');
            expect(normalTextItem).not.toHaveClass('selected');
        });

        it('applies selected class to paragraph when currentBlockType is paragraph', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />);

            const paragraphItem = screen.getByText('Normal Text').closest('.turn-into-menu-item');
            expect(paragraphItem).toHaveClass('selected');
        });

        it('does not apply selected class when currentBlockType is unknown', () => {
            const { container } = render(
                <TurnIntoMenu {...defaultProps} currentBlockType="unknown-type" />
            );

            const selectedItems = container.querySelectorAll('.turn-into-menu-item.selected');
            expect(selectedItems.length).toBe(0);
        });
    });

    describe('Keyboard and mouse interaction', () => {
        it('applies highlighted class to currentBlockType item by default', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="h1" />);

            const h1Item = screen.getByText('Heading 1').closest('.turn-into-menu-item');
            expect(h1Item).toHaveClass('highlighted');
        });

        it('moves highlight down with ArrowDown', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="h1" />);

            fireEvent.keyDown(document, { key: 'ArrowDown' });

            const h2Item = screen.getByText('Heading 2').closest('.turn-into-menu-item');
            expect(h2Item).toHaveClass('highlighted');
        });

        it('moves highlight up with ArrowUp', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="h2" />);

            fireEvent.keyDown(document, { key: 'ArrowUp' });

            const h1Item = screen.getByText('Heading 1').closest('.turn-into-menu-item');
            expect(h1Item).toHaveClass('highlighted');
        });

        it('does not move highlight past first item', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />);

            fireEvent.keyDown(document, { key: 'ArrowUp' });

            const normalTextItem = screen.getByText('Normal Text').closest('.turn-into-menu-item');
            expect(normalTextItem).toHaveClass('highlighted');
        });

        it('does not move highlight past last item', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="quote" />);

            fireEvent.keyDown(document, { key: 'ArrowDown' });

            const quoteItem = screen.getByText('Quote').closest('.turn-into-menu-item');
            expect(quoteItem).toHaveClass('highlighted');
        });

        it('highlights item on mouse enter', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />);

            const h3Item = screen.getByText('Heading 3').closest('.turn-into-menu-item');
            fireEvent.mouseEnter(h3Item);

            expect(h3Item).toHaveClass('highlighted');
        });

        // Regression test: Bug fix - onMouseEnter was using initialIndex instead of current item index
        it('highlights the actual hovered item, not the initial index (regression)', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />);

            // Hover over different items and verify each one gets highlighted
            const quoteItem = screen.getByText('Quote').closest('.turn-into-menu-item');
            const h2Item = screen.getByText('Heading 2').closest('.turn-into-menu-item');
            const bulletedListItem = screen.getByText('Bulleted List').closest('.turn-into-menu-item');

            // Hover over Quote (index 7) - should highlight Quote, not Normal Text (index 0)
            fireEvent.mouseEnter(quoteItem);
            expect(quoteItem).toHaveClass('highlighted');
            expect(screen.getByText('Normal Text').closest('.turn-into-menu-item')).not.toHaveClass('highlighted');

            // Hover over Heading 2 (index 2)
            fireEvent.mouseEnter(h2Item);
            expect(h2Item).toHaveClass('highlighted');
            expect(quoteItem).not.toHaveClass('highlighted');

            // Hover over Bulleted List (index 5)
            fireEvent.mouseEnter(bulletedListItem);
            expect(bulletedListItem).toHaveClass('highlighted');
            expect(h2Item).not.toHaveClass('highlighted');
        });

        it('resets to currentBlockType position when mouse leaves', () => {
            render(<TurnIntoMenu {...defaultProps} currentBlockType="h1" />);

            const menuItems = screen.getByText('Normal Text').closest('.turn-into-menu-items');
            const h1Item = screen.getByText('Heading 1').closest('.turn-into-menu-item');

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
            render(<TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />);

            const menuItems = screen.getByText('Normal Text').closest('.turn-into-menu-items');

            fireEvent.mouseEnter(menuItems);
            fireEvent.keyDown(document, { key: 'ArrowDown' });

            // Should still be on first item (keyboard blocked)
            const firstItem = screen.getByText('Normal Text').closest('.turn-into-menu-item');
            expect(firstItem).toHaveClass('highlighted');
        });
    });

    describe('Click outside behavior', () => {
        it('closes menu when clicking outside', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            fireEvent.mouseDown(document.body);

            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('does not close menu when clicking inside', () => {
            render(<TurnIntoMenu {...defaultProps} />);

            fireEvent.mouseDown(screen.getByText('Heading 1'));

            expect(defaultProps.onClose).not.toHaveBeenCalled();
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
            const { container } = render(<TurnIntoMenu {...defaultProps} />);

            const scrollWrapper = container.querySelector('.turn-into-menu-scroll-wrapper');
            const menu = container.querySelector('.turn-into-menu');

            expect(menu).not.toHaveClass('scrolling');

            fireEvent.scroll(scrollWrapper);

            expect(menu).toHaveClass('scrolling');
        });

        it('removes scrolling class after 1 second of inactivity', async () => {
            const { container } = render(<TurnIntoMenu {...defaultProps} />);

            const scrollWrapper = container.querySelector('.turn-into-menu-scroll-wrapper');
            const menu = container.querySelector('.turn-into-menu');

            fireEvent.scroll(scrollWrapper);
            expect(menu).toHaveClass('scrolling');

            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(menu).not.toHaveClass('scrolling');
        });

        it('clears timeout on unmount', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const { container, unmount } = render(<TurnIntoMenu {...defaultProps} />);

            const scrollWrapper = container.querySelector('.turn-into-menu-scroll-wrapper');
            fireEvent.scroll(scrollWrapper);

            unmount();

            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });
    });

    describe('Positioning logic', () => {
        const setupPositioningTest = (windowHeight, windowWidth, rectHeight = 200, rectWidth = 150) => {
            window.innerHeight = windowHeight;
            window.innerWidth = windowWidth;

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
            render(<TurnIntoMenu {...defaultProps} position={{ top: 100, left: 100 }} />);

            const menu = screen.getByText('Normal Text').closest('.turn-into-menu');
            expect(menu).toHaveStyle({ top: '100px', left: '100px' });
        });

        it('repositions above when bottom overflow occurs', () => {
            setupPositioningTest(400, 1000, 200, 150);
            render(<TurnIntoMenu {...defaultProps} position={{ top: 300, left: 100 }} />);

            const menu = screen.getByText('Normal Text').closest('.turn-into-menu');
            // Expected: newTop = 300 - 200 - 8 = 92
            expect(menu).toHaveStyle({ top: '92px' });
        });

        it('prevents top overflow when repositioning upwards', () => {
            setupPositioningTest(400, 1000, 300, 150);
            render(<TurnIntoMenu {...defaultProps} position={{ top: 250, left: 100 }} />);

            const menu = screen.getByText('Normal Text').closest('.turn-into-menu');
            // 250 - 300 - 8 = -58, should cap at 8
            expect(menu).toHaveStyle({ top: '8px' });
        });

        it('adjusts left position if it overflows right edge', () => {
            setupPositioningTest(800, 500, 200, 200);
            render(<TurnIntoMenu {...defaultProps} position={{ top: 100, left: 400 }} />);

            const menu = screen.getByText('Normal Text').closest('.turn-into-menu');
            // Expected: 500 - 200 - 8 = 292
            expect(menu).toHaveStyle({ left: '292px' });
        });

        it('adjusts left position if it overflows left edge', () => {
            setupPositioningTest(800, 1000, 200, 200);
            render(<TurnIntoMenu {...defaultProps} position={{ top: 100, left: -50 }} />);

            const menu = screen.getByText('Normal Text').closest('.turn-into-menu');
            expect(menu).toHaveStyle({ left: '8px' });
        });
    });

    describe('Selection sync', () => {
        it('syncs selectedIndex when currentBlockType changes', () => {
            const { rerender } = render(
                <TurnIntoMenu {...defaultProps} currentBlockType="paragraph" />
            );

            const normalTextItem = screen.getByText('Normal Text').closest('.turn-into-menu-item');
            expect(normalTextItem).toHaveClass('highlighted');

            rerender(<TurnIntoMenu {...defaultProps} currentBlockType="h2" />);

            const h2Item = screen.getByText('Heading 2').closest('.turn-into-menu-item');
            expect(h2Item).toHaveClass('highlighted');
        });
    });

    describe('Event prevention', () => {
        it('prevents default on mousedown to preserve focus', () => {
            const { container } = render(<TurnIntoMenu {...defaultProps} />);

            const menu = container.querySelector('.turn-into-menu');
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault');

            menu.dispatchEvent(mouseDownEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });
});
