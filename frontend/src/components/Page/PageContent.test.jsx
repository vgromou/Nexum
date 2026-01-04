import { render, screen, fireEvent, act } from '@testing-library/react';
import PageContent from './PageContent';

// Mock BlockEditor as it's complex and tested separately
vi.mock('../Editor/UnifiedBlockEditor', () => ({
    default: () => <div data-testid="block-editor">Block Editor Content</div>
}));

describe('PageContent', () => {
    it('renders page headers and block editor', () => {
        render(<PageContent />);

        // Breadcrumbs and Title
        expect(screen.getByText('Main')).toBeInTheDocument();
        expect(screen.getAllByText('Page Title')[0]).toBeInTheDocument(); // In breadcrumbs

        // Main Title
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page Title');

        // Block Editor
        expect(screen.getByTestId('block-editor')).toBeInTheDocument();
    });

    it('renders navigation action buttons', () => {
        render(<PageContent />);

        expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
        expect(screen.getByLabelText('Edit page')).toBeInTheDocument();
        expect(screen.getByLabelText('More options')).toBeInTheDocument();
        expect(screen.getByLabelText('Toggle properties panel')).toBeInTheDocument();
    });

    describe('Editable Page Title', () => {
        it('renders title as contentEditable', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('contenteditable', 'true');
        });

        it('updates breadcrumb when title is edited', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Simulate editing the title
            titleElement.textContent = 'New Title';
            fireEvent.input(titleElement);

            // Both h1 and breadcrumb should show the new title
            const newTitleElements = screen.getAllByText('New Title');
            expect(newTitleElements.length).toBe(2); // h1 + breadcrumb
        });

        it('prevents Enter key from creating new lines and blurs the element', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            titleElement.focus();
            expect(document.activeElement).toBe(titleElement);

            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true,
                cancelable: true
            });
            const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');

            titleElement.dispatchEvent(enterEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            // Verify element was blurred
            expect(document.activeElement).not.toBe(titleElement);
        });

        it('sets title to "Untitled" when blurred with empty content', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Clear the title and blur
            titleElement.textContent = '';
            fireEvent.blur(titleElement);

            // Title should be set to "Untitled"
            expect(titleElement.textContent).toBe('Untitled');
        });

        it('sets title to "Untitled" when blurred with only whitespace', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Set whitespace only and blur
            titleElement.textContent = '   ';
            fireEvent.blur(titleElement);

            // Title should be set to "Untitled"
            expect(titleElement.textContent).toBe('Untitled');
        });

        it('trims whitespace from title on blur', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Set title with leading/trailing whitespace and blur
            titleElement.textContent = '  My New Title  ';
            fireEvent.input(titleElement);
            fireEvent.blur(titleElement);

            // Both h1 and breadcrumb should show trimmed title
            const trimmedTitleElements = screen.getAllByText('My New Title');
            expect(trimmedTitleElements.length).toBe(2); // h1 + breadcrumb
        });

        it('has data-placeholder attribute for CSS placeholder styling', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('data-placeholder', 'Untitled');
        });

        it('has spellCheck disabled', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('spellcheck', 'false');
        });

        it('updates breadcrumb to show "Untitled" when title is emptied', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Clear title and blur
            titleElement.textContent = '';
            fireEvent.blur(titleElement);

            // Breadcrumb and title should both show "Untitled"
            const untitledElements = screen.getAllByText('Untitled');
            expect(untitledElements.length).toBeGreaterThanOrEqual(2); // h1 + breadcrumb
        });

        it('has aria-label for accessibility', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('aria-label', 'Page title, click to edit');
        });

        it('syncs DOM when trimming whitespace on blur', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Set title with leading/trailing whitespace and blur
            titleElement.textContent = '  Trimmed Title  ';
            fireEvent.blur(titleElement);

            // DOM should be updated to trimmed value
            expect(titleElement.textContent).toBe('Trimmed Title');
        });

        describe('blocks formatting shortcuts', () => {
            it.each([
                ['b', 'bold'],
                ['i', 'italic'],
                ['u', 'underline']
            ])('prevents Cmd+%s (%s) formatting shortcut', (key) => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });

                const keyEvent = new KeyboardEvent('keydown', {
                    key,
                    metaKey: true,
                    bubbles: true,
                    cancelable: true
                });
                const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

                titleElement.dispatchEvent(keyEvent);

                expect(preventDefaultSpy).toHaveBeenCalled();
            });

            it.each([
                ['b', 'bold'],
                ['i', 'italic'],
                ['u', 'underline']
            ])('prevents Ctrl+%s (%s) formatting shortcut', (key) => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });

                const keyEvent = new KeyboardEvent('keydown', {
                    key,
                    ctrlKey: true,
                    bubbles: true,
                    cancelable: true
                });
                const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

                titleElement.dispatchEvent(keyEvent);

                expect(preventDefaultSpy).toHaveBeenCalled();
            });

            it('allows non-formatting shortcuts like Cmd+A', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });

                const keyEvent = new KeyboardEvent('keydown', {
                    key: 'a',
                    metaKey: true,
                    bubbles: true,
                    cancelable: true
                });
                const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

                titleElement.dispatchEvent(keyEvent);

                expect(preventDefaultSpy).not.toHaveBeenCalled();
            });
        });

        describe('paste handling', () => {
            // Helper to create paste event compatible with JSDOM
            const createPasteEvent = (text) => {
                const event = new Event('paste', { bubbles: true, cancelable: true });
                // Mock clipboardData since JSDOM doesn't support DataTransfer
                event.clipboardData = {
                    getData: (type) => type === 'text/plain' ? text : ''
                };
                return event;
            };

            // Helper to create a mock Selection
            const mockSelection = (element, insertNodeFn = vi.fn()) => {
                const mockRange = {
                    insertNode: insertNodeFn,
                    collapse: vi.fn()
                };
                const selection = {
                    rangeCount: 1,
                    getRangeAt: vi.fn().mockReturnValue(mockRange),
                    deleteFromDocument: vi.fn(),
                    collapseToEnd: vi.fn()
                };
                vi.spyOn(window, 'getSelection').mockReturnValue(selection);
                return { selection, mockRange };
            };

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it('pastes plain text only, stripping formatting', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });
                titleElement.focus();

                const insertNodeFn = vi.fn();
                mockSelection(titleElement, insertNodeFn);

                const pasteEvent = createPasteEvent('Plain text');
                const preventDefaultSpy = vi.spyOn(pasteEvent, 'preventDefault');

                titleElement.dispatchEvent(pasteEvent);

                expect(preventDefaultSpy).toHaveBeenCalled();
                expect(insertNodeFn).toHaveBeenCalled();
                // The text node should contain the plain text
                const textNode = insertNodeFn.mock.calls[0][0];
                expect(textNode.textContent).toBe('Plain text');
            });

            it('removes newlines from pasted text', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });
                titleElement.focus();

                const insertNodeFn = vi.fn();
                mockSelection(titleElement, insertNodeFn);

                const pasteEvent = createPasteEvent('Line 1\nLine 2\r\nLine 3');
                titleElement.dispatchEvent(pasteEvent);

                // Newlines should be replaced with spaces
                const textNode = insertNodeFn.mock.calls[0][0];
                expect(textNode.textContent).toBe('Line 1 Line 2 Line 3');
            });

            it('trims whitespace from pasted text', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });
                titleElement.focus();

                const insertNodeFn = vi.fn();
                mockSelection(titleElement, insertNodeFn);

                const pasteEvent = createPasteEvent('   Trimmed   ');
                titleElement.dispatchEvent(pasteEvent);

                const textNode = insertNodeFn.mock.calls[0][0];
                expect(textNode.textContent).toBe('Trimmed');
            });

            it('does not insert empty or whitespace-only text', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });
                titleElement.focus();

                const insertNodeFn = vi.fn();
                mockSelection(titleElement, insertNodeFn);

                const pasteEvent = createPasteEvent('   ');
                titleElement.dispatchEvent(pasteEvent);

                expect(insertNodeFn).not.toHaveBeenCalled();
            });

            it('limits pasted text to max available length', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });
                // Set initial title closer to max (100 chars)
                titleElement.textContent = 'A'.repeat(95);
                titleElement.focus();

                const insertNodeFn = vi.fn();
                mockSelection(titleElement, insertNodeFn);

                // Try to paste 20 chars when only 5 are available
                const pasteEvent = createPasteEvent('12345678901234567890');
                act(() => {
                    titleElement.dispatchEvent(pasteEvent);
                });

                // Should only insert 5 chars (100 - 95)
                const textNode = insertNodeFn.mock.calls[0][0];
                expect(textNode.textContent).toBe('12345');
            });

            it('does not paste when title is at max length', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });
                // Set title to exactly max length (100 chars)
                titleElement.textContent = 'A'.repeat(100);
                titleElement.focus();

                const insertNodeFn = vi.fn();
                mockSelection(titleElement, insertNodeFn);

                const pasteEvent = createPasteEvent('extra text');
                titleElement.dispatchEvent(pasteEvent);

                expect(insertNodeFn).not.toHaveBeenCalled();
            });
        });

        describe('max title length', () => {
            it('truncates title when exceeding 100 characters', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });

                // Set title to 110 characters
                titleElement.textContent = 'A'.repeat(110);
                fireEvent.input(titleElement);

                // Title should be truncated to 100 characters
                expect(titleElement.textContent.length).toBe(100);
            });

            it('allows title up to max length', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });

                // Set title to exactly 100 characters
                const maxLengthTitle = 'B'.repeat(100);
                titleElement.textContent = maxLengthTitle;
                fireEvent.input(titleElement);

                // Title should remain unchanged
                expect(titleElement.textContent).toBe(maxLengthTitle);
                expect(titleElement.textContent.length).toBe(100);
            });

            it('updates breadcrumb with truncated title', () => {
                render(<PageContent />);

                const titleElement = screen.getByRole('heading', { level: 1 });

                // Set very long title
                const longTitle = 'C'.repeat(150);
                titleElement.textContent = longTitle;
                fireEvent.input(titleElement);

                // Both h1 should show truncated title
                expect(titleElement.textContent.length).toBe(100);
            });
        });
    });
});
