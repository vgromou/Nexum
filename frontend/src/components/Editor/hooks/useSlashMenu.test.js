import { renderHook, act } from '@testing-library/react';
import { useSlashMenu } from './useSlashMenu';
import { createTextNode } from '../utils/ast';

// Helper to create AST block
const createASTBlock = (id, type, text) => ({
    id,
    type,
    children: [createTextNode(text)],
    metadata: {},
});

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
                createASTBlock('block-1', 'paragraph', 'Hello /world'),
                createASTBlock('block-2', 'h1', 'Heading'),
            ],
        };

        mockActions = {
            updateBlock: vi.fn(),
            changeBlockType: vi.fn(),
            setFocusedBlock: vi.fn(),
        };

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
        expect(result.current.slashMenu.position.top).toBe(124);
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
        expect(result.current.slashMenu.position.top).toBe(134);
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

    it('handles slash select: removes slash command and changes type', () => {
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

        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', 'Hello ');
        expect(mockActions.changeBlockType).toHaveBeenCalledWith('block-1', 'h1');
        expect(mockActions.setFocusedBlock).toHaveBeenCalledWith('block-1');
        expect(result.current.slashMenu.isOpen).toBe(false);
    });

    it('handles slash select when no blockId', () => {
        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        act(() => {
            result.current.handleSlashSelect('h1');
        });

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

describe('useSlashMenu AST operations', () => {
    let mockActions;

    beforeEach(() => {
        mockActions = {
            updateBlock: vi.fn(),
            changeBlockType: vi.fn(),
            setFocusedBlock: vi.fn(),
        };
        vi.spyOn(window, 'getSelection').mockReturnValue({ rangeCount: 0 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('extracts plain text from multiple AST children', () => {
        const mockState = {
            blocks: [
                {
                    id: 'block-1',
                    type: 'paragraph',
                    children: [
                        createTextNode('Hello '),
                        createTextNode('world', [{ type: 'bold' }]),
                        createTextNode(' /h1'),
                    ],
                    metadata: {},
                },
            ],
        };

        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 20 }),
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('h1');
        });

        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', 'Hello world ');
        expect(mockActions.changeBlockType).toHaveBeenCalledWith('block-1', 'h1');
    });

    it('handles empty slash command', () => {
        const mockState = {
            blocks: [createASTBlock('block-1', 'paragraph', '/')],
        };

        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 20 }),
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('quote');
        });

        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', '');
        expect(mockActions.changeBlockType).toHaveBeenCalledWith('block-1', 'quote');
    });

    it('uses last slash when multiple slashes exist', () => {
        const mockState = {
            blocks: [createASTBlock('block-1', 'paragraph', 'path/to/file /h1')],
        };

        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 20 }),
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('h1');
        });

        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', 'path/to/file ');
    });

    it('keeps content unchanged when no slash found', () => {
        const mockState = {
            blocks: [createASTBlock('block-1', 'paragraph', 'No slash here')],
        };

        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 20 }),
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('h1');
        });

        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', 'No slash here');
        expect(mockActions.changeBlockType).toHaveBeenCalledWith('block-1', 'h1');
    });

    it('handles block with empty children array', () => {
        const mockState = {
            blocks: [
                {
                    id: 'block-1',
                    type: 'paragraph',
                    children: [],
                    metadata: {},
                },
            ],
        };

        const { result } = renderHook(() =>
            useSlashMenu({ state: mockState, actions: mockActions })
        );

        const mockElement = {
            getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 20 }),
        };

        act(() => {
            result.current.openSlashMenu('block-1', mockElement);
        });

        act(() => {
            result.current.handleSlashSelect('h1');
        });

        expect(mockActions.updateBlock).toHaveBeenCalledWith('block-1', '');
        expect(mockActions.changeBlockType).toHaveBeenCalledWith('block-1', 'h1');
    });
});
