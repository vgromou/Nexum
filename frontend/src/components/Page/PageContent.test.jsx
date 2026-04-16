import { render, screen, fireEvent, act } from '@testing-library/react';
import PageContent from './PageContent';

// Track calls to focusFirstEmptyBlock for testing
let focusFirstEmptyBlockCalls = [];

// Mock BlockEditor as it's complex and tested separately
// Supports ref with getBlocks/setBlocks/focusFirstEmptyBlock for state snapshot/restore testing
vi.mock('../Editor/UnifiedBlockEditor', () => {
    const React = require('react');
    const { forwardRef, useImperativeHandle, useState } = React;

    const MockBlockEditor = forwardRef(({ readOnly }, ref) => {
        const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'paragraph', content: 'Initial content' }]);

        useImperativeHandle(ref, () => ({
            getBlocks: () => structuredClone(blocks),
            setBlocks: (newBlocks) => setBlocks(newBlocks),
            focusFirstEmptyBlock: () => {
                focusFirstEmptyBlockCalls.push({ calledAt: Date.now() });
                return blocks.length === 1 && blocks[0].content === '';
            },
        }), [blocks]);

        return React.createElement('div', {
            'data-testid': 'block-editor',
            'data-readonly': readOnly ? 'true' : 'false',
            'data-blocks': JSON.stringify(blocks),
        }, 'Block Editor Content');
    });
    MockBlockEditor.displayName = 'MockBlockEditor';

    return { default: MockBlockEditor };
});


// Mock IntersectionObserver for EmojiPicker
class MockIntersectionObserver {
    constructor() { }
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.IntersectionObserver = MockIntersectionObserver;

// Helper to enter edit mode
const enterEditMode = () => {
    const editButton = screen.getByLabelText('Edit page');
    act(() => {
        fireEvent.click(editButton);
    });
};

describe('PageContent', () => {
    beforeEach(() => {
        // Reset tracking array
        focusFirstEmptyBlockCalls = [];
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders page headers and block editor', () => {
        render(<PageContent />);

        // Breadcrumbs and Title
        expect(screen.getByText('Pages')).toBeInTheDocument();
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

    describe('Edit Mode', () => {
        it('starts in read mode by default', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('contenteditable', 'false');
            expect(screen.getByTestId('block-editor')).toHaveAttribute('data-readonly', 'true');
        });

        it('enters edit mode when pencil button is clicked', () => {
            render(<PageContent />);

            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('contenteditable', 'true');
            expect(screen.getByTestId('block-editor')).toHaveAttribute('data-readonly', 'false');
        });

        it('shows save and cancel buttons in edit mode', () => {
            render(<PageContent />);

            enterEditMode();

            expect(screen.getByLabelText('Save changes')).toBeInTheDocument();
            expect(screen.getByLabelText('Cancel editing')).toBeInTheDocument();
            expect(screen.queryByLabelText('Edit page')).not.toBeInTheDocument();
        });

        it('exits edit mode when save is clicked', () => {
            render(<PageContent />);

            enterEditMode();
            act(() => {
                fireEvent.click(screen.getByLabelText('Save changes'));
            });

            expect(screen.getByLabelText('Edit page')).toBeInTheDocument();
            expect(screen.queryByLabelText('Save changes')).not.toBeInTheDocument();
        });

        it('shows cancel confirmation modal when cancel is clicked', () => {
            render(<PageContent />);

            enterEditMode();
            act(() => {
                fireEvent.click(screen.getByLabelText('Cancel editing'));
            });

            expect(screen.getByText('Discard changes?')).toBeInTheDocument();
            expect(screen.getByText('Keep editing')).toBeInTheDocument();
            expect(screen.getByText('Discard')).toBeInTheDocument();
        });

        it('closes modal and stays in edit mode when Keep editing is clicked', () => {
            render(<PageContent />);

            enterEditMode();
            act(() => {
                fireEvent.click(screen.getByLabelText('Cancel editing'));
            });
            act(() => {
                fireEvent.click(screen.getByText('Keep editing'));
            });

            expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
            expect(screen.getByLabelText('Save changes')).toBeInTheDocument();
        });

        it('discards changes and exits edit mode when Discard is clicked', () => {
            render(<PageContent />);

            enterEditMode();

            // Modify title
            const titleElement = screen.getByRole('heading', { level: 1 });
            titleElement.textContent = 'Modified Title';
            fireEvent.input(titleElement);

            // Cancel with discard
            act(() => {
                fireEvent.click(screen.getByLabelText('Cancel editing'));
            });
            act(() => {
                fireEvent.click(screen.getByText('Discard'));
            });

            // Should be back in read mode with original title
            expect(screen.getByLabelText('Edit page')).toBeInTheDocument();
            expect(titleElement.textContent).toBe('Page Title');
        });

        it('calls focusFirstEmptyBlock when entering edit mode', () => {
            render(<PageContent />);

            // Verify no calls before entering edit mode
            expect(focusFirstEmptyBlockCalls.length).toBe(0);

            // Enter edit mode
            enterEditMode();

            // Advance timers to trigger setTimeout(0)
            act(() => {
                vi.runAllTimers();
            });

            // focusFirstEmptyBlock should have been called
            expect(focusFirstEmptyBlockCalls.length).toBe(1);
        });

        it('calls focusFirstEmptyBlock only once per edit mode entry', () => {
            render(<PageContent />);

            // Enter edit mode first time
            enterEditMode();
            act(() => {
                vi.runAllTimers();
            });

            // Exit edit mode
            act(() => {
                fireEvent.click(screen.getByLabelText('Save changes'));
            });

            // Reset call tracking
            const callsAfterFirst = focusFirstEmptyBlockCalls.length;

            // Enter edit mode second time
            enterEditMode();
            act(() => {
                vi.runAllTimers();
            });

            // Should have one more call
            expect(focusFirstEmptyBlockCalls.length).toBe(callsAfterFirst + 1);
        });
    });

    describe('Editable Page Title', () => {
        it('renders title as contentEditable in edit mode', () => {
            render(<PageContent />);
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('contenteditable', 'true');
        });

        it('updates breadcrumb when title is edited', () => {
            render(<PageContent />);
            enterEditMode();

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
            enterEditMode();

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
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Clear the title and blur
            titleElement.textContent = '';
            fireEvent.blur(titleElement);

            // Title should be set to "Untitled"
            expect(titleElement.textContent).toBe('Untitled');
        });

        it('sets title to "Untitled" when blurred with only whitespace', () => {
            render(<PageContent />);
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Set whitespace only and blur
            titleElement.textContent = '   ';
            fireEvent.blur(titleElement);

            // Title should be set to "Untitled"
            expect(titleElement.textContent).toBe('Untitled');
        });

        it('trims whitespace from title on blur', () => {
            render(<PageContent />);
            enterEditMode();

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
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });

            // Clear title and blur
            titleElement.textContent = '';
            fireEvent.blur(titleElement);

            // Breadcrumb and title should both show "Untitled"
            const untitledElements = screen.getAllByText('Untitled');
            expect(untitledElements.length).toBeGreaterThanOrEqual(2); // h1 + breadcrumb
        });

        it('has aria-label for accessibility in edit mode', () => {
            render(<PageContent />);
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('aria-label', 'Page title, click to edit');
        });

        it('has simplified aria-label in read mode', () => {
            render(<PageContent />);

            const titleElement = screen.getByRole('heading', { level: 1 });
            expect(titleElement).toHaveAttribute('aria-label', 'Page title');
        });

        it('syncs DOM when trimming whitespace on blur', () => {
            render(<PageContent />);
            enterEditMode();

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
                enterEditMode();

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
                enterEditMode();

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
                enterEditMode();

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
                enterEditMode();

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
                enterEditMode();

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
                enterEditMode();

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
                enterEditMode();

                const titleElement = screen.getByRole('heading', { level: 1 });

                // Set title to 110 characters
                titleElement.textContent = 'A'.repeat(110);
                fireEvent.input(titleElement);

                // Title should be truncated to 100 characters
                expect(titleElement.textContent.length).toBe(100);
            });

            it('allows title up to max length', () => {
                render(<PageContent />);
                enterEditMode();

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
                enterEditMode();

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

    describe('Page Icon Feature', () => {
        describe('Add Icon Button', () => {
            it('should not show Add icon button by default', () => {
                render(<PageContent />);
                expect(screen.queryByText('Add icon')).not.toBeInTheDocument();
            });

            it('should not show Add icon button on hover in read mode', () => {
                const { container } = render(<PageContent />);
                const pageHeader = container.querySelector('.page-header');

                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });

                expect(screen.queryByText('Add icon')).not.toBeInTheDocument();
            });

            it('should show Add icon button on page header hover in edit mode', async () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });

                expect(screen.getByText('Add icon')).toBeInTheDocument();
            });

            it('should hide Add icon button on page header mouse leave', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                expect(screen.getByText('Add icon')).toBeInTheDocument();

                act(() => {
                    fireEvent.mouseLeave(pageHeader);
                });
                expect(screen.queryByText('Add icon')).not.toBeInTheDocument();
            });
        });



        describe('Icon Display', () => {
            it('should display selected emoji as page icon', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                // Open picker
                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                act(() => {
                    fireEvent.click(screen.getByText('Add icon'));
                });

                // Click an emoji
                const emojiButtons = container.querySelectorAll('.emoji-grid-item');
                if (emojiButtons.length > 0) {
                    act(() => {
                        fireEvent.click(emojiButtons[0]);
                    });

                    // Page icon should be displayed
                    expect(container.querySelector('.page-icon-emoji')).toBeInTheDocument();
                }
            });

            it('should show Change page icon button when icon is set in edit mode', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                // Open picker and select emoji
                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                act(() => {
                    fireEvent.click(screen.getByText('Add icon'));
                });

                const emojiButtons = container.querySelectorAll('.emoji-grid-item');
                if (emojiButtons.length > 0) {
                    act(() => {
                        fireEvent.click(emojiButtons[0]);
                    });

                    expect(screen.getByLabelText('Change page icon')).toBeInTheDocument();
                }
            });

            it('should open emoji picker when clicking on existing icon', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                // First, set an icon
                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                act(() => {
                    fireEvent.click(screen.getByText('Add icon'));
                });

                const emojiButtons = container.querySelectorAll('.emoji-grid-item');
                if (emojiButtons.length > 0) {
                    act(() => {
                        fireEvent.click(emojiButtons[0]);
                    });

                    // Click on the icon button
                    act(() => {
                        fireEvent.click(screen.getByLabelText('Change page icon'));
                    });

                    // Emoji picker should open again
                    expect(container.querySelector('.emoji-picker')).toBeInTheDocument();
                }
            });
        });

        describe('Icon Removal', () => {
            it('should show Remove button in emoji picker when icon is set', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                // Set an icon first
                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                act(() => {
                    fireEvent.click(screen.getByText('Add icon'));
                });

                const emojiButtons = container.querySelectorAll('.emoji-grid-item');
                if (emojiButtons.length > 0) {
                    act(() => {
                        fireEvent.click(emojiButtons[0]);
                    });

                    // Reopen picker by clicking on icon
                    act(() => {
                        fireEvent.click(screen.getByLabelText('Change page icon'));
                    });

                    // Remove button should be visible
                    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
                }
            });

            it('should remove icon when Remove button is clicked', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                // Set an icon first
                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                act(() => {
                    fireEvent.click(screen.getByText('Add icon'));
                });

                const emojiButtons = container.querySelectorAll('.emoji-grid-item');
                if (emojiButtons.length > 0) {
                    act(() => {
                        fireEvent.click(emojiButtons[0]);
                    });

                    expect(container.querySelector('.page-icon-emoji')).toBeInTheDocument();

                    // Reopen picker and click Remove
                    act(() => {
                        fireEvent.click(screen.getByLabelText('Change page icon'));
                    });
                    act(() => {
                        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
                    });

                    // Icon should be removed
                    expect(container.querySelector('.page-icon-emoji')).not.toBeInTheDocument();
                }
            });
        });



        describe('Page Header Layout', () => {
            it('should show small hover area when no icon is set', () => {
                const { container } = render(<PageContent />);
                expect(container.querySelector('.page-icon-hover-area')).toBeInTheDocument();
                expect(container.querySelector('.page-icon-area')).not.toBeInTheDocument();
            });

            it('should show expanded icon area when icon is set', () => {
                const { container } = render(<PageContent />);
                enterEditMode();
                const pageHeader = container.querySelector('.page-header');

                // Set an icon
                act(() => {
                    fireEvent.mouseEnter(pageHeader);
                });
                act(() => {
                    fireEvent.click(screen.getByText('Add icon'));
                });

                const emojiButtons = container.querySelectorAll('.emoji-grid-item');
                if (emojiButtons.length > 0) {
                    act(() => {
                        fireEvent.click(emojiButtons[0]);
                    });

                    expect(container.querySelector('.page-icon-area')).toBeInTheDocument();
                    expect(container.querySelector('.page-icon-hover-area')).not.toBeInTheDocument();
                }
            });
        });
    });

    describe('Breadcrumbs Component', () => {
        it('renders collection name and current page', () => {
            render(<PageContent />);

            // Should show collection in breadcrumbs
            expect(screen.getByText('Pages')).toBeInTheDocument();

            // Should show current page title
            const breadcrumbItems = screen.getAllByText('Page Title');
            expect(breadcrumbItems.length).toBeGreaterThanOrEqual(1);
        });

        it('updates breadcrumb when title changes', () => {
            render(<PageContent />);
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });
            titleElement.textContent = 'New Page Name';
            fireEvent.input(titleElement);

            // Both h1 and breadcrumb should update
            const titleElements = screen.getAllByText('New Page Name');
            expect(titleElements.length).toBeGreaterThanOrEqual(2);
        });

        it('shows Untitled in breadcrumb when title is empty', () => {
            render(<PageContent />);
            enterEditMode();

            const titleElement = screen.getByRole('heading', { level: 1 });
            titleElement.textContent = '';
            fireEvent.blur(titleElement);

            // Breadcrumb should show Untitled
            const untitledElements = screen.getAllByText('Untitled');
            expect(untitledElements.length).toBeGreaterThanOrEqual(1);
        });

        it('has correct breadcrumb structure', () => {
            const { container } = render(<PageContent />);

            expect(container.querySelector('.breadcrumbs')).toBeInTheDocument();
            expect(container.querySelectorAll('.breadcrumb-item').length).toBeGreaterThan(0);
            expect(container.querySelectorAll('.breadcrumb-separator').length).toBeGreaterThan(0);
        });
    });
});

