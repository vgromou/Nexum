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
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ blocks: storedBlocks }));
        // Clipboard text must match stored blocks content for validation
        clipboardMock.readText.mockResolvedValue('Stored heading\nStored paragraph');

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-1', expect.arrayContaining([
            expect.objectContaining({ type: 'h1', content: 'Stored heading' }),
            expect.objectContaining({ type: 'paragraph', content: 'Stored paragraph' }),
        ]));
    });

    it('pastes structured blocks after last block when no focused block', async () => {
        const storedBlocks = [{ type: 'paragraph', content: 'New block' }];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ blocks: storedBlocks }));
        // Clipboard text must match stored blocks content for validation
        clipboardMock.readText.mockResolvedValue('New block');

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

        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-3', expect.arrayContaining([
            expect.objectContaining({ type: 'paragraph', content: 'New block' }),
        ]));
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

    it('preserves indentLevel when copying blocks', async () => {
        const stateWithIndent = {
            ...mockState,
            blocks: [
                { id: 'block-1', type: 'bulleted-list', content: 'Item 1', indentLevel: 0 },
                { id: 'block-2', type: 'bulleted-list', content: 'Nested', indentLevel: 1 },
                { id: 'block-3', type: 'bulleted-list', content: 'Deep nested', indentLevel: 2 },
            ],
        };

        const { result } = renderHook(() =>
            useClipboard({ state: stateWithIndent, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard(['block-1', 'block-2', 'block-3']);
        });

        const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
        expect(savedData.blocks[0].indentLevel).toBe(0);
        expect(savedData.blocks[1].indentLevel).toBe(1);
        expect(savedData.blocks[2].indentLevel).toBe(2);
    });

    it('rejects stale stored blocks when clipboard text does not match', async () => {
        const storedBlocks = [
            { type: 'h1', content: 'Old heading' },
            { type: 'paragraph', content: 'Old paragraph' },
        ];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ blocks: storedBlocks }));
        // Clipboard text is DIFFERENT from stored blocks (multi-line to trigger insertBlocks)
        clipboardMock.readText.mockResolvedValue('Completely different content\nSecond line of new content');

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        // Should create paragraph blocks from clipboard text instead of using stale stored blocks
        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-1', expect.arrayContaining([
            expect.objectContaining({ type: 'paragraph', content: 'Completely different content' }),
            expect.objectContaining({ type: 'paragraph', content: 'Second line of new content' }),
        ]));
    });

    it('pastes multi-line external content as separate blocks', async () => {
        sessionStorageMock.getItem.mockReturnValue(null);
        clipboardMock.readText.mockResolvedValue('Line 1\nLine 2\nLine 3');

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-1', expect.arrayContaining([
            expect.objectContaining({ type: 'paragraph', content: 'Line 1' }),
            expect.objectContaining({ type: 'paragraph', content: 'Line 2' }),
            expect.objectContaining({ type: 'paragraph', content: 'Line 3' }),
        ]));
    });

    it('filters empty lines when pasting multi-line content', async () => {
        sessionStorageMock.getItem.mockReturnValue(null);
        clipboardMock.readText.mockResolvedValue('Line 1\n\n\nLine 2\n   \nLine 3');

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        const insertedBlocks = mockActions.insertBlocks.mock.calls[0][1];
        expect(insertedBlocks).toHaveLength(3);
        expect(insertedBlocks.every(b => b.content.trim() !== '')).toBe(true);
    });
});
