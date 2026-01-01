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

const mockState = {
    blocks: [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'h1', content: 'Heading 1' },
    ],
    selectedBlockIds: [],
    textSelectionBlockIds: [],
    focusedBlockId: null,
    focusVersion: 0,
};

vi.mock('./hooks/useBlockReducer', () => ({
    useBlockReducer: () => ({
        state: mockState,
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

// Mock debounce to execute immediately
vi.mock('../../utils/debounce', () => ({
    debounce: (fn) => fn,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('UnifiedBlockEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        expect(pBlock).toHaveAttribute('data-placeholder', 'Type text here or / for commands');
    });
});
