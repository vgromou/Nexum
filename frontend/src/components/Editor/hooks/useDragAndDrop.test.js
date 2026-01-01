import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from './useDragAndDrop';

describe('useDragAndDrop', () => {
    let mockState;
    let mockActions;
    let mockEditorRef;

    beforeEach(() => {
        mockState = {
            blocks: [
                { id: 'block-1', type: 'paragraph', content: 'First' },
                { id: 'block-2', type: 'paragraph', content: 'Second' },
                { id: 'block-3', type: 'paragraph', content: 'Third' },
            ],
            selectedBlockIds: [],
            textSelectionBlockIds: [],
        };

        mockActions = {
            setDraggedBlocks: vi.fn(),
            moveBlock: vi.fn(),
            moveBlocks: vi.fn(),
            selectBlock: vi.fn(),
        };

        mockEditorRef = { current: null };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initializes with empty drag state', () => {
        const { result } = renderHook(() =>
            useDragAndDrop({ editorRef: mockEditorRef, state: mockState, actions: mockActions })
        );

        expect(result.current.dragState.isDragging).toBe(false);
        expect(result.current.dragState.draggedBlockIds).toEqual([]);
        expect(result.current.dropIndicator.visible).toBe(false);
    });

    it('starts dragging on handleHandleMouseDown', () => {
        const { result } = renderHook(() =>
            useDragAndDrop({ editorRef: mockEditorRef, state: mockState, actions: mockActions })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            clientX: 100,
            clientY: 200,
        };

        act(() => {
            result.current.handleHandleMouseDown(mockEvent, 'block-1', 0);
        });

        // Simulate mouse move to pass threshold
        const moveEvent = new MouseEvent('mousemove', {
            clientX: 110, // moved 10px
            clientY: 210, // moved 10px
        });

        act(() => {
            document.dispatchEvent(moveEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.dragState.isDragging).toBe(true);
        expect(result.current.dragState.draggedBlockIds).toEqual(['block-1']);
        expect(mockActions.setDraggedBlocks).toHaveBeenCalledWith(['block-1']);
    });

    it('drags all selected blocks if initiating block is in selection', () => {
        const stateWithSelection = {
            ...mockState,
            selectedBlockIds: ['block-1', 'block-2'],
        };

        const { result } = renderHook(() =>
            useDragAndDrop({
                editorRef: mockEditorRef,
                state: stateWithSelection,
                actions: mockActions,
            })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            clientX: 100,
            clientY: 200,
        };

        act(() => {
            result.current.handleHandleMouseDown(mockEvent, 'block-1', 0);
        });

        // Simulate mouse move to pass threshold
        const moveEvent = new MouseEvent('mousemove', {
            clientX: 110,
            clientY: 210,
        });

        act(() => {
            document.dispatchEvent(moveEvent);
        });

        expect(result.current.dragState.draggedBlockIds).toEqual(['block-1', 'block-2']);
        expect(mockActions.setDraggedBlocks).toHaveBeenCalledWith(['block-1', 'block-2']);
    });

    it('drags text selection blocks if initiating block is in text selection', () => {
        const stateWithTextSelection = {
            ...mockState,
            textSelectionBlockIds: ['block-2', 'block-3'],
        };

        const { result } = renderHook(() =>
            useDragAndDrop({
                editorRef: mockEditorRef,
                state: stateWithTextSelection,
                actions: mockActions,
            })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            clientX: 100,
            clientY: 200,
        };

        act(() => {
            result.current.handleHandleMouseDown(mockEvent, 'block-2', 1);
        });

        // Simulate mouse move to pass threshold
        const moveEvent = new MouseEvent('mousemove', {
            clientX: 110,
            clientY: 210,
        });

        act(() => {
            document.dispatchEvent(moveEvent);
        });

        expect(result.current.dragState.draggedBlockIds).toEqual(['block-2', 'block-3']);
    });

    it('drags only single block if not in any selection', () => {
        const stateWithSelection = {
            ...mockState,
            selectedBlockIds: ['block-1', 'block-2'],
        };

        const { result } = renderHook(() =>
            useDragAndDrop({
                editorRef: mockEditorRef,
                state: stateWithSelection,
                actions: mockActions,
            })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            clientX: 100,
            clientY: 200,
        };

        // Start dragging block-3 which is not in the selection
        act(() => {
            result.current.handleHandleMouseDown(mockEvent, 'block-3', 2);
        });

        // Simulate mouse move to pass threshold
        const moveEvent = new MouseEvent('mousemove', {
            clientX: 110,
            clientY: 210,
        });

        act(() => {
            document.dispatchEvent(moveEvent);
        });

        expect(result.current.dragState.draggedBlockIds).toEqual(['block-3']);
    });

    it('handleDragOver prevents default', () => {
        const { result } = renderHook(() =>
            useDragAndDrop({ editorRef: mockEditorRef, state: mockState, actions: mockActions })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
        };

        act(() => {
            result.current.handleDragOver(mockEvent, 0);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('handleDrop prevents default', () => {
        const { result } = renderHook(() =>
            useDragAndDrop({ editorRef: mockEditorRef, state: mockState, actions: mockActions })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
        };

        act(() => {
            result.current.handleDrop(0, mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('sets preview position correctly on mouse down', () => {
        const { result } = renderHook(() =>
            useDragAndDrop({ editorRef: mockEditorRef, state: mockState, actions: mockActions })
        );

        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            clientX: 150,
            clientY: 250,
        };

        act(() => {
            result.current.handleHandleMouseDown(mockEvent, 'block-1', 0);
        });

        // Simulate mouse move to pass threshold
        // Start: 150, 250. Move to: 160, 260.
        const moveEvent = new MouseEvent('mousemove', {
            clientX: 160,
            clientY: 260,
        });

        act(() => {
            document.dispatchEvent(moveEvent);
        });

        // Preview position is based on current mouse position + offset (20, 10)
        // Mouse at 160, 260 -> Preview at 180, 270
        expect(result.current.dragState.previewPosition).toEqual({ x: 180, y: 270 });
    });
});
