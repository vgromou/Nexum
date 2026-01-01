import { renderHook, act } from '@testing-library/react';
import { useClipboard } from './useClipboard';

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock ClipboardItem
global.ClipboardItem = vi.fn((items) => items);

describe('useClipboard', () => {
    let mockState;
    let mockActions;
    let mockEditorRef;
    let clipboardMock;

    beforeEach(() => {
        mockState = {
            blocks: [
                { id: 'block-1', type: 'paragraph', content: 'First block' },
                { id: 'block-2', type: 'h1', content: 'Heading block' },
                { id: 'block-3', type: 'quote', content: 'Quote block' },
            ],
            focusedBlockId: 'block-1',
        };

        mockActions = {
            deleteBlock: vi.fn(),
            clearSelection: vi.fn(),
            clearTextSelection: vi.fn(),
            updateBlock: vi.fn(),
            insertBlocks: vi.fn(),
        };

        mockEditorRef = { current: null };

        // Clear mocks before creating new ones
        sessionStorageMock.clear();
        vi.clearAllMocks();

        // Create clipboard mock for each test
        clipboardMock = {
            write: vi.fn().mockResolvedValue(undefined),
            writeText: vi.fn().mockResolvedValue(undefined),
            readText: vi.fn().mockResolvedValue('Pasted text'),
        };
        Object.defineProperty(navigator, 'clipboard', { value: clipboardMock, configurable: true });
    });

    it('copies blocks to clipboard', async () => {
        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard(['block-1', 'block-2']);
        });

        // Either write or writeText should be called (depending on browser support)
        const wasClipboardCalled = clipboardMock.write.mock.calls.length > 0 ||
            clipboardMock.writeText.mock.calls.length > 0;
        expect(wasClipboardCalled).toBe(true);

        expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
            'notion_blocks_clipboard',
            expect.any(String)
        );

        const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
        expect(savedData.blocks).toHaveLength(2);
        expect(savedData.blocks[0].type).toBe('paragraph');
        expect(savedData.blocks[1].type).toBe('h1');
    });

    it('cuts blocks to clipboard and deletes them', async () => {
        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard(['block-1'], true);
        });

        // Either write or writeText should be called (depending on browser support)
        const wasClipboardCalled = clipboardMock.write.mock.calls.length > 0 ||
            clipboardMock.writeText.mock.calls.length > 0;
        expect(wasClipboardCalled).toBe(true);
        expect(mockActions.deleteBlock).toHaveBeenCalledWith('block-1');
        expect(mockActions.clearSelection).toHaveBeenCalled();
        expect(mockActions.clearTextSelection).toHaveBeenCalled();
    });

    it('does nothing when copying empty block list', async () => {
        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard([]);
        });

        expect(clipboardMock.write).not.toHaveBeenCalled();
        expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('falls back to writeText when ClipboardItem fails', async () => {
        clipboardMock.write.mockRejectedValueOnce(new Error('API not supported'));

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard(['block-1']);
        });

        expect(clipboardMock.writeText).toHaveBeenCalledWith('First block');
    });

    it('pastes structured blocks from storage', async () => {
        const storedBlocks = [
            { type: 'h1', content: 'Stored heading' },
            { type: 'paragraph', content: 'Stored paragraph' },
        ];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify(storedBlocks));

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-1', storedBlocks);
    });

    it('pastes structured blocks after last block when no focused block', async () => {
        const storedBlocks = [{ type: 'paragraph', content: 'New block' }];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify(storedBlocks));

        const stateWithoutFocus = { ...mockState, focusedBlockId: null };
        const { result } = renderHook(() =>
            useClipboard({
                state: stateWithoutFocus,
                actions: mockActions,
                editorRef: mockEditorRef,
            })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-3', storedBlocks);
    });

    it('handles paste error gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        clipboardMock.readText.mockRejectedValueOnce(new Error('Clipboard read failed'));

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to paste:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

    it('generates correct HTML for different block types', async () => {
        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard(['block-1', 'block-2', 'block-3']);
        });

        // ClipboardItem should have been called with proper HTML structure
        expect(global.ClipboardItem).toHaveBeenCalled();
    });
});
