import { useState, useCallback, useEffect, useRef } from 'react';

// Minimum distance mouse must move to start a drag (prevents accidental drags on clicks)
const DRAG_THRESHOLD = 5;

/**
 * Custom hook for managing drag-and-drop functionality in the Block Editor.
 * Handles mouse-based dragging of blocks and text with visual feedback.
 * Supports Alt/Option modifier for copy vs move operations.
 */
export function useDragAndDrop({ editorRef, state, actions, getSelectedContent }) {
    // Drop indicator state for visual feedback during drag
    const [dropIndicator, setDropIndicator] = useState({ visible: false, top: 0 });

    // Mouse-based drag state
    const [dragState, setDragState] = useState({
        isDragging: false,
        draggedBlockIds: [],
        draggedBlocks: [], // Actual block objects for preview
        dragType: 'blocks', // 'blocks' or 'text'
        startY: 0,
        currentY: 0,
        previewPosition: { x: 0, y: 0 },
        isCopying: false, // Alt/Option held for copy
        textContent: null, // For text drags
    });

    // Track pending drag (before threshold is reached)
    const pendingDrag = useRef(null);

    // Track last clicked block for Shift selection (moved from UnifiedBlockEditor)
    const lastClickedBlockRef = useRef(null);

    // Track Alt/Option key state
    const isAltPressed = useRef(false);

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
     * If the block is not already selected, select it first.
     */
    /**
     * Initiates drag interaction. Stores pending state.
     * Actual drag starts only after mouse move threshold.
     */
    const handleHandleMouseDown = useCallback((e, blockId, index) => {
        e.preventDefault(); // Prevent text selection/native drag
        e.stopPropagation();

        pendingDrag.current = {
            startX: e.clientX,
            startY: e.clientY,
            blockId,
            index,
            originalEvent: e
        };
    }, []);

    /**
     * Initiates text drag when mousedown on selected text.
     */
    const handleTextDragStart = useCallback((e) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return false;

        // Check if click is within selected text
        const range = sel.getRangeAt(0);
        const rects = range.getClientRects();
        let isInSelection = false;

        for (const rect of rects) {
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                isInSelection = true;
                break;
            }
        }

        if (!isInSelection) return false;

        // Get selected content for preview
        const textContent = getSelectedContent?.();
        if (!textContent) return false;

        // Build block data from text content for preview
        const blocksData = textContent.blocks || [];

        setDragState({
            isDragging: true,
            draggedBlockIds: state.textSelectionBlockIds,
            draggedBlocks: blocksData,
            dragType: 'text',
            startY: e.clientY,
            currentY: e.clientY,
            previewPosition: { x: e.clientX + 20, y: e.clientY + 10 },
            isCopying: e.altKey,
            textContent,
        });

        return true;
    }, [state.textSelectionBlockIds, getSelectedContent]);

    /**
     * Global mouse move and up handlers for drag operation.
     * Updates drop indicator position and handles drop on mouse up.
     */
    /**
     * Global mouse move and up handlers for drag operation.
     * Updates drop indicator position and handles drop on mouse up.
     */
    useEffect(() => {
        const handleMouseMove = (e) => {
            // Case 1: Pending drag - check threshold to start drag
            if (pendingDrag.current && !dragState.isDragging) {
                const deltaX = Math.abs(e.clientX - pendingDrag.current.startX);
                const deltaY = Math.abs(e.clientY - pendingDrag.current.startY);

                if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                    const { blockId, originalEvent } = pendingDrag.current;

                    // Determine blocks to drag
                    let blocksToDrag = getBlocksToDrag(blockId);

                    // If starting drag on a block not in selection, select it (and drag only it)
                    // unless it is part of a text selection
                    const isTextSelected = state.textSelectionBlockIds.includes(blockId);
                    if (!state.selectedBlockIds.includes(blockId) && !isTextSelected) {
                        actions.selectBlock(blockId, true);
                        blocksToDrag = [blockId];
                    }

                    // Get actual block objects for preview
                    const blocksData = state.blocks.filter(b => blocksToDrag.includes(b.id));

                    setDragState({
                        isDragging: true,
                        draggedBlockIds: blocksToDrag,
                        draggedBlocks: blocksData,
                        dragType: 'blocks',
                        startY: originalEvent.clientY,
                        currentY: e.clientY,
                        previewPosition: { x: e.clientX + 20, y: e.clientY + 10 },
                        isCopying: originalEvent.altKey,
                        textContent: null,
                    });

                    actions.setDraggedBlocks(blocksToDrag);
                    pendingDrag.current = null; // Drag started, no longer pending
                }
                return;
            }

            // Case 2: Active drag - update position
            if (dragState.isDragging) {
                setDragState(prev => ({
                    ...prev,
                    currentY: e.clientY,
                    previewPosition: { x: e.clientX + 20, y: e.clientY + 10 },
                    isCopying: e.altKey,
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
            }
        };

        const handleMouseUp = (e) => {
            // Case 1: Pending drag released before threshold -> Click (Selection)
            if (pendingDrag.current) {
                const { blockId, originalEvent } = pendingDrag.current;

                if (originalEvent.shiftKey && lastClickedBlockRef.current) {
                    actions.selectBlocksRange(lastClickedBlockRef.current, blockId);
                } else if (originalEvent.metaKey || originalEvent.ctrlKey) {
                    actions.toggleBlockSelection(blockId);
                } else {
                    actions.selectBlock(blockId, true);
                }

                lastClickedBlockRef.current = blockId;
                pendingDrag.current = null;
                return;
            }

            // Case 2: Active drag released -> Drop
            if (!dragState.isDragging || dragState.draggedBlockIds.length === 0) {
                if (dragState.isDragging) resetDragState();
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

            if (dragState.dragType === 'blocks') {
                if (dragState.isCopying) {
                    const targetBlockId = targetIndex > 0
                        ? state.blocks[targetIndex - 1]?.id
                        : null;
                    const blocksToCopy = state.blocks
                        .filter(b => dragState.draggedBlockIds.includes(b.id))
                        .map(b => ({ type: b.type, content: b.content }));
                    actions.insertBlocks(targetBlockId, blocksToCopy);
                } else {
                    if (dragState.draggedBlockIds.length === 1) {
                        actions.moveBlock(dragState.draggedBlockIds[0], targetIndex);
                    } else {
                        actions.moveBlocks(dragState.draggedBlockIds, targetIndex);
                    }
                }
            } else if (dragState.dragType === 'text' && dragState.textContent) {
                const targetBlockId = targetIndex > 0
                    ? state.blocks[targetIndex - 1]?.id
                    : state.blocks[0]?.id;

                if (targetBlockId && dragState.textContent.blocks) {
                    actions.insertBlocks(targetBlockId, dragState.textContent.blocks);

                    if (!dragState.isCopying) {
                        window.getSelection()?.deleteFromDocument();
                        dragState.draggedBlockIds.forEach(blockId => {
                            const blockEl = editorRef.current?.querySelector(
                                `[data-block-id="${blockId}"] .block-content`
                            );
                            if (blockEl) {
                                actions.updateBlock(blockId, blockEl.innerHTML);
                            }
                        });
                    }
                }
                actions.clearTextSelection();
            }

            resetDragState();
            actions.setDraggedBlocks([]);
            // Clear block selection after drop
            actions.clearSelection();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Alt' || e.key === 'Option') {
                isAltPressed.current = true;
                setDragState(prev => ({ ...prev, isCopying: true }));
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Alt' || e.key === 'Option') {
                isAltPressed.current = false;
                setDragState(prev => ({ ...prev, isCopying: false }));
            }
        };

        const resetDragState = () => {
            setDragState({
                isDragging: false,
                draggedBlockIds: [],
                draggedBlocks: [],
                dragType: 'blocks',
                startY: 0,
                currentY: 0,
                previewPosition: { x: 0, y: 0 },
                isCopying: false,
                textContent: null,
            });
            setDropIndicator({ visible: false, top: 0 });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [dragState.isDragging, dragState.draggedBlockIds, dragState.dragType, dragState.textContent, dragState.isCopying, actions, editorRef, state.blocks, getBlocksToDrag, state.selectedBlockIds]);

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
        handleTextDragStart,
        handleDragOver,
        handleDrop,
    };
}

export default useDragAndDrop;
