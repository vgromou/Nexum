import { render, screen, fireEvent } from '@testing-library/react';
import ColorPicker from './ColorPicker';

describe('ColorPicker', () => {
    const defaultProps = {
        position: { top: 100, left: 100 },
        activeTextColor: null,
        activeBgColor: null,
        onTextColorChange: vi.fn(),
        onBgColorChange: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Rendering', () => {
        it('renders all three sections', () => {
            render(<ColorPicker {...defaultProps} />);

            expect(screen.getByText('Recently used')).toBeInTheDocument();
            expect(screen.getByText('Text color')).toBeInTheDocument();
            expect(screen.getByText('Background color')).toBeInTheDocument();
        });

        it('renders empty state for recently used when no colors saved', () => {
            render(<ColorPicker {...defaultProps} />);

            expect(screen.getByText('No recent colors')).toBeInTheDocument();
        });

        it('renders text color swatches', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const textSwatches = container.querySelectorAll('.color-picker-section:nth-child(2) .text-swatch');
            expect(textSwatches.length).toBe(10); // 10 colors
        });

        it('renders background color swatches', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const bgSwatches = container.querySelectorAll('.color-picker-section:nth-child(3) .bg-swatch');
            expect(bgSwatches.length).toBe(10); // 10 colors
        });

        it('positions at given coordinates', () => {
            const { container } = render(
                <ColorPicker {...defaultProps} position={{ top: 200, left: 300 }} />
            );

            const picker = container.querySelector('.color-picker');
            expect(picker).toHaveStyle({ top: '200px', left: '300px' });
        });
    });

    describe('Text color selection', () => {
        it('calls onTextColorChange when text color is clicked', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const textSection = container.querySelectorAll('.color-picker-section')[1];
            const firstSwatch = textSection.querySelector('.text-swatch');
            fireEvent.click(firstSwatch);

            expect(defaultProps.onTextColorChange).toHaveBeenCalledWith('default');
        });

        it('applies active class to selected text color', () => {
            const { container } = render(
                <ColorPicker {...defaultProps} activeTextColor="blue" />
            );

            const blueTextSwatch = container.querySelector('.text-swatch.color-blue.active');
            expect(blueTextSwatch).toBeInTheDocument();
        });

        it('saves text color to recently used', () => {
            const { container, rerender } = render(<ColorPicker {...defaultProps} />);

            const textSection = container.querySelectorAll('.color-picker-section')[1];
            const redSwatch = textSection.querySelector('.color-red');
            fireEvent.click(redSwatch);

            // Rerender to see updated recently used
            rerender(<ColorPicker {...defaultProps} />);

            // Check localStorage
            const stored = JSON.parse(localStorage.getItem('colorPickerRecentlyUsed'));
            expect(stored).toContainEqual({ type: 'text', name: 'red' });
        });
    });

    describe('Background color selection', () => {
        it('calls onBgColorChange when background color is clicked', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const bgSection = container.querySelectorAll('.color-picker-section')[2];
            const firstSwatch = bgSection.querySelector('.bg-swatch');
            fireEvent.click(firstSwatch);

            expect(defaultProps.onBgColorChange).toHaveBeenCalledWith('default');
        });

        it('applies active class to selected background color', () => {
            const { container } = render(
                <ColorPicker {...defaultProps} activeBgColor="yellow" />
            );

            const yellowBgSwatch = container.querySelector('.bg-swatch.color-yellow.active');
            expect(yellowBgSwatch).toBeInTheDocument();
        });

        it('saves background color to recently used', () => {
            const { container, rerender } = render(<ColorPicker {...defaultProps} />);

            const bgSection = container.querySelectorAll('.color-picker-section')[2];
            const greenSwatch = bgSection.querySelector('.color-green');
            fireEvent.click(greenSwatch);

            // Rerender to see updated recently used
            rerender(<ColorPicker {...defaultProps} />);

            // Check localStorage
            const stored = JSON.parse(localStorage.getItem('colorPickerRecentlyUsed'));
            expect(stored).toContainEqual({ type: 'bg', name: 'green' });
        });
    });

    describe('Recently used colors', () => {
        it('displays recently used colors from localStorage', () => {
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'text', name: 'red' },
                { type: 'bg', name: 'blue' },
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            const recentSection = container.querySelector('.color-picker-section');
            const recentSwatches = recentSection.querySelectorAll('.color-picker-swatch');
            expect(recentSwatches.length).toBe(2);
        });

        it('calls correct handler when clicking recent text color', () => {
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'text', name: 'purple' },
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            const recentSection = container.querySelector('.color-picker-section');
            const recentSwatch = recentSection.querySelector('.color-picker-swatch');
            fireEvent.click(recentSwatch);

            expect(defaultProps.onTextColorChange).toHaveBeenCalledWith('purple');
        });

        it('calls correct handler when clicking recent background color', () => {
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'bg', name: 'orange' },
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            const recentSection = container.querySelector('.color-picker-section');
            const recentSwatch = recentSection.querySelector('.color-picker-swatch');
            fireEvent.click(recentSwatch);

            expect(defaultProps.onBgColorChange).toHaveBeenCalledWith('orange');
        });

        it('limits recently used to 5 colors', () => {
            // Add 6 colors to localStorage
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'text', name: 'red' },
                { type: 'text', name: 'blue' },
                { type: 'text', name: 'green' },
                { type: 'text', name: 'yellow' },
                { type: 'text', name: 'purple' },
                { type: 'text', name: 'orange' }, // This should be dropped
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            // Click a new color to trigger save
            const textSection = container.querySelectorAll('.color-picker-section')[1];
            const graySwatch = textSection.querySelector('.color-gray');
            fireEvent.click(graySwatch);

            const stored = JSON.parse(localStorage.getItem('colorPickerRecentlyUsed'));
            expect(stored.length).toBe(5);
            expect(stored[0]).toEqual({ type: 'text', name: 'gray' });
        });

        it('moves existing color to front when reselected', () => {
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'text', name: 'red' },
                { type: 'text', name: 'blue' },
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            const textSection = container.querySelectorAll('.color-picker-section')[1];
            const blueSwatch = textSection.querySelector('.color-blue');
            fireEvent.click(blueSwatch);

            const stored = JSON.parse(localStorage.getItem('colorPickerRecentlyUsed'));
            expect(stored[0]).toEqual({ type: 'text', name: 'blue' });
        });
    });

    describe('Keyboard navigation', () => {
        it('closes on Escape key', () => {
            render(<ColorPicker {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    describe('Event handling', () => {
        it('prevents default on mousedown to preserve selection', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const picker = container.querySelector('.color-picker');
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault');

            picker.dispatchEvent(mouseDownEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('stops propagation on color click', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const textSection = container.querySelectorAll('.color-picker-section')[1];
            const swatch = textSection.querySelector('.text-swatch');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

            swatch.dispatchEvent(clickEvent);

            expect(stopPropagationSpy).toHaveBeenCalled();
        });
    });

    describe('Color display', () => {
        it('shows "A" letter in text swatches', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const textSection = container.querySelectorAll('.color-picker-section')[1];
            const letters = textSection.querySelectorAll('.swatch-letter');
            expect(letters.length).toBe(10);
            expect(letters[0].textContent).toBe('A');
        });

        it('does not show letter in background swatches', () => {
            const { container } = render(<ColorPicker {...defaultProps} />);

            const bgSection = container.querySelectorAll('.color-picker-section')[2];
            const letters = bgSection.querySelectorAll('.swatch-letter');
            expect(letters.length).toBe(0);
        });

        it('shows "A" letter in recent text swatches', () => {
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'text', name: 'red' },
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            const recentSection = container.querySelector('.color-picker-section');
            const letter = recentSection.querySelector('.swatch-letter');
            expect(letter).toBeInTheDocument();
            expect(letter.textContent).toBe('A');
        });
    });

    describe('localStorage error handling', () => {
        it('handles corrupted localStorage gracefully', () => {
            localStorage.setItem('colorPickerRecentlyUsed', 'invalid json');

            // Should not throw
            expect(() => render(<ColorPicker {...defaultProps} />)).not.toThrow();
        });
    });

    describe('State initialization (regression)', () => {
        // Regression test: Bug fix - useState(getRecentlyUsed) was passing function reference
        // instead of calling it: useState(getRecentlyUsed())
        it('initializes state with actual localStorage values, not function reference', () => {
            // Pre-populate localStorage
            localStorage.setItem('colorPickerRecentlyUsed', JSON.stringify([
                { type: 'text', name: 'blue' },
                { type: 'bg', name: 'yellow' },
            ]));

            const { container } = render(<ColorPicker {...defaultProps} />);

            // Should render the actual colors from localStorage
            const recentSection = container.querySelector('.color-picker-section');
            const recentSwatches = recentSection.querySelectorAll('.color-picker-swatch');

            // If state was initialized with function reference, this would be 0
            expect(recentSwatches.length).toBe(2);

            // Verify the correct colors are shown
            expect(recentSection.querySelector('.color-blue')).toBeInTheDocument();
            expect(recentSection.querySelector('.color-yellow')).toBeInTheDocument();
        });

        it('shows empty state when localStorage is empty (not function reference)', () => {
            // Ensure localStorage is empty
            localStorage.removeItem('colorPickerRecentlyUsed');

            render(<ColorPicker {...defaultProps} />);

            // Should show empty message, not crash due to function reference
            expect(screen.getByText('No recent colors')).toBeInTheDocument();
        });
    });
});
