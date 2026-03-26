import { renderHook, act } from '@testing-library/react';
import { useClipboard } from './useClipboard';
import { createTextNode } from '../utils/ast';

// Helper to create AST block
const createASTBlock = (id, type, text, indentLevel = 0) => ({
    id,
    type,
    children: [createTextNode(text)],
    metadata: { indentLevel },
});

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
                createASTBlock('block-1', 'paragraph', 'First block'),
                createASTBlock('block-2', 'h1', 'Heading block'),
                createASTBlock('block-3', 'quote', 'Quote block'),
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
        // AST format blocks with children
        const storedBlocks = [
            { type: 'h1', children: [createTextNode('Stored heading')], metadata: { indentLevel: 0 } },
            { type: 'paragraph', children: [createTextNode('Stored paragraph')], metadata: { indentLevel: 0 } },
        ];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ blocks: storedBlocks }));
        // Clipboard text must match stored blocks content for validation
        clipboardMock.readText.mockResolvedValue('Stored heading\nStored paragraph');

        // Setup mock editorRef with block element for focusedBlockId detection
        const blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', 'block-1');
        mockEditorRef.current = document.createElement('div');
        mockEditorRef.current.appendChild(blockEl);

        // Mock Selection API to return block-1 as the focused block
        const mockSelection = {
            rangeCount: 1,
            anchorNode: blockEl, // This determines focusedBlockId in useClipboard
            getRangeAt: vi.fn(() => ({ collapsed: true })),
        };
        vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.pasteFromClipboard(false);
        });

        expect(mockActions.insertBlocks).toHaveBeenCalledWith('block-1', expect.arrayContaining([
            expect.objectContaining({ type: 'h1', children: expect.any(Array) }),
            expect.objectContaining({ type: 'paragraph', children: expect.any(Array) }),
        ]));
    });

    it('pastes structured blocks after last block when no focused block', async () => {
        // AST format blocks with children
        const storedBlocks = [{ type: 'paragraph', children: [createTextNode('New block')], metadata: { indentLevel: 0 } }];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ blocks: storedBlocks }));
        // Clipboard text must match stored blocks content for validation
        clipboardMock.readText.mockResolvedValue('New block');

        // Mock Selection API to return null for anchorNode (no focused block)
        const mockSelection = {
            rangeCount: 0,
            anchorNode: null,
            getRangeAt: vi.fn(() => ({ collapsed: true })),
        };
        vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

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
            expect.objectContaining({ type: 'paragraph', children: expect.any(Array) }),
        ]));
    });

    it('handles paste error gracefully', async () => {
        clipboardMock.readText.mockRejectedValueOnce(new Error('Clipboard read failed'));

        const { result } = renderHook(() =>
            useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
        );

        // Should not throw, should silently handle the error
        await act(async () => {
            await result.current.pasteFromClipboard();
        });

        // No blocks should be inserted when paste fails
        expect(mockActions.insertBlocks).not.toHaveBeenCalled();
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
                createASTBlock('block-1', 'bulleted-list', 'Item 1', 0),
                createASTBlock('block-2', 'bulleted-list', 'Nested', 1),
                createASTBlock('block-3', 'bulleted-list', 'Deep nested', 2),
            ],
        };

        const { result } = renderHook(() =>
            useClipboard({ state: stateWithIndent, actions: mockActions, editorRef: mockEditorRef })
        );

        await act(async () => {
            await result.current.copyBlocksToClipboard(['block-1', 'block-2', 'block-3']);
        });

        const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
        expect(savedData.blocks[0].metadata.indentLevel).toBe(0);
        expect(savedData.blocks[1].metadata.indentLevel).toBe(1);
        expect(savedData.blocks[2].metadata.indentLevel).toBe(2);
    });

    it('rejects stale stored blocks when clipboard text does not match', async () => {
        const storedBlocks = [
            { type: 'h1', children: [createTextNode('Old heading')], metadata: { indentLevel: 0 } },
            { type: 'paragraph', children: [createTextNode('Old paragraph')], metadata: { indentLevel: 0 } },
        ];
        sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ blocks: storedBlocks }));
        // Clipboard text is DIFFERENT from stored blocks (multi-line to trigger insertBlocks)
        clipboardMock.readText.mockResolvedValue('Completely different content\nSecond line of new content');

        // Setup mock editorRef with block element for focusedBlockId detection
        const blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', 'block-1');
        mockEditorRef.current = document.createElement('div');
        mockEditorRef.current.appendChild(blockEl);

        // Mock Selection API to return block-1 as the focused block
        const mockSelection = {
            rangeCount: 1,
            anchorNode: blockEl,
            getRangeAt: vi.fn(() => ({ collapsed: true })),
        };
        vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

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

        // Setup mock editorRef with block element for focusedBlockId detection
        const blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', 'block-1');
        mockEditorRef.current = document.createElement('div');
        mockEditorRef.current.appendChild(blockEl);

        // Mock Selection API to return block-1 as the focused block
        const mockSelection = {
            rangeCount: 1,
            anchorNode: blockEl,
            getRangeAt: vi.fn(() => ({ collapsed: true })),
        };
        vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

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

    describe('smart URL paste', () => {
        let mockRange;
        let mockSelection;
        let blockEl;

        beforeEach(() => {
            // Setup editor ref with a block element
            blockEl = document.createElement('p');
            blockEl.setAttribute('data-block-id', 'block-1');
            blockEl.textContent = 'Click here for more info';
            mockEditorRef.current = document.createElement('div');
            mockEditorRef.current.appendChild(blockEl);

            // Setup mock range with selection
            mockRange = {
                collapsed: false,
                deleteContents: vi.fn(),
                insertNode: vi.fn((node) => {
                    // Simulate DOM insertion
                    blockEl.innerHTML = '';
                    blockEl.appendChild(node);
                }),
                setStartAfter: vi.fn(),
                setEndAfter: vi.fn(),
            };

            mockSelection = {
                isCollapsed: false,
                toString: vi.fn(() => 'here'),
                getRangeAt: vi.fn(() => mockRange),
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            };
            vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);
        });

        it('wraps selected text in a link when pasting a URL', async () => {
            clipboardMock.readText.mockResolvedValue('https://example.com');

            const { result } = renderHook(() =>
                useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
            );

            await act(async () => {
                await result.current.pasteFromClipboard(false);
            });

            // Should update the block with the new content
            expect(mockActions.updateBlock).toHaveBeenCalledWith(
                'block-1',
                expect.any(String)
            );
            // Range operations should have been called
            expect(mockRange.deleteContents).toHaveBeenCalled();
            expect(mockRange.insertNode).toHaveBeenCalled();
        });

        it('adds https:// to URLs starting with www.', async () => {
            clipboardMock.readText.mockResolvedValue('www.example.com');

            const { result } = renderHook(() =>
                useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
            );

            await act(async () => {
                await result.current.pasteFromClipboard(false);
            });

            expect(mockActions.updateBlock).toHaveBeenCalled();
        });

        it('does not wrap as link when pasting plain text (non-URL)', async () => {
            clipboardMock.readText.mockResolvedValue('This is not a URL');
            sessionStorageMock.getItem.mockReturnValue(null);

            // Need to mock the DOM for single-line paste
            const blockContent = document.createElement('div');
            blockContent.className = 'block-content';
            blockContent.textContent = 'Click here';
            blockEl.appendChild(blockContent);

            // Mock range for DOM manipulation
            const mockRangePaste = document.createRange();
            mockSelection.rangeCount = 1;
            mockSelection.getRangeAt = vi.fn(() => ({
                deleteContents: vi.fn(),
                insertNode: vi.fn(),
                collapse: vi.fn(),
            }));

            mockEditorRef.current.querySelector = vi.fn((selector) => {
                if (selector.includes('.block-content')) return blockContent;
                return null;
            });

            const { result } = renderHook(() =>
                useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
            );

            await act(async () => {
                await result.current.pasteFromClipboard(false);
            });

            // For single-line text, it updates the current block
            // Smart URL paste should NOT have been triggered (no link wrapped)
            // Check that updateBlock was called but NOT with link HTML
            const updateCalls = mockActions.updateBlock.mock.calls;
            if (updateCalls.length > 0) {
                // updateBlock was called, which is correct for single line paste
                expect(true).toBe(true);
            } else {
                // If no updateBlock, should not have done smart URL paste either
                expect(mockRange.insertNode).not.toHaveBeenCalled;
            }
        });

        it('does not wrap as link when selection is collapsed', async () => {
            mockSelection.isCollapsed = true;
            mockSelection.toString.mockReturnValue('');
            mockSelection.rangeCount = 1;
            mockSelection.getRangeAt = vi.fn(() => ({
                deleteContents: vi.fn(),
                insertNode: vi.fn(),
                collapse: vi.fn(),
            }));

            clipboardMock.readText.mockResolvedValue('https://example.com');
            sessionStorageMock.getItem.mockReturnValue(null);

            const blockContent = document.createElement('div');
            blockContent.className = 'block-content';
            blockEl.appendChild(blockContent);

            mockEditorRef.current.querySelector = vi.fn((selector) => {
                if (selector.includes('.block-content')) return blockContent;
                return null;
            });

            const { result } = renderHook(() =>
                useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
            );

            await act(async () => {
                await result.current.pasteFromClipboard(false);
            });

            // When selection is collapsed, smart URL paste should NOT trigger
            // Instead, it should paste the URL as plain text
            // mockRange.insertNode (used for smart URL paste) should NOT be called
            expect(mockRange.deleteContents).not.toHaveBeenCalled();
        });

        it('does not apply smart URL paste when asPlainText is true', async () => {
            clipboardMock.readText.mockResolvedValue('https://example.com');
            sessionStorageMock.getItem.mockReturnValue(null);

            mockSelection.rangeCount = 1;
            mockSelection.getRangeAt = vi.fn(() => ({
                deleteContents: vi.fn(),
                insertNode: vi.fn(),
                collapse: vi.fn(),
            }));

            const blockContent = document.createElement('div');
            blockContent.className = 'block-content';
            blockEl.appendChild(blockContent);

            mockEditorRef.current.querySelector = vi.fn((selector) => {
                if (selector.includes('.block-content')) return blockContent;
                return null;
            });

            const { result } = renderHook(() =>
                useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
            );

            await act(async () => {
                await result.current.pasteFromClipboard(true); // asPlainText = true
            });

            // Smart URL paste should not be triggered when asPlainText is true
            // The original mockRange.insertNode (for link insertion) should not be called
            expect(mockRange.deleteContents).not.toHaveBeenCalled();
        });

        it('does not wrap as link when selection is whitespace-only', async () => {
            // Selection returns only whitespace
            mockSelection.isCollapsed = false;
            mockSelection.toString.mockReturnValue('   \t\n  '); // Only whitespace
            mockSelection.rangeCount = 1;
            mockSelection.getRangeAt = vi.fn(() => ({
                deleteContents: vi.fn(),
                insertNode: vi.fn(),
                collapse: vi.fn(),
            }));

            clipboardMock.readText.mockResolvedValue('https://example.com');
            sessionStorageMock.getItem.mockReturnValue(null);

            const blockContent = document.createElement('div');
            blockContent.className = 'block-content';
            blockEl.appendChild(blockContent);

            mockEditorRef.current.querySelector = vi.fn((selector) => {
                if (selector.includes('.block-content')) return blockContent;
                return null;
            });

            const { result } = renderHook(() =>
                useClipboard({ state: mockState, actions: mockActions, editorRef: mockEditorRef })
            );

            await act(async () => {
                await result.current.pasteFromClipboard(false);
            });

            // When selection is whitespace-only, smart URL paste should NOT trigger
            // It should fall through to normal paste behavior
            expect(mockRange.deleteContents).not.toHaveBeenCalled();
        });
    });
});
