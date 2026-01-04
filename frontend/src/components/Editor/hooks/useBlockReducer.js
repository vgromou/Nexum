import { useReducer, useCallback } from 'react';

/**
 * Generates a unique block ID using crypto.randomUUID().
 * Falls back to timestamp-based ID if crypto API is unavailable.
 */
export const generateBlockId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `block-${crypto.randomUUID()}`;
    }
    // Fallback for older environments
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// History constants
const MAX_HISTORY_LENGTH = 100;
const HISTORY_DEBOUNCE_MS = 500;
const MIN_HISTORY_INTERVAL_MS = 100;

// Helper to extract text from HTML for word boundary detection
function extractTextFromHtml(html) {
    if (!html) return '';
    // Simple text extraction - works in both browser and test environments
    if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || '';
    }
    // Fallback: strip HTML tags
    return html.replace(/<[^>]*>/g, '');
}

// Actions that always create a new snapshot
const STRUCTURAL_ACTIONS = [
    'ADD_BLOCK', 'DELETE_BLOCK', 'MOVE_BLOCK', 'MOVE_BLOCKS',
    'CHANGE_BLOCK_TYPE', 'SET_INDENT_LEVEL', 'INSERT_BLOCKS',
    'DELETE_CROSS_SELECTION', 'SPLIT_AND_INSERT_BLOCKS',
    'SPLIT_BLOCK', 'MERGE_BLOCKS', 'DELETE_SELECTED_BLOCKS'
];

// Initial editor state with one empty paragraph
const initialState = {
    blocks: [
        { id: generateBlockId(), type: 'paragraph', content: '' }
    ],
    selectedBlockIds: [],
    textSelectionBlockIds: [], // Blocks that have text selected across them
    focusedBlockId: null,
    focusVersion: 0, // Incremented to trigger focus updates
    draggedBlockId: null,
    draggedBlockIds: [], // Multiple blocks being dragged
    // History state for undo/redo
    history: [],
    historyIndex: -1,
    lastCursor: null,
    pendingCursor: null,
};

// Action type constants
export const ACTIONS = {
    ADD_BLOCK: 'ADD_BLOCK',
    DELETE_BLOCK: 'DELETE_BLOCK',
    UPDATE_BLOCK: 'UPDATE_BLOCK',
    MOVE_BLOCK: 'MOVE_BLOCK',
    MOVE_BLOCKS: 'MOVE_BLOCKS',
    CHANGE_BLOCK_TYPE: 'CHANGE_BLOCK_TYPE',
    SET_FOCUSED_BLOCK: 'SET_FOCUSED_BLOCK',
    SELECT_BLOCK: 'SELECT_BLOCK',
    SELECT_BLOCKS_RANGE: 'SELECT_BLOCKS_RANGE',
    TOGGLE_BLOCK_SELECTION: 'TOGGLE_BLOCK_SELECTION',
    CLEAR_SELECTION: 'CLEAR_SELECTION',
    SELECT_ALL: 'SELECT_ALL',
    SET_DRAGGED_BLOCK: 'SET_DRAGGED_BLOCK',
    SET_DRAGGED_BLOCKS: 'SET_DRAGGED_BLOCKS',
    SET_TEXT_SELECTION_BLOCKS: 'SET_TEXT_SELECTION_BLOCKS',
    CLEAR_TEXT_SELECTION: 'CLEAR_TEXT_SELECTION',
    SPLIT_BLOCK: 'SPLIT_BLOCK',
    MERGE_BLOCKS: 'MERGE_BLOCKS',
    DELETE_SELECTED_BLOCKS: 'DELETE_SELECTED_BLOCKS',
    SET_BLOCKS: 'SET_BLOCKS',
    INSERT_BLOCKS: 'INSERT_BLOCKS',
    DELETE_CROSS_SELECTION: 'DELETE_CROSS_SELECTION',
    SPLIT_AND_INSERT_BLOCKS: 'SPLIT_AND_INSERT_BLOCKS',
    SET_INDENT_LEVEL: 'SET_INDENT_LEVEL',
    // History actions
    UNDO: 'UNDO',
    REDO: 'REDO',
    SET_LAST_CURSOR: 'SET_LAST_CURSOR',
    CLEAR_PENDING_CURSOR: 'CLEAR_PENDING_CURSOR',
    SAVE_SNAPSHOT: 'SAVE_SNAPSHOT',
};

/**
 * Determines if a new snapshot should be created based on the action type and timing.
 */
function shouldCreateNewSnapshot(lastSnapshot, state, action) {
    // No history yet - always create
    if (!lastSnapshot) return true;

    // Structural changes always create new snapshot
    if (STRUCTURAL_ACTIONS.includes(action.type)) {
        return true;
    }

    // For UPDATE_BLOCK and SET_BLOCKS - apply debounce logic
    if (action.type === 'UPDATE_BLOCK' || action.type === 'SET_BLOCKS') {
        const timeDiff = Date.now() - lastSnapshot.timestamp;

        // Minimum interval protection
        if (timeDiff < MIN_HISTORY_INTERVAL_MS) {
            return false;
        }

        // For UPDATE_BLOCK, check if same block and word boundaries
        if (action.type === 'UPDATE_BLOCK') {
            const sameBlock = lastSnapshot.cursor?.blockId === action.payload.blockId;

            // New snapshot if different block
            if (!sameBlock) return true;

            // New snapshot if enough time passed
            if (timeDiff > HISTORY_DEBOUNCE_MS) return true;

            // Check for word boundary - create snapshot when a word ends
            // This makes undo work on a per-word basis
            const content = action.payload.content || '';
            const textContent = extractTextFromHtml(content);

            // Get previous content to compare
            const prevBlock = state.blocks.find(b => b.id === action.payload.blockId);
            const prevTextContent = prevBlock ? extractTextFromHtml(prevBlock.content || '') : '';

            // If new content ends with word boundary and previous didn't, create snapshot
            const wordBoundaryChars = [' ', '.', ',', '!', '?', ';', ':', '\n'];
            const endsWithBoundary = wordBoundaryChars.some(char => textContent.endsWith(char));
            const prevEndedWithBoundary = wordBoundaryChars.some(char => prevTextContent.endsWith(char));

            if (endsWithBoundary && !prevEndedWithBoundary) {
                return true;
            }

            return false;
        }

        // For SET_BLOCKS, apply time-based debounce
        return timeDiff > HISTORY_DEBOUNCE_MS;
    }

    return false;
}

/**
 * Creates history update for state changes.
 * Returns an object with history and historyIndex to merge into new state.
 */
function withHistory(state, action) {
    const lastSnapshot = state.history[state.historyIndex] || state.history[state.history.length - 1];

    if (!shouldCreateNewSnapshot(lastSnapshot, state, action)) {
        // Update the timestamp of the last snapshot without creating new one
        if (lastSnapshot && state.history.length > 0) {
            const updatedHistory = [...state.history];
            updatedHistory[state.historyIndex >= 0 ? state.historyIndex : updatedHistory.length - 1] = {
                ...lastSnapshot,
                timestamp: Date.now(),
            };
            return {
                history: updatedHistory,
                historyIndex: state.historyIndex >= 0 ? state.historyIndex : updatedHistory.length - 1,
            };
        }
        return {};
    }

    // Create new snapshot with current state BEFORE the change
    const newSnapshot = {
        blocks: structuredClone(state.blocks), // Deep copy
        cursor: state.lastCursor,
        timestamp: Date.now(),
    };

    // Truncate history after current position (remove redo history after new action)
    const truncatedHistory = state.historyIndex >= 0
        ? state.history.slice(0, state.historyIndex + 1)
        : state.history;

    const newHistory = [...truncatedHistory, newSnapshot].slice(-MAX_HISTORY_LENGTH);

    return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
    };
}

/**
 * Block reducer - handles all state mutations for the block editor.
 */
function blockReducer(state, action) {
    switch (action.type) {
        case ACTIONS.ADD_BLOCK: {
            const { afterBlockId, blockType = 'paragraph', content = '', focusNew = true } = action.payload;
            const newBlock = {
                id: generateBlockId(),
                type: blockType,
                content,
            };

            let newBlocks;
            if (afterBlockId) {
                const index = state.blocks.findIndex(b => b.id === afterBlockId);
                newBlocks = [
                    ...state.blocks.slice(0, index + 1),
                    newBlock,
                    ...state.blocks.slice(index + 1)
                ];
            } else {
                newBlocks = [...state.blocks, newBlock];
            }

            return {
                ...state,
                blocks: newBlocks,
                focusedBlockId: focusNew ? newBlock.id : state.focusedBlockId,
                focusVersion: focusNew ? state.focusVersion + 1 : state.focusVersion,
                selectedBlockIds: [],
            };
        }

        case ACTIONS.DELETE_BLOCK: {
            const { blockId } = action.payload;
            const index = state.blocks.findIndex(b => b.id === blockId);

            // Cannot delete the last block - just clear it
            if (state.blocks.length <= 1) {
                return {
                    ...state,
                    blocks: [{ id: state.blocks[0].id, type: 'paragraph', content: '' }],
                };
            }

            const newBlocks = state.blocks.filter(b => b.id !== blockId);

            // Focus previous block (or next if at start)
            const newFocusIndex = Math.max(0, index - 1);
            const newFocusedBlockId = newBlocks[newFocusIndex]?.id || null;

            return {
                ...state,
                blocks: newBlocks,
                focusedBlockId: newFocusedBlockId,
                focusVersion: state.focusVersion + 1,
                selectedBlockIds: state.selectedBlockIds.filter(id => id !== blockId),
            };
        }

        case ACTIONS.UPDATE_BLOCK: {
            const { blockId, content } = action.payload;
            return {
                ...state,
                blocks: state.blocks.map(b =>
                    b.id === blockId ? { ...b, content } : b
                ),
            };
        }

        case ACTIONS.MOVE_BLOCK: {
            const { blockId, toIndex } = action.payload;
            const fromIndex = state.blocks.findIndex(b => b.id === blockId);

            if (fromIndex === -1 || fromIndex === toIndex) return state;

            const newBlocks = [...state.blocks];
            const [movedBlock] = newBlocks.splice(fromIndex, 1);
            newBlocks.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedBlock);

            return {
                ...state,
                blocks: newBlocks,
            };
        }

        case ACTIONS.CHANGE_BLOCK_TYPE: {
            const { blockId, newType } = action.payload;
            return {
                ...state,
                blocks: state.blocks.map(b =>
                    b.id === blockId ? { ...b, type: newType } : b
                ),
                focusedBlockId: blockId,
                focusVersion: state.focusVersion + 1,
            };
        }

        case ACTIONS.SET_FOCUSED_BLOCK: {
            return {
                ...state,
                focusedBlockId: action.payload.blockId,
                focusVersion: state.focusVersion + 1,
            };
        }

        case ACTIONS.SELECT_BLOCK: {
            const { blockId, exclusive = true } = action.payload;
            return {
                ...state,
                selectedBlockIds: exclusive ? [blockId] : [...state.selectedBlockIds, blockId],
            };
        }

        case ACTIONS.SELECT_BLOCKS_RANGE: {
            const { fromBlockId, toBlockId } = action.payload;
            const fromIndex = state.blocks.findIndex(b => b.id === fromBlockId);
            const toIndex = state.blocks.findIndex(b => b.id === toBlockId);

            if (fromIndex === -1 || toIndex === -1) return state;

            const start = Math.min(fromIndex, toIndex);
            const end = Math.max(fromIndex, toIndex);

            const selectedIds = state.blocks.slice(start, end + 1).map(b => b.id);

            return {
                ...state,
                selectedBlockIds: selectedIds,
            };
        }

        case ACTIONS.TOGGLE_BLOCK_SELECTION: {
            const { blockId } = action.payload;
            const isSelected = state.selectedBlockIds.includes(blockId);

            return {
                ...state,
                selectedBlockIds: isSelected
                    ? state.selectedBlockIds.filter(id => id !== blockId)
                    : [...state.selectedBlockIds, blockId],
            };
        }

        case ACTIONS.CLEAR_SELECTION: {
            return {
                ...state,
                selectedBlockIds: [],
            };
        }

        case ACTIONS.SELECT_ALL: {
            return {
                ...state,
                selectedBlockIds: state.blocks.map(b => b.id),
            };
        }

        case ACTIONS.SET_DRAGGED_BLOCK: {
            return {
                ...state,
                draggedBlockId: action.payload.blockId,
            };
        }

        case ACTIONS.SPLIT_BLOCK: {
            const { blockId, cursorPosition, content } = action.payload;
            const index = state.blocks.findIndex(b => b.id === blockId);
            const block = state.blocks[index];

            if (!block) return state;

            const contentBefore = content.substring(0, cursorPosition);
            const contentAfter = content.substring(cursorPosition);

            const newBlock = {
                id: generateBlockId(),
                type: block.type === 'quote' ? 'paragraph' : block.type,
                content: contentAfter,
            };

            const newBlocks = [
                ...state.blocks.slice(0, index),
                { ...block, content: contentBefore },
                newBlock,
                ...state.blocks.slice(index + 1)
            ];

            return {
                ...state,
                blocks: newBlocks,
                focusedBlockId: newBlock.id,
                focusVersion: state.focusVersion + 1,
            };
        }

        case ACTIONS.MERGE_BLOCKS: {
            const { blockId } = action.payload;
            const index = state.blocks.findIndex(b => b.id === blockId);

            if (index <= 0) return state;

            const prevBlock = state.blocks[index - 1];
            const currentBlock = state.blocks[index];

            const mergedContent = prevBlock.content + currentBlock.content;

            const newBlocks = [
                ...state.blocks.slice(0, index - 1),
                { ...prevBlock, content: mergedContent },
                ...state.blocks.slice(index + 1)
            ];

            return {
                ...state,
                blocks: newBlocks,
                focusedBlockId: prevBlock.id,
                focusVersion: state.focusVersion + 1,
            };
        }

        case ACTIONS.DELETE_SELECTED_BLOCKS: {
            if (state.selectedBlockIds.length === 0) return state;

            let newBlocks = state.blocks.filter(b => !state.selectedBlockIds.includes(b.id));

            // Ensure at least one block remains
            if (newBlocks.length === 0) {
                newBlocks = [{ id: generateBlockId(), type: 'paragraph', content: '' }];
            }

            return {
                ...state,
                blocks: newBlocks,
                selectedBlockIds: [],
                focusedBlockId: newBlocks[0]?.id || null,
                focusVersion: state.focusVersion + 1,
            };
        }

        case ACTIONS.SET_BLOCKS: {
            return {
                ...state,
                blocks: action.payload.blocks,
            };
        }

        case ACTIONS.MOVE_BLOCKS: {
            const { blockIds, toIndex } = action.payload;
            if (!blockIds || blockIds.length === 0) return state;

            // Get blocks to move in their current order
            const blocksToMove = state.blocks.filter(b => blockIds.includes(b.id));
            const remainingBlocks = state.blocks.filter(b => !blockIds.includes(b.id));

            // Calculate insertion index after removal
            let insertIndex = toIndex;
            const originalIndices = blockIds.map(id => state.blocks.findIndex(b => b.id === id));
            const minOriginalIndex = Math.min(...originalIndices);
            if (minOriginalIndex < toIndex) {
                insertIndex = Math.max(0, toIndex - blockIds.length);
            }

            // Insert blocks at new position
            const newBlocks = [
                ...remainingBlocks.slice(0, insertIndex),
                ...blocksToMove,
                ...remainingBlocks.slice(insertIndex)
            ];

            return {
                ...state,
                blocks: newBlocks,
                selectedBlockIds: blockIds,
                draggedBlockIds: [],
            };
        }

        case ACTIONS.SET_DRAGGED_BLOCKS: {
            return {
                ...state,
                draggedBlockIds: action.payload.blockIds || [],
            };
        }

        case ACTIONS.SET_TEXT_SELECTION_BLOCKS: {
            return {
                ...state,
                textSelectionBlockIds: action.payload.blockIds || [],
            };
        }

        case ACTIONS.CLEAR_TEXT_SELECTION: {
            return {
                ...state,
                textSelectionBlockIds: [],
            };
        }

        case ACTIONS.INSERT_BLOCKS: {
            const { afterBlockId, blocksToInsert, focusFirst = true } = action.payload;
            if (!blocksToInsert || blocksToInsert.length === 0) return state;

            // Generate new IDs for inserted blocks, preserving all properties
            const newBlocks = blocksToInsert.map(b => ({
                ...b,
                id: generateBlockId(),
                type: b.type || 'paragraph',
                content: b.content || '',
                indentLevel: b.indentLevel ?? 0,
            }));

            let insertIndex;
            if (afterBlockId) {
                insertIndex = state.blocks.findIndex(b => b.id === afterBlockId) + 1;
            } else {
                insertIndex = state.blocks.length;
            }

            const resultBlocks = [
                ...state.blocks.slice(0, insertIndex),
                ...newBlocks,
                ...state.blocks.slice(insertIndex)
            ];

            return {
                ...state,
                blocks: resultBlocks,
                focusedBlockId: focusFirst ? newBlocks[0].id : state.focusedBlockId,
                focusVersion: focusFirst ? state.focusVersion + 1 : state.focusVersion,
            };
        }

        case ACTIONS.DELETE_CROSS_SELECTION: {
            const {
                startBlockId,
                endBlockId,
                startOffset,
                endOffset,
            } = action.payload;

            const startIndex = state.blocks.findIndex(b => b.id === startBlockId);
            const endIndex = state.blocks.findIndex(b => b.id === endBlockId);

            if (startIndex === -1 || endIndex === -1) return state;

            const [minIndex, maxIndex] = startIndex <= endIndex
                ? [startIndex, endIndex]
                : [endIndex, startIndex];

            const startBlock = state.blocks[minIndex];
            const endBlock = state.blocks[maxIndex];

            // Extract text content from HTML
            const extractText = (html) => {
                const div = document.createElement('div');
                div.innerHTML = html;
                return div.textContent || '';
            };

            const startText = extractText(startBlock.content);
            const endText = extractText(endBlock.content);

            // Keep content before selection in first block
            const beforeContent = startText.substring(0, startOffset);
            // Keep content after selection in last block
            const afterContent = endText.substring(endOffset);

            // Merge into single block
            const mergedContent = beforeContent + afterContent;

            const newBlocks = [
                ...state.blocks.slice(0, minIndex),
                { ...startBlock, content: mergedContent },
                ...state.blocks.slice(maxIndex + 1)
            ];

            // Ensure at least one block remains
            const finalBlocks = newBlocks.length === 0
                ? [{ id: generateBlockId(), type: 'paragraph', content: '' }]
                : newBlocks;

            return {
                ...state,
                blocks: finalBlocks,
                textSelectionBlockIds: [],
                focusedBlockId: startBlock.id,
                focusVersion: state.focusVersion + 1,
            };
        }

        case ACTIONS.SET_INDENT_LEVEL: {
            const { blockId, indentLevel } = action.payload;
            // Clamp to valid range 0-2
            const clampedLevel = Math.max(0, Math.min(2, indentLevel));
            return {
                ...state,
                blocks: state.blocks.map(b =>
                    b.id === blockId ? { ...b, indentLevel: clampedLevel } : b
                ),
            };
        }

        case ACTIONS.SPLIT_AND_INSERT_BLOCKS: {
            const {
                blockId,
                cursorOffset,
                blocksToInsert,
            } = action.payload;

            if (!blocksToInsert || blocksToInsert.length === 0) return state;

            const blockIndex = state.blocks.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return state;

            const block = state.blocks[blockIndex];

            // Extract text content
            const extractText = (html) => {
                const div = document.createElement('div');
                div.innerHTML = html;
                return div.textContent || '';
            };

            const blockText = extractText(block.content);
            const beforeCursor = blockText.substring(0, cursorOffset);
            const afterCursor = blockText.substring(cursorOffset);

            // Process inserted blocks
            const insertedBlocks = blocksToInsert.map(b => ({
                ...b,
                id: generateBlockId(),
            }));

            const firstInserted = insertedBlocks[0];
            const lastInserted = insertedBlocks[insertedBlocks.length - 1];

            // If first block is partial, merge with content before cursor
            if (firstInserted.isPartial?.start) {
                firstInserted.content = beforeCursor + firstInserted.content;
            }

            // If last block is partial, merge with content after cursor
            if (lastInserted.isPartial?.end) {
                lastInserted.content = lastInserted.content + afterCursor;
            }

            let newBlocks;
            if (firstInserted.isPartial?.start && lastInserted.isPartial?.end) {
                // Both partial - replace current block with inserted blocks
                newBlocks = [
                    ...state.blocks.slice(0, blockIndex),
                    ...insertedBlocks,
                    ...state.blocks.slice(blockIndex + 1)
                ];
            } else if (firstInserted.isPartial?.start) {
                // Only first partial - keep content after cursor in original block
                newBlocks = [
                    ...state.blocks.slice(0, blockIndex),
                    ...insertedBlocks,
                    { ...block, content: afterCursor },
                    ...state.blocks.slice(blockIndex + 1)
                ];
            } else if (lastInserted.isPartial?.end) {
                // Only last partial - keep content before cursor in original block
                newBlocks = [
                    ...state.blocks.slice(0, blockIndex),
                    { ...block, content: beforeCursor },
                    ...insertedBlocks,
                    ...state.blocks.slice(blockIndex + 1)
                ];
            } else {
                // No partials - split block and insert between
                newBlocks = [
                    ...state.blocks.slice(0, blockIndex),
                    { ...block, content: beforeCursor },
                    ...insertedBlocks,
                    { id: generateBlockId(), type: block.type, content: afterCursor },
                    ...state.blocks.slice(blockIndex + 1)
                ];
            }

            // Filter out empty blocks (except ensure at least one remains)
            const filteredBlocks = newBlocks.filter(b => b.content.trim() !== '' || b.id === firstInserted.id);
            const finalBlocks = filteredBlocks.length === 0
                ? [{ id: generateBlockId(), type: 'paragraph', content: '' }]
                : filteredBlocks;

            return {
                ...state,
                blocks: finalBlocks,
                focusedBlockId: lastInserted.id,
                focusVersion: state.focusVersion + 1,
            };
        }

        // History actions
        case ACTIONS.UNDO: {
            if (state.history.length === 0) return state;

            let newHistory = state.history;
            let currentIndex = state.historyIndex;

            // If historyIndex is -1 or at the end, we're at the "current" state
            // Save current state first so we can redo back to it
            if (currentIndex === -1 || currentIndex === state.history.length - 1) {
                // Check if current state differs from last snapshot
                const lastSnapshot = state.history[state.history.length - 1];
                const currentBlocksStr = JSON.stringify(state.blocks);
                const lastBlocksStr = lastSnapshot ? JSON.stringify(lastSnapshot.blocks) : '';

                if (currentBlocksStr !== lastBlocksStr) {
                    // Save current state
                    const currentSnapshot = {
                        blocks: structuredClone(state.blocks),
                        cursor: state.lastCursor,
                        timestamp: Date.now(),
                    };
                    newHistory = [...state.history, currentSnapshot].slice(-MAX_HISTORY_LENGTH);
                    currentIndex = newHistory.length - 1;
                } else {
                    currentIndex = state.history.length - 1;
                }
            }

            // Can't undo if at the beginning
            if (currentIndex <= 0) return state;

            // Go to previous snapshot
            const targetIndex = currentIndex - 1;
            const snapshot = newHistory[targetIndex];

            if (!snapshot) return state;

            return {
                ...state,
                blocks: structuredClone(snapshot.blocks),
                history: newHistory,
                historyIndex: targetIndex,
                pendingCursor: snapshot.cursor,
            };
        }

        case ACTIONS.REDO: {
            // Can't redo if no history or already at the end
            if (state.history.length === 0) return state;
            if (state.historyIndex === -1) return state;
            if (state.historyIndex >= state.history.length - 1) return state;

            const targetIndex = state.historyIndex + 1;
            const snapshot = state.history[targetIndex];

            if (!snapshot) return state;

            return {
                ...state,
                blocks: structuredClone(snapshot.blocks),
                historyIndex: targetIndex,
                pendingCursor: snapshot.cursor,
            };
        }

        case ACTIONS.SET_LAST_CURSOR: {
            return {
                ...state,
                lastCursor: action.payload.cursor,
            };
        }

        case ACTIONS.CLEAR_PENDING_CURSOR: {
            return {
                ...state,
                pendingCursor: null,
            };
        }

        case ACTIONS.SAVE_SNAPSHOT: {
            const snapshot = {
                blocks: structuredClone(state.blocks),
                cursor: state.lastCursor,
                timestamp: Date.now(),
            };

            const truncatedHistory = state.historyIndex >= 0
                ? state.history.slice(0, state.historyIndex + 1)
                : state.history;
            const newHistory = [...truncatedHistory, snapshot].slice(-MAX_HISTORY_LENGTH);

            return {
                ...state,
                history: newHistory,
                historyIndex: newHistory.length - 1,
            };
        }

        default:
            return state;
    }
}

// Actions that modify blocks and should trigger history saves
const HISTORY_TRIGGERING_ACTIONS = [
    ACTIONS.ADD_BLOCK,
    ACTIONS.DELETE_BLOCK,
    ACTIONS.UPDATE_BLOCK,
    ACTIONS.MOVE_BLOCK,
    ACTIONS.MOVE_BLOCKS,
    ACTIONS.CHANGE_BLOCK_TYPE,
    ACTIONS.SPLIT_BLOCK,
    ACTIONS.MERGE_BLOCKS,
    ACTIONS.DELETE_SELECTED_BLOCKS,
    ACTIONS.SET_BLOCKS,
    ACTIONS.INSERT_BLOCKS,
    ACTIONS.DELETE_CROSS_SELECTION,
    ACTIONS.SPLIT_AND_INSERT_BLOCKS,
    ACTIONS.SET_INDENT_LEVEL,
];

/**
 * Wrapper reducer that automatically handles history for block-modifying actions.
 */
function blockReducerWithHistory(state, action) {
    // For history actions, just call the base reducer
    if ([ACTIONS.UNDO, ACTIONS.REDO, ACTIONS.SET_LAST_CURSOR,
    ACTIONS.CLEAR_PENDING_CURSOR, ACTIONS.SAVE_SNAPSHOT].includes(action.type)) {
        return blockReducer(state, action);
    }

    // For non-history-triggering actions, just call base reducer
    if (!HISTORY_TRIGGERING_ACTIONS.includes(action.type)) {
        return blockReducer(state, action);
    }

    // Ensure there's an initial snapshot if history is empty
    let currentState = state;
    if (state.history.length === 0) {
        const initialSnapshot = {
            blocks: structuredClone(state.blocks),
            cursor: state.lastCursor,
            timestamp: Date.now() - 10000, // Set far enough back to ensure new snapshots create
        };
        currentState = {
            ...state,
            history: [initialSnapshot],
            historyIndex: 0,
        };
    }

    // For STRUCTURAL_ACTIONS, ALWAYS create a new snapshot (no debounce)
    if (STRUCTURAL_ACTIONS.includes(action.type)) {
        const snapshot = {
            blocks: structuredClone(currentState.blocks),
            cursor: currentState.lastCursor,
            timestamp: Date.now(),
        };

        // Truncate history after current position (clear redo)
        const truncateAt = currentState.historyIndex >= 0
            ? currentState.historyIndex + 1
            : currentState.history.length;
        const newHistory = [...currentState.history.slice(0, truncateAt), snapshot]
            .slice(-MAX_HISTORY_LENGTH);

        // Apply the actual change
        const newState = blockReducer(state, action);

        return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        };
    }

    // For UPDATE_BLOCK and similar - use withHistory with debounce logic
    const historyUpdate = withHistory(currentState, action);
    const newState = blockReducer(state, action);

    return {
        ...newState,
        history: historyUpdate.history ?? currentState.history,
        historyIndex: historyUpdate.historyIndex ?? currentState.historyIndex,
    };
}

/**
 * Custom hook for managing block editor state.
 * Provides state and action creators for all block operations.
 */
export function useBlockReducer(initialBlocks = null) {
    const init = initialBlocks
        ? { ...initialState, blocks: initialBlocks }
        : initialState;

    const [state, dispatch] = useReducer(blockReducerWithHistory, init);

    // Action creators
    const addBlock = useCallback((afterBlockId, blockType = 'paragraph', content = '', focusNew = true) => {
        dispatch({
            type: ACTIONS.ADD_BLOCK,
            payload: { afterBlockId, blockType, content, focusNew }
        });
    }, []);

    const deleteBlock = useCallback((blockId) => {
        dispatch({ type: ACTIONS.DELETE_BLOCK, payload: { blockId } });
    }, []);

    const updateBlock = useCallback((blockId, content) => {
        dispatch({ type: ACTIONS.UPDATE_BLOCK, payload: { blockId, content } });
    }, []);

    const moveBlock = useCallback((blockId, toIndex) => {
        dispatch({ type: ACTIONS.MOVE_BLOCK, payload: { blockId, toIndex } });
    }, []);

    const changeBlockType = useCallback((blockId, newType) => {
        dispatch({ type: ACTIONS.CHANGE_BLOCK_TYPE, payload: { blockId, newType } });
    }, []);

    const setFocusedBlock = useCallback((blockId) => {
        dispatch({ type: ACTIONS.SET_FOCUSED_BLOCK, payload: { blockId } });
    }, []);

    const selectBlock = useCallback((blockId, exclusive = true) => {
        dispatch({ type: ACTIONS.SELECT_BLOCK, payload: { blockId, exclusive } });
    }, []);

    const selectBlocksRange = useCallback((fromBlockId, toBlockId) => {
        dispatch({ type: ACTIONS.SELECT_BLOCKS_RANGE, payload: { fromBlockId, toBlockId } });
    }, []);

    const toggleBlockSelection = useCallback((blockId) => {
        dispatch({ type: ACTIONS.TOGGLE_BLOCK_SELECTION, payload: { blockId } });
    }, []);

    const clearSelection = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_SELECTION });
    }, []);

    const selectAll = useCallback(() => {
        dispatch({ type: ACTIONS.SELECT_ALL });
    }, []);

    const setDraggedBlock = useCallback((blockId) => {
        dispatch({ type: ACTIONS.SET_DRAGGED_BLOCK, payload: { blockId } });
    }, []);

    const splitBlock = useCallback((blockId, cursorPosition, content) => {
        dispatch({ type: ACTIONS.SPLIT_BLOCK, payload: { blockId, cursorPosition, content } });
    }, []);

    const mergeBlocks = useCallback((blockId) => {
        dispatch({ type: ACTIONS.MERGE_BLOCKS, payload: { blockId } });
    }, []);

    const deleteSelectedBlocks = useCallback(() => {
        dispatch({ type: ACTIONS.DELETE_SELECTED_BLOCKS });
    }, []);

    const setBlocks = useCallback((blocks) => {
        dispatch({ type: ACTIONS.SET_BLOCKS, payload: { blocks } });
    }, []);

    const moveBlocks = useCallback((blockIds, toIndex) => {
        dispatch({ type: ACTIONS.MOVE_BLOCKS, payload: { blockIds, toIndex } });
    }, []);

    const setDraggedBlocks = useCallback((blockIds) => {
        dispatch({ type: ACTIONS.SET_DRAGGED_BLOCKS, payload: { blockIds } });
    }, []);

    const setTextSelectionBlocks = useCallback((blockIds) => {
        dispatch({ type: ACTIONS.SET_TEXT_SELECTION_BLOCKS, payload: { blockIds } });
    }, []);

    const clearTextSelection = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_TEXT_SELECTION });
    }, []);

    const insertBlocks = useCallback((afterBlockId, blocksToInsert, focusFirst = true) => {
        dispatch({ type: ACTIONS.INSERT_BLOCKS, payload: { afterBlockId, blocksToInsert, focusFirst } });
    }, []);

    const deleteCrossSelection = useCallback((startBlockId, endBlockId, startOffset, endOffset) => {
        dispatch({
            type: ACTIONS.DELETE_CROSS_SELECTION,
            payload: { startBlockId, endBlockId, startOffset, endOffset }
        });
    }, []);

    const splitAndInsertBlocks = useCallback((blockId, cursorOffset, blocksToInsert) => {
        dispatch({
            type: ACTIONS.SPLIT_AND_INSERT_BLOCKS,
            payload: { blockId, cursorOffset, blocksToInsert }
        });
    }, []);

    const setIndentLevel = useCallback((blockId, indentLevel) => {
        dispatch({
            type: ACTIONS.SET_INDENT_LEVEL,
            payload: { blockId, indentLevel }
        });
    }, []);

    // History action creators
    const undo = useCallback(() => {
        dispatch({ type: ACTIONS.UNDO });
    }, []);

    const redo = useCallback(() => {
        dispatch({ type: ACTIONS.REDO });
    }, []);

    const setLastCursor = useCallback((cursor) => {
        dispatch({ type: ACTIONS.SET_LAST_CURSOR, payload: { cursor } });
    }, []);

    const clearPendingCursor = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_PENDING_CURSOR });
    }, []);

    const saveSnapshot = useCallback(() => {
        dispatch({ type: ACTIONS.SAVE_SNAPSHOT });
    }, []);

    return {
        state,
        dispatch,
        actions: {
            addBlock,
            deleteBlock,
            updateBlock,
            moveBlock,
            moveBlocks,
            changeBlockType,
            setFocusedBlock,
            selectBlock,
            selectBlocksRange,
            toggleBlockSelection,
            clearSelection,
            selectAll,
            setDraggedBlock,
            setDraggedBlocks,
            setTextSelectionBlocks,
            clearTextSelection,
            splitBlock,
            mergeBlocks,
            deleteSelectedBlocks,
            setBlocks,
            insertBlocks,
            deleteCrossSelection,
            splitAndInsertBlocks,
            setIndentLevel,
            undo,
            redo,
            setLastCursor,
            clearPendingCursor,
            saveSnapshot,
        },
    };
}

export default useBlockReducer;
