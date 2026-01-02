import { render, screen, fireEvent, act } from '@testing-library/react';
import UnifiedBlockEditor from './UnifiedBlockEditor';

// Mock dependencies
const mockActions = {
    setFocusedBlock: vi.fn(),
    clearSelection: vi.fn(),
    selectBlock: vi.fn(),
    toggleBlockSelection: vi.fn(),
    selectBlocksRange: vi.fn(),
    updateBlock: vi.fn(),
    addBlock: vi.fn(),
    splitBlock: vi.fn(),
    changeBlockType: vi.fn(),
    deleteBlock: vi.fn(),
    mergeBlocks: vi.fn(),
    setBlocks: vi.fn(),
    clearTextSelection: vi.fn(),
};

let mockBlocks = [
    { id: '1', type: 'paragraph', content: 'Block 1' },
    { id: '2', type: 'h1', content: 'Heading 1' },
];

const getMockState = () => ({
    blocks: mockBlocks,
    selectedBlockIds: [],
    textSelectionBlockIds: [],
    focusedBlockId: null,
    focusVersion: 0,
});

vi.mock('./hooks/useBlockReducer', () => ({
    useBlockReducer: () => ({
        state: getMockState(),
        actions: mockActions,
    }),
}));

vi.mock('./hooks/useDragAndDrop', () => ({
    useDragAndDrop: () => ({
        dragState: {
            isDragging: false,
            draggedBlockIds: [],
            draggedBlocks: [],
            previewPosition: { x: 0, y: 0 },
        },
        dropIndicator: { visible: false, top: 0 },
        handleHandleMouseDown: vi.fn(),
        handleDragOver: vi.fn(),
        handleDrop: vi.fn(),
    }),
}));

vi.mock('./hooks/useClipboard', () => ({
    useClipboard: () => ({
        copyBlocksToClipboard: vi.fn(),
        pasteFromClipboard: vi.fn(),
    }),
}));

vi.mock('./hooks/useSlashMenu', () => ({
    useSlashMenu: () => ({
        slashMenu: { isOpen: false, position: { top: 0, left: 0 }, filter: '' },
        openSlashMenu: vi.fn(),
        closeSlashMenu: vi.fn(),
        updateSlashMenuFilter: vi.fn(),
        handleSlashSelect: vi.fn(),
    }),
}));

// Mock debounce to execute immediately but include cancel method
vi.mock('../../utils/debounce', () => ({
    debounce: (fn) => {
        const debouncedFn = (...args) => fn(...args);
        debouncedFn.cancel = vi.fn();
        return debouncedFn;
    },
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Helper to create a complete mock range
const createMockRange = (container, offset = 0) => ({
    startContainer: container,
    endContainer: container,
    startOffset: offset,
    endOffset: offset,
    collapsed: true,
    commonAncestorContainer: container?.parentElement || container,
    getClientRects: () => [],
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    setStart: vi.fn(),
    setEnd: vi.fn(),
    collapse: vi.fn(),
    toString: () => '',
    cloneRange: function () {
        return { ...this, selectNodeContents: vi.fn(), setEnd: vi.fn() };
    },
    selectNodeContents: vi.fn(),
    extractContents: vi.fn(() => document.createDocumentFragment()),
});

describe('UnifiedBlockEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset blocks to default
        mockBlocks = [
            { id: '1', type: 'paragraph', content: 'Block 1' },
            { id: '2', type: 'h1', content: 'Heading 1' },
        ];

        // Setup default document.createRange mock
        document.createRange = vi.fn(() => createMockRange(document.body));
    });

    it('renders blocks with correct tags and content', () => {
        render(<UnifiedBlockEditor />);

        // Check paragraph
        const pBlock = screen.getByText('Block 1');
        expect(pBlock.tagName).toBe('P');
        expect(pBlock).toHaveClass('block-content');
        expect(pBlock).toHaveAttribute('data-block-type', 'paragraph');
        expect(pBlock).toHaveAttribute('data-block-id', '1');

        // Check h1
        const h1Block = screen.getAllByText('Heading 1')[0]; // getAll because drag preview might duplicate if logic changes, but here it's safe
        expect(h1Block.tagName).toBe('H1');
        expect(h1Block).toHaveClass('block-content');
        expect(h1Block).toHaveAttribute('data-block-type', 'h1');
        expect(h1Block).toHaveAttribute('data-block-id', '2');
    });

    it('renders block handles', () => {
        const { container } = render(<UnifiedBlockEditor />);
        // 2 blocks -> 2 handles
        const handles = container.querySelectorAll('.block-handle');
        expect(handles.length).toBe(2);
    });

    it('handles interaction with handles', () => {
        const { container } = render(<UnifiedBlockEditor />);
        // Simply ensure handles are present
        const handle = container.querySelector('.block-handle');
        expect(handle).toBeInTheDocument();
    });

    it('handles enter key to add block', () => {
        render(<UnifiedBlockEditor />);
        const pBlock = screen.getByText('Block 1');

        // Mock document.createRange for cursor position calculation
        document.createRange = vi.fn(() => ({
            setStart: vi.fn(),
            setEnd: vi.fn(),
            setEndAfter: vi.fn(),
            collapse: vi.fn(),
            toString: () => 'Block 1', // length 7
            selectNodeContents: vi.fn(),
            extractContents: vi.fn(() => document.createDocumentFragment()),
        }));

        const mockRange = {
            startOffset: 7,
            collapsed: true,
            getClientRects: () => [],
            getBoundingClientRect: () => ({}),
            cloneRange: () => ({ ...mockRange, selectNodeContents: vi.fn(), setEnd: vi.fn() }),
            selectNodeContents: vi.fn(),
            setEnd: vi.fn(),
            setStart: vi.fn(),
            collapse: vi.fn(),
            toString: () => '',
            commonAncestorContainer: pBlock,
            startContainer: pBlock.firstChild,
            extractContents: vi.fn(() => document.createDocumentFragment()),
        };

        const mockSelection = {
            rangeCount: 1,
            getRangeAt: () => mockRange,
            anchorNode: pBlock.firstChild,
            anchorOffset: 7,
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };

        window.getSelection = vi.fn(() => mockSelection);

        fireEvent.keyDown(pBlock, { key: 'Enter' });

        // Component manipulates DOM then calls setBlocks
        expect(mockActions.setBlocks).toHaveBeenCalled();
        const callArgs = mockActions.setBlocks.mock.calls[0][0];
        // Original was Block 1 (id 1) and Heading 1 (id 2). 
        // Logic splits Block 1. 
        // Should have Block 1 (content 'Block 1'), New Block (content ''), Heading 1.
        expect(callArgs.length).toBe(3);
        expect(callArgs[0].id).toBe('1');
        expect(callArgs[1].type).toBe('paragraph');
        expect(callArgs[2].id).toBe('2');
    });

    it('handles markdown shortcut for heading', () => {
        const { container } = render(<UnifiedBlockEditor />);
        const contentEditable = container.querySelector('.unified-content-area');
        const pBlock = screen.getByText('Block 1');

        // Mock selection for input handling logic
        // Logic gets anchorNode, finds blockEl. 
        // pBlock.firstChild is text. 
        const mockRange = {
            startOffset: 0,
            collapsed: true,
            commonAncestorContainer: pBlock,
            startContainer: pBlock.firstChild,
        };

        const mockSelection = {
            rangeCount: 1,
            getRangeAt: () => mockRange,
            anchorNode: pBlock.firstChild,
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };

        window.getSelection = vi.fn(() => mockSelection);

        // Manually update the DOM content
        pBlock.firstChild.textContent = '# Block 1';

        // Trigger input
        fireEvent.input(contentEditable);

        // Should trigger setBlocks with type change
        expect(mockActions.setBlocks).toHaveBeenCalled();
        const callArgs = mockActions.setBlocks.mock.calls[0][0];
        // Block 1 should now be h1 type. 
        // Logic: '# ' removed. content 'Block 1'. type 'h1'.
        // Note: It creates a new Element in DOM, then syncs.
        // It uses existing blockId '1'.
        expect(callArgs[0].id).toBe('1');
        expect(callArgs[0].type).toBe('h1');
        expect(callArgs[0].content).toBe('Block 1');
    });

    it('syncs DOM changes to state', () => {
        const { container } = render(<UnifiedBlockEditor />);
        const contentEditable = container.querySelector('.unified-content-area');
        const pBlock = screen.getByText('Block 1');

        // Mock valid selection so handleInput doesn't return early
        const mockRange = {
            startContainer: pBlock.firstChild,
            commonAncestorContainer: pBlock,
            getClientRects: () => [],
            getBoundingClientRect: () => ({}),
        };

        window.getSelection = vi.fn(() => ({
            rangeCount: 1,
            getRangeAt: () => mockRange,
            anchorNode: pBlock.firstChild,
            anchorOffset: 0,
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        }));

        // User changes text
        pBlock.textContent = 'Block 1 Changed';

        fireEvent.input(contentEditable);

        expect(mockActions.setBlocks).toHaveBeenCalled();
        const callArgs = mockActions.setBlocks.mock.calls[0][0];
        expect(callArgs[0].content).toBe('Block 1 Changed');
    });
    it('applies data-placeholder attribute to blocks', () => {
        render(<UnifiedBlockEditor />);
        const pBlock = screen.getByText('Block 1');
        expect(pBlock).toHaveAttribute('data-placeholder', 'Type / for commands');
    });

    describe('Empty Block Placeholder', () => {
        it('adds is-empty class to blocks with no content', () => {
            // Override mockBlocks to include an empty block
            mockBlocks = [
                { id: '1', type: 'paragraph', content: '' },
                { id: '2', type: 'h1', content: 'Heading 1' },
            ];

            const { container } = render(<UnifiedBlockEditor />);

            const emptyBlock = container.querySelector('[data-block-id="1"]');
            const nonEmptyBlock = container.querySelector('[data-block-id="2"]');

            expect(emptyBlock).toHaveClass('is-empty');
            expect(nonEmptyBlock).not.toHaveClass('is-empty');
        });

        it('adds is-empty class to blocks with only whitespace', () => {
            mockBlocks = [
                { id: '1', type: 'paragraph', content: '   ' },
                { id: '2', type: 'h1', content: 'Heading 1' },
            ];

            const { container } = render(<UnifiedBlockEditor />);

            const whitespaceBlock = container.querySelector('[data-block-id="1"]');

            expect(whitespaceBlock).toHaveClass('is-empty');
        });

        it('removes is-empty class when block receives content', async () => {
            mockBlocks = [
                { id: '1', type: 'paragraph', content: '' },
            ];

            const { container } = render(<UnifiedBlockEditor />);
            const contentEditable = container.querySelector('.unified-content-area');
            const emptyBlock = container.querySelector('[data-block-id="1"]');

            // Initially empty
            expect(emptyBlock).toHaveClass('is-empty');

            // Add content to the block
            emptyBlock.textContent = 'New content';

            // Mock selection with complete range
            const mockRange = createMockRange(emptyBlock.firstChild || emptyBlock, 11);
            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: emptyBlock.firstChild || emptyBlock,
                anchorOffset: 11,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            fireEvent.input(contentEditable);

            // After input, is-empty should be removed
            expect(emptyBlock).not.toHaveClass('is-empty');
        });
    });

    describe('Focused Block Tracking', () => {
        it('adds is-focused class to the focused block', async () => {
            const { container } = render(<UnifiedBlockEditor />);
            const pBlock = screen.getByText('Block 1');

            // Mock selection pointing to pBlock with complete range
            const mockRange = createMockRange(pBlock.firstChild || pBlock, 0);
            mockRange.commonAncestorContainer = pBlock;

            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: pBlock.firstChild,
                anchorOffset: 0,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            // Trigger selection change
            await act(async () => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            expect(pBlock).toHaveClass('is-focused');
        });

        it('removes is-focused class when focus moves to another block', async () => {
            const { container } = render(<UnifiedBlockEditor />);
            const pBlock = screen.getByText('Block 1');
            const h1Block = screen.getAllByText('Heading 1')[0];

            // First focus on pBlock
            let mockRange = createMockRange(pBlock.firstChild || pBlock, 0);
            mockRange.commonAncestorContainer = pBlock;

            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: pBlock.firstChild,
                anchorOffset: 0,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            await act(async () => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            expect(pBlock).toHaveClass('is-focused');
            expect(h1Block).not.toHaveClass('is-focused');

            // Now move focus to h1Block
            mockRange = createMockRange(h1Block.firstChild || h1Block, 0);
            mockRange.commonAncestorContainer = h1Block;

            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: h1Block.firstChild,
                anchorOffset: 0,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            await act(async () => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            expect(pBlock).not.toHaveClass('is-focused');
            expect(h1Block).toHaveClass('is-focused');
        });

        it('removes is-focused class when selection is outside editor', async () => {
            const { container } = render(<UnifiedBlockEditor />);
            const pBlock = screen.getByText('Block 1');

            // First focus on pBlock
            const mockRange = createMockRange(pBlock.firstChild || pBlock, 0);
            mockRange.commonAncestorContainer = pBlock;

            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: pBlock.firstChild,
                anchorOffset: 0,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            await act(async () => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            expect(pBlock).toHaveClass('is-focused');

            // Now selection is outside (rangeCount = 0)
            window.getSelection = vi.fn(() => ({
                rangeCount: 0,
                getRangeAt: () => null,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            await act(async () => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            expect(pBlock).not.toHaveClass('is-focused');
        });
    });

    describe('Auto-focus on Mount', () => {
        it('focuses the first block on mount', async () => {
            mockBlocks = [
                { id: '1', type: 'paragraph', content: '' },
            ];

            // Mock requestAnimationFrame
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = (cb) => { cb(); return 0; };

            // Mock window.getSelection for focus logic
            const mockRemoveAllRanges = vi.fn();
            const mockAddRange = vi.fn();
            window.getSelection = vi.fn(() => ({
                rangeCount: 0,
                getRangeAt: () => null,
                removeAllRanges: mockRemoveAllRanges,
                addRange: mockAddRange,
            }));

            const { container } = render(<UnifiedBlockEditor />);

            const firstBlock = container.querySelector('[data-block-id="1"]');

            // The focus and cursor placement should have been called
            expect(mockRemoveAllRanges).toHaveBeenCalled();
            expect(mockAddRange).toHaveBeenCalled();

            // First block should have is-focused class
            expect(firstBlock).toHaveClass('is-focused');

            window.requestAnimationFrame = originalRAF;
        });

        it('sets cursor at the beginning of the first block', async () => {
            mockBlocks = [
                { id: '1', type: 'paragraph', content: 'Some text' },
            ];

            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = (cb) => { cb(); return 0; };

            const mockSetStart = vi.fn();
            const mockCollapse = vi.fn();
            const mockRange = {
                setStart: mockSetStart,
                collapse: mockCollapse,
            };

            document.createRange = vi.fn(() => mockRange);

            window.getSelection = vi.fn(() => ({
                rangeCount: 0,
                getRangeAt: () => null,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            render(<UnifiedBlockEditor />);

            // Verify cursor was set at position 0
            expect(mockSetStart).toHaveBeenCalled();
            expect(mockCollapse).toHaveBeenCalledWith(true);

            window.requestAnimationFrame = originalRAF;
        });
    });

    describe('Placeholder Visibility Conditions', () => {
        it('shows placeholder only on empty focused blocks', async () => {
            mockBlocks = [
                { id: '1', type: 'paragraph', content: '' },
                { id: '2', type: 'paragraph', content: '' },
            ];

            const { container } = render(<UnifiedBlockEditor />);

            const block1 = container.querySelector('[data-block-id="1"]');
            const block2 = container.querySelector('[data-block-id="2"]');

            // Both are empty
            expect(block1).toHaveClass('is-empty');
            expect(block2).toHaveClass('is-empty');

            // Focus on block1
            const mockRange = createMockRange(block1, 0);
            mockRange.commonAncestorContainer = block1;

            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: block1,
                anchorOffset: 0,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            await act(async () => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            // Block1 should be focused, block2 should not
            expect(block1).toHaveClass('is-focused');
            expect(block2).not.toHaveClass('is-focused');

            // Both still empty, but only block1 has both classes
            expect(block1).toHaveClass('is-empty');
            expect(block2).toHaveClass('is-empty');
        });
        it('clears formatting when block content becomes empty', () => {
            mockBlocks = [
                { id: '1', type: 'paragraph', content: '<b>Bold Text</b>' },
            ];

            const { container } = render(<UnifiedBlockEditor />);
            const contentEditable = container.querySelector('.unified-content-area');
            const block = container.querySelector('[data-block-id="1"]');

            // Mock document.execCommand
            document.execCommand = vi.fn();
            document.queryCommandState = vi.fn(() => true);

            // Mock selection
            const mockRange = createMockRange(block.firstChild || block, 0);
            window.getSelection = vi.fn(() => ({
                rangeCount: 1,
                getRangeAt: () => mockRange,
                anchorNode: block,
                anchorOffset: 0,
                removeAllRanges: vi.fn(),
                addRange: vi.fn(),
            }));

            // Simulate making it empty
            // We need to trigger handleInput or handleKeyUp. 
            // The cleanup is called in handleInput and handleKeyUp (Backspace).

            // 1. Simulate Backspace key affecting content
            block.textContent = ''; // User deleted everything
            fireEvent.keyUp(contentEditable, { key: 'Backspace' });

            expect(document.execCommand).toHaveBeenCalledWith('removeFormat', false, null);
        });
    });
});

