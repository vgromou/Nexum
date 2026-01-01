import { render, screen, fireEvent, act } from '@testing-library/react';
import UnifiedBlockEditor from './UnifiedBlockEditor';
import React from 'react';

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
        copySelectedTextToClipboard: vi.fn(),
        cutSelectedText: vi.fn(),
    }),
}));

vi.mock('./hooks/useKeyboardNavigation', () => ({
    useKeyboardNavigation: vi.fn(),
}));

vi.mock('./hooks/useCrossBlockSelection', () => ({
    useCrossBlockSelection: () => ({
        crossSelection: null,
        getSelectedContent: vi.fn(),
        handleKeyboardSelection: vi.fn(),
        getSelectionForDeletion: vi.fn(),
    }),
}));

const mockCloseSlashMenu = vi.fn();
const mockOpenSlashMenu = vi.fn();
const mockUpdateSlashMenuFilter = vi.fn();

// Mock useSlashMenu to start with OPEN state
vi.mock('./hooks/useSlashMenu', () => ({
    useSlashMenu: () => ({
        slashMenu: { isOpen: true, position: { top: 100, left: 100 }, filter: '' },
        openSlashMenu: mockOpenSlashMenu,
        closeSlashMenu: mockCloseSlashMenu,
        updateSlashMenuFilter: mockUpdateSlashMenuFilter,
        handleSlashSelect: vi.fn(),
    }),
}));

// Mock SlashCommandMenu to control its DOM structure and verify it renders
vi.mock('./SlashCommandMenu', () => ({
    default: ({ position, onSelect }) => (
        <div
            className="slash-command-menu"
            style={{ top: position.top, left: position.left }}
            data-testid="slash-menu"
        >
            <div className="slash-menu-item" onClick={() => onSelect('h1')}>Heading 1</div>
        </div>
    )
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

describe('UnifiedBlockEditor Slash Menu Interaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should NOT close slash menu when clicking inside it', () => {
        const { container } = render(<UnifiedBlockEditor />);

        // Find the slash menu
        const slashMenu = screen.getByTestId('slash-menu');
        expect(slashMenu).toBeInTheDocument();

        // Simulate click inside the menu
        fireEvent.mouseDown(slashMenu);

        // Expect closeSlashMenu NOT to be called
        expect(mockCloseSlashMenu).not.toHaveBeenCalled();
    });

    it('should restore focus to the block after slash menu selection updates the block', async () => {
        const { rerender, container } = render(<UnifiedBlockEditor />);

        // Setup stable selection mock
        const addRangeSpy = vi.fn();
        const removeAllRangesSpy = vi.fn();
        const mockSelection = {
            rangeCount: 0,
            removeAllRanges: removeAllRangesSpy,
            addRange: addRangeSpy,
            getRangeAt: vi.fn(),
        };
        // Mock window.getSelection to return our stable mock
        const originalGetSelection = window.getSelection;
        window.getSelection = vi.fn(() => mockSelection);

        // Setup state for the update: focusedBlockId is '1', block 1 changes type to h1
        mockState.focusedBlockId = '1';
        mockState.blocks = [{ id: '1', type: 'h1', content: 'Heading 1' }];

        // Trigger re-render to run useLayoutEffect
        rerender(<UnifiedBlockEditor />);

        // Wait for requestAnimationFrame
        await new Promise(resolve => setTimeout(resolve, 0));
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Expect addRange to have been called
        expect(addRangeSpy).toHaveBeenCalled();

        window.getSelection = originalGetSelection;
    });
});
