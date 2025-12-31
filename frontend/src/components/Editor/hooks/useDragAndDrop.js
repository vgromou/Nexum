import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing drag-and-drop functionality in the Block Editor.
 * Handles mouse-based dragging of blocks with visual feedback.
 */
export function useDragAndDrop({ editorRef, state, actions }) {
    // Drop indicator state for visual feedback during drag
    const [dropIndicator, setDropIndicator] = useState({ visible: false, top: 0 });

    // Mouse-based drag state
    const [dragState, setDragState] = useState({
        isDragging: false,
        draggedBlockIds: [],
        startY: 0,
        currentY: 0,
        previewPosition: { x: 0, y: 0 },
    });

    /**
     * Determines which blocks should be dragged based on current selection.
     * If the initiating block is part of a selection, drags all selected blocks.
     */
    const getBlocksToDrag = useCallback((initiatingBlockId) => {
        if (state.selectedBlockIds.length > 0 && state.selectedBlockIds.includes(initiatingBlockId)) {
            return state.selectedBlockIds;
        }
        if (state.textSelectionBlockIds.length > 0 && state.textSelectionBlockIds.includes(initiatingBlockId)) {
            return state.textSelectionBlockIds;
        }
        return [initiatingBlockId];
    }, [state.selectedBlockIds, state.textSelectionBlockIds]);

    /**
     * Initiates drag operation when mouse is pressed on block handle.
     */
    const handleHandleMouseDown = useCallback((e, blockId, index) => {
        e.preventDefault();
        e.stopPropagation();

        const blocksToDrag = getBlocksToDrag(blockId);

        setDragState({
            isDragging: true,
            draggedBlockIds: blocksToDrag,
            startY: e.clientY,
            currentY: e.clientY,
            previewPosition: { x: e.clientX + 20, y: e.clientY + 10 },
        });

        actions.setDraggedBlocks(blocksToDrag);
    }, [getBlocksToDrag, actions]);

    /**
     * Global mouse move and up handlers for drag operation.
     * Updates drop indicator position and handles drop on mouse up.
     */
    useEffect(() => {
        if (!dragState.isDragging) return;

        const handleMouseMove = (e) => {
            setDragState(prev => ({
                ...prev,
                currentY: e.clientY,
                previewPosition: { x: e.clientX + 20, y: e.clientY + 10 },
            }));

            const blockElements = editorRef.current?.querySelectorAll('[data-block-id]');
            if (!blockElements) return;

            let closestBlock = null;
            let closestDistance = Infinity;
            let insertBefore = true;

            blockElements.forEach((blockEl) => {
                const rect = blockEl.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const distance = Math.abs(e.clientY - midY);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBlock = blockEl;
                    insertBefore = e.clientY < midY;
                }
            });

            if (closestBlock && editorRef.current) {
                const rect = closestBlock.getBoundingClientRect();
                const editorRect = editorRef.current.getBoundingClientRect();
                const relativeTop = (insertBefore ? rect.top : rect.bottom) - editorRect.top;
                setDropIndicator({
                    visible: true,
                    top: relativeTop,
                });
            }
        };

        const handleMouseUp = (e) => {
            if (!dragState.isDragging || dragState.draggedBlockIds.length === 0) {
                resetDragState();
                return;
            }

            const blockElements = editorRef.current?.querySelectorAll('[data-block-id]');
            if (!blockElements) {
                resetDragState();
                actions.setDraggedBlocks([]);
                return;
            }

            let targetIndex = 0;
            blockElements.forEach((blockEl, i) => {
                const rect = blockEl.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY > midY) {
                    targetIndex = i + 1;
                }
            });

            if (dragState.draggedBlockIds.length === 1) {
                actions.moveBlock(dragState.draggedBlockIds[0], targetIndex);
            } else {
                actions.moveBlocks(dragState.draggedBlockIds, targetIndex);
            }

            resetDragState();
            actions.setDraggedBlocks([]);
        };

        const resetDragState = () => {
            setDragState({
                isDragging: false,
                draggedBlockIds: [],
                startY: 0,
                currentY: 0,
                previewPosition: { x: 0, y: 0 },
            });
            setDropIndicator({ visible: false, top: 0 });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState.isDragging, dragState.draggedBlockIds, actions, editorRef]);

    // Placeholder handlers for native drag events (currently using mouse-based drag)
    const handleDragOver = useCallback((e, index) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((index, e) => {
        e.preventDefault();
    }, []);

    return {
        dragState,
        dropIndicator,
        handleHandleMouseDown,
        handleDragOver,
        handleDrop,
    };
}

export default useDragAndDrop;
