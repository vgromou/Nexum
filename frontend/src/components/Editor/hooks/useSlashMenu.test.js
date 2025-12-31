import { renderHook, act } from '@testing-library/react';
import { useSlashMenu } from './useSlashMenu';

// Mock getBoundingClientRect for DOM elements
const mockGetBoundingClientRect = () => ({
    top: 100,
    left: 200,
    bottom: 120,
    height: 20,
    width: 100,
    right: 300,
});

// Mock window.getSelection
const mockGetSelection = (rangeRect = null) => {
    if (rangeRect) {
        return {
            rangeCount: 1,
            getRangeAt: () => ({
                getBoundingClientRect: () => rangeRect,
            }),
        };
    }
    return { rangeCount: 0 };
};

describe('useSlashMenu', () => {
    let mockState;
    let mockActions;

    beforeEach(() => {
        mockState = {
            blocks: [
                { id: 'block-1', type: 'paragraph', content: 'Hello /world' },
                { id: 'block-2', type: 'h1', content: 'Heading' },
            ],
        };

        mockActions = {
            updateBlock: vi.fn(),
            changeBlockType: vi.fn(),
            setFocusedBlock: vi.fn(),
        };

        // Reset window.getSelection mock
        vi.spyOn(window, 'getSelection').mockReturnValue(mockGetSelection());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initializes with closed menu', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        expect(result.current.slashMenu.isOpen).toBe(false);
        expect(result.current.slashMenu.position).toEqual({ top: 0, left: 0 });
        expect(result.current.slashMenu.filter).toBe('');
        expect(result.current.slashMenu.blockId).toBeNull();
    });

    it('opens slash menu with correct position from element', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: mockGetBoundingClientRect,
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        expect(result.current.slashMenu.isOpen).toBe(true);
        expect(result.current.slashMenu.blockId).toBe('block-1');
        expect(result.current.slashMenu.position.left).toBe(200);
        expect(result.current.slashMenu.position.top).toBe(124); // bottom + 4
    });

    it('opens slash menu with position from selection range', () => {
        const rangeRect = { left: 250, bottom: 130, width: 10, height: 15 };
        vi.spyOn(window, 'getSelection').mockReturnValue(mockGetSelection(rangeRect));

        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: mockGetBoundingClientRect,
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        expect(result.current.slashMenu.isOpen).toBe(true);
        expect(result.current.slashMenu.position.left).toBe(250);
        expect(result.current.slashMenu.position.top).toBe(134); // rangeRect.bottom + 4
    });

    it('closes slash menu', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: mockGetBoundingClientRect,
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        expect(result.current.slashMenu.isOpen).toBe(true);

        act(() => {
            result.current.closeSlashMenu();
        });

        expect(result.current.slashMenu.isOpen).toBe(false);
    });

    it('updates slash menu filter', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        act(() => {
            result.current.updateSlashMenuFilter('head');
        });

        expect(result.current.slashMenu.filter).toBe('head');

        act(() => {
            result.current.updateSlashMenuFilter('heading1');
        });

        expect(result.current.slashMenu.filter).toBe('heading1');
    });

    it('handles slash select: updates block and changes type', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: mockGetBoundingClientRect,
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('h1');
        });

        // Should remove slash command from content
        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', 'Hello ');
        expect(mockActions.changeBlockType).toHaveBeenCalledWith('block-1', 'h1');
        expect(mockActions.setFocusedBlock).toHaveBeenCalledWith('block-1');
        expect(result.current.slashMenu.isOpen).toBe(false);
    });

    it('handles slash select when no blockId', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        // Don't open menu, just call handleSlashSelect directly
        act(() => {
            result.current.handleSlashSelect('h1');
        });

        // No actions should be called because slashMenu.blockId is null
        expect(mockActions.updateBlock).not.toHaveBeenCalled();
        expect(mockActions.changeBlockType).not.toHaveBeenCalled();
    });

    it('handles slash select when block not found', () => {
        const { result } = renderHook(() =>
            useSlashMenu({
                state: { blocks: [] },
                actions: mockActions,
            })
        );

        const mockElement = {
            getBoundingClientRect: mockGetBoundingClientRect,
        };

        act(() => {
            result.current.openSlashMenu('non-existent', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('h1');
        });

        expect(mockActions.updateBlock).not.toHaveBeenCalled();
        expect(result.current.slashMenu.isOpen).toBe(false);
    });
});
