import { render, screen, fireEvent } from '@testing-library/react';
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
        render(<SlashCommandMenu {...defaultProps} />);

        fireEvent.keyDown(document, { key: 'Enter' });

        // First item is selected by default (Normal Text / paragraph)
        expect(defaultProps.onSelect).toHaveBeenCalledWith('paragraph');
    });

    it('shows no results if filter matches nothing', () => {
        render(<SlashCommandMenu {...defaultProps} filter="xyz" />);
        expect(screen.getByText('No results')).toBeInTheDocument();
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
