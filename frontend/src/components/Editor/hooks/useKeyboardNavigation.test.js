import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from './useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
    let mockState;
    let mockActions;
    let mockSlashMenu;
    let mockCloseSlashMenu;
    let mockCopyBlocksToClipboard;
    let mockCopySelectedTextToClipboard;
    let mockCutSelectedText;
    let mockPasteFromClipboard;
    let mockHandleKeyboardSelection;
    let mockGetSelectionForDeletion;
    let addEventListenerSpy;
    let removeEventListenerSpy;

    beforeEach(() => {
        mockState = {
            selectedBlockIds: [],
            textSelectionBlockIds: [],
        };

        mockActions = {
            selectAll: vi.fn(),
            deleteSelectedBlocks: vi.fn(),
            clearSelection: vi.fn(),
            clearTextSelection: vi.fn(),
        };

        mockSlashMenu = { isOpen: false };
        mockCloseSlashMenu = vi.fn();
        mockCopyBlocksToClipboard = vi.fn();
        mockCopySelectedTextToClipboard = vi.fn();
        mockCutSelectedText = vi.fn();
        mockPasteFromClipboard = vi.fn();
        mockHandleKeyboardSelection = vi.fn().mockReturnValue(false);
        mockGetSelectionForDeletion = vi.fn().mockReturnValue(null);

        addEventListenerSpy = vi.spyOn(document, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

        // Mock window.getSelection
        vi.spyOn(window, 'getSelection').mockReturnValue({
            removeAllRanges: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderNavigationHook = (overrides = {}) => {
        return renderHook(() =>
            useKeyboardNavigation({
                state: { ...mockState, ...overrides.state },
                actions: overrides.actions || mockActions,
                slashMenu: overrides.slashMenu || mockSlashMenu,
                closeSlashMenu: overrides.closeSlashMenu || mockCloseSlashMenu,
                copyBlocksToClipboard: overrides.copyBlocksToClipboard || mockCopyBlocksToClipboard,
                copySelectedTextToClipboard: overrides.copySelectedTextToClipboard || mockCopySelectedTextToClipboard,
                cutSelectedText: overrides.cutSelectedText || mockCutSelectedText,
                pasteFromClipboard: overrides.pasteFromClipboard || mockPasteFromClipboard,
                handleKeyboardSelection: overrides.handleKeyboardSelection || mockHandleKeyboardSelection,
                getSelectionForDeletion: overrides.getSelectionForDeletion || mockGetSelectionForDeletion,
                readOnly: overrides.readOnly || false,
            })
        );
    };

    const createKeyboardEvent = (key, options = {}) => {
        return new KeyboardEvent('keydown', {
            key,
            metaKey: options.metaKey || false,
            ctrlKey: options.ctrlKey || false,
            shiftKey: options.shiftKey || false,
            bubbles: true,
            cancelable: true,
        });
    };

    it('attaches keydown event listener on mount', () => {
        renderNavigationHook();
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('removes keydown event listener on unmount', () => {
        const { unmount } = renderNavigationHook();
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('copies selected blocks on Cmd+C', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1', 'block-2'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('c', { metaKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockCopyBlocksToClipboard).toHaveBeenCalledWith(['block-1', 'block-2'], false);
    });

    it('copies text selection blocks on Ctrl+C', () => {
        // Mock window.getSelection to return a non-collapsed selection
        vi.spyOn(window, 'getSelection').mockReturnValue({
            isCollapsed: false,
            toString: () => 'selected text',
            removeAllRanges: vi.fn(),
        });

        renderNavigationHook({
            state: { selectedBlockIds: [], textSelectionBlockIds: ['block-3'] },
        });

        const event = createKeyboardEvent('c', { ctrlKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockCopySelectedTextToClipboard).toHaveBeenCalledWith(false);
    });

    it('cuts selected blocks on Cmd+X', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('x', { metaKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockCopyBlocksToClipboard).toHaveBeenCalledWith(['block-1'], true);
    });

    it('pastes on Cmd+Shift+V as plain text', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('v', { metaKey: true, shiftKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockPasteFromClipboard).toHaveBeenCalledWith(true);
    });

    it('pastes structured blocks on Cmd+V with selection', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1'], textSelectionBlockIds: [] },
        });

        // Mock document.activeElement to not be in contentEditable
        Object.defineProperty(document, 'activeElement', {
            value: { closest: vi.fn().mockReturnValue(null) },
            configurable: true,
        });

        const event = createKeyboardEvent('v', { metaKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockPasteFromClipboard).toHaveBeenCalledWith(false);
    });

    it('selects all when blocks already selected on Cmd+A', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('a', { metaKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockActions.selectAll).toHaveBeenCalled();
    });

    it('deletes selected blocks on Backspace', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1', 'block-2'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('Backspace');
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockActions.deleteSelectedBlocks).toHaveBeenCalled();
    });

    it('deletes selected blocks on Delete', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('Delete');
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockActions.deleteSelectedBlocks).toHaveBeenCalled();
    });

    it('closes slash menu on Escape when menu is open', () => {
        renderNavigationHook({
            slashMenu: { isOpen: true },
        });

        const event = createKeyboardEvent('Escape');
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockCloseSlashMenu).toHaveBeenCalled();
    });

    it('clears selection on Escape when blocks are selected', () => {
        renderNavigationHook({
            state: { selectedBlockIds: ['block-1'], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('Escape');
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockActions.clearSelection).toHaveBeenCalled();
    });

    it('clears text selection on Escape when text is selected', () => {
        const getSelectionMock = vi.spyOn(window, 'getSelection').mockReturnValue({
            removeAllRanges: vi.fn(),
        });

        renderNavigationHook({
            state: { selectedBlockIds: [], textSelectionBlockIds: ['block-1'] },
        });

        const event = createKeyboardEvent('Escape');
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockActions.clearTextSelection).toHaveBeenCalled();
        expect(getSelectionMock().removeAllRanges).toHaveBeenCalled();
    });

    it('does not copy when no blocks selected', () => {
        renderNavigationHook({
            state: { selectedBlockIds: [], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('c', { metaKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockCopyBlocksToClipboard).not.toHaveBeenCalled();
    });

    it('always intercepts paste to ensure block structure preservation', () => {
        // Even without any selections, paste should be intercepted
        renderNavigationHook({
            state: { selectedBlockIds: [], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('v', { metaKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        // Paste should always be called to maintain block structure
        expect(mockPasteFromClipboard).toHaveBeenCalledWith(false);
    });

    it('uses plain text paste with Ctrl+Shift+V', () => {
        renderNavigationHook({
            state: { selectedBlockIds: [], textSelectionBlockIds: [] },
        });

        const event = createKeyboardEvent('v', { ctrlKey: true, shiftKey: true });
        const handler = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'keydown'
        )[1];

        handler(event);

        expect(mockPasteFromClipboard).toHaveBeenCalledWith(true);
    });

    describe('undo/redo handlers', () => {
        it('calls undo on Cmd+Z', () => {
            const undoMock = vi.fn();
            renderNavigationHook({
                actions: { ...mockActions, undo: undoMock },
            });

            const event = createKeyboardEvent('z', { metaKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(undoMock).toHaveBeenCalled();
        });

        it('calls undo on Ctrl+Z', () => {
            const undoMock = vi.fn();
            renderNavigationHook({
                actions: { ...mockActions, undo: undoMock },
            });

            const event = createKeyboardEvent('z', { ctrlKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(undoMock).toHaveBeenCalled();
        });

        it('calls redo on Cmd+Shift+Z', () => {
            const redoMock = vi.fn();
            renderNavigationHook({
                actions: { ...mockActions, redo: redoMock },
            });

            const event = createKeyboardEvent('z', { metaKey: true, shiftKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(redoMock).toHaveBeenCalled();
        });

        it('calls redo on Ctrl+Shift+Z', () => {
            const redoMock = vi.fn();
            renderNavigationHook({
                actions: { ...mockActions, redo: redoMock },
            });

            const event = createKeyboardEvent('z', { ctrlKey: true, shiftKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(redoMock).toHaveBeenCalled();
        });

        it('calls redo on Ctrl+Y', () => {
            const redoMock = vi.fn();
            renderNavigationHook({
                actions: { ...mockActions, redo: redoMock },
            });

            const event = createKeyboardEvent('y', { ctrlKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(redoMock).toHaveBeenCalled();
        });

        it('does not call undo when undo action is not available', () => {
            renderNavigationHook({
                actions: { ...mockActions, undo: undefined },
            });

            const event = createKeyboardEvent('z', { metaKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            // Should not throw
            expect(() => handler(event)).not.toThrow();
        });
    });

    describe('readOnly mode', () => {
        it('blocks paste when readOnly is true', () => {
            renderNavigationHook({
                readOnly: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();
        });

        it('blocks paste with Ctrl+V when readOnly is true', () => {
            renderNavigationHook({
                readOnly: true,
            });

            const event = createKeyboardEvent('v', { ctrlKey: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();
        });

        it('blocks paste with Shift+V when readOnly is true', () => {
            renderNavigationHook({
                readOnly: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true, shiftKey: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();
        });

        it('allows paste when readOnly is false', () => {
            renderNavigationHook({
                readOnly: false,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(mockPasteFromClipboard).toHaveBeenCalled();
        });

        it('allows paste when readOnly is not specified (defaults to false)', () => {
            renderNavigationHook({});

            const event = createKeyboardEvent('v', { metaKey: true });
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            expect(mockPasteFromClipboard).toHaveBeenCalled();
        });
    });

    describe('paste bypass for inputs and popovers', () => {
        it('allows native paste in INPUT elements', () => {
            renderNavigationHook();

            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            document.body.appendChild(inputEl);

            Object.defineProperty(document, 'activeElement', {
                value: inputEl,
                configurable: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            Object.defineProperty(event, 'target', { value: inputEl, configurable: true });

            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            // Should NOT call pasteFromClipboard and NOT prevent default
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();

            document.body.removeChild(inputEl);
        });

        it('allows native paste in TEXTAREA elements', () => {
            renderNavigationHook();

            const textareaEl = document.createElement('textarea');
            document.body.appendChild(textareaEl);

            Object.defineProperty(document, 'activeElement', {
                value: textareaEl,
                configurable: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            Object.defineProperty(event, 'target', { value: textareaEl, configurable: true });

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            // Should NOT call pasteFromClipboard
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();

            document.body.removeChild(textareaEl);
        });

        it('allows native paste inside link-popover', () => {
            renderNavigationHook();

            const popoverEl = document.createElement('div');
            popoverEl.className = 'link-popover';
            const inputEl = document.createElement('input');
            inputEl.className = 'link-popover-input';
            popoverEl.appendChild(inputEl);
            document.body.appendChild(popoverEl);

            // Mock closest to return the popover
            inputEl.closest = vi.fn((selector) => {
                if (selector === '.link-popover') return popoverEl;
                return null;
            });

            Object.defineProperty(document, 'activeElement', {
                value: inputEl,
                configurable: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            Object.defineProperty(event, 'target', { value: inputEl, configurable: true });

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            // Should NOT call pasteFromClipboard
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();

            document.body.removeChild(popoverEl);
        });

        it('allows native paste inside slash-command-menu', () => {
            renderNavigationHook();

            const menuEl = document.createElement('div');
            menuEl.className = 'slash-command-menu';
            const inputEl = document.createElement('input');
            menuEl.appendChild(inputEl);
            document.body.appendChild(menuEl);

            inputEl.closest = vi.fn((selector) => {
                if (selector === '.slash-command-menu') return menuEl;
                return null;
            });

            Object.defineProperty(document, 'activeElement', {
                value: inputEl,
                configurable: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            Object.defineProperty(event, 'target', { value: inputEl, configurable: true });

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            // Should NOT call pasteFromClipboard
            expect(mockPasteFromClipboard).not.toHaveBeenCalled();

            document.body.removeChild(menuEl);
        });

        it('intercepts paste for regular editor content', () => {
            renderNavigationHook();

            const blockEl = document.createElement('div');
            blockEl.setAttribute('contenteditable', 'true');
            blockEl.setAttribute('data-block-id', 'block-1');
            document.body.appendChild(blockEl);

            // Mock activeElement to be a content block (not input or popover)
            blockEl.closest = vi.fn().mockReturnValue(null);
            Object.defineProperty(document, 'activeElement', {
                value: blockEl,
                configurable: true,
            });

            const event = createKeyboardEvent('v', { metaKey: true });
            Object.defineProperty(event, 'target', { value: blockEl, configurable: true });

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'keydown'
            )[1];

            handler(event);

            // Should call pasteFromClipboard
            expect(mockPasteFromClipboard).toHaveBeenCalledWith(false);

            document.body.removeChild(blockEl);
        });
    });
});
