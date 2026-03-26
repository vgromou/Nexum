/**
 * Cursor utility functions for the block editor.
 * Used for saving and restoring cursor position during undo/redo operations.
 */

/**
 * Gets the current cursor state relative to the editor.
 * @param {React.RefObject} editorRef - Reference to the editor container
 * @returns {Object|null} Cursor state object or null if no valid cursor
 */
export const getCursorState = (editorRef) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    const range = sel.getRangeAt(0);

    // Find the block element containing the cursor
    const startContainer = range.startContainer;
    const blockEl = startContainer.nodeType === Node.TEXT_NODE
        ? startContainer.parentElement?.closest('[data-block-id]')
        : startContainer.closest?.('[data-block-id]');

    if (!blockEl) return null;

    const blockId = blockEl.getAttribute('data-block-id');
    const offset = getOffsetInBlock(blockEl, range.startContainer, range.startOffset);

    // Calculate selection length
    let selectionLength = 0;
    if (!range.collapsed) {
        selectionLength = range.toString().length;
    }

    return {
        blockId,
        offset,
        selectionLength,
    };
};

/**
 * Calculates the text offset from the start of a block to a given position.
 * @param {Element} blockEl - The block element
 * @param {Node} targetNode - The node containing the position
 * @param {number} targetOffset - The offset within the target node
 * @returns {number} The offset from the start of the block
 */
const getOffsetInBlock = (blockEl, targetNode, targetOffset) => {
    let offset = 0;
    let found = false;

    const walkTree = (node) => {
        if (found) return;

        if (node === targetNode) {
            if (node.nodeType === Node.TEXT_NODE) {
                offset += targetOffset;
            } else {
                // For element nodes, count children up to targetOffset
                for (let i = 0; i < targetOffset && i < node.childNodes.length; i++) {
                    const child = node.childNodes[i];
                    if (child.nodeType === Node.TEXT_NODE) {
                        offset += child.textContent.length;
                    } else {
                        offset += child.textContent?.length || 0;
                    }
                }
            }
            found = true;
            return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            offset += node.textContent.length;
        } else {
            for (const child of node.childNodes) {
                walkTree(child);
                if (found) return;
            }
        }
    };

    walkTree(blockEl);
    return offset;
};

/**
 * Finds the node and offset for a given text position in a block.
 * @param {Element} blockEl - The block element
 * @param {number} targetOffset - The target text offset
 * @returns {Object} Object with node and offset properties
 */
export const findPositionInBlock = (blockEl, targetOffset) => {
    let currentOffset = 0;
    let result = { node: blockEl, offset: 0 };

    const walkTree = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = node.textContent.length;
            if (currentOffset + nodeLength >= targetOffset) {
                result = { node, offset: targetOffset - currentOffset };
                return true; // Found
            }
            currentOffset += nodeLength;
        } else {
            for (const child of node.childNodes) {
                if (walkTree(child)) return true;
            }
        }
        return false;
    };

    if (!walkTree(blockEl)) {
        // Target offset beyond content - position at end
        const textNodes = [];
        const collectTextNodes = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            } else {
                for (const child of node.childNodes) {
                    collectTextNodes(child);
                }
            }
        };
        collectTextNodes(blockEl);

        if (textNodes.length > 0) {
            const lastNode = textNodes[textNodes.length - 1];
            result = { node: lastNode, offset: lastNode.textContent.length };
        }
    }

    return result;
};

/**
 * Restores cursor to a saved position.
 * @param {React.RefObject} editorRef - Reference to the editor container
 * @param {Object} cursorState - The cursor state to restore
 */
export const restoreCursor = (editorRef, cursorState) => {
    if (!cursorState || !editorRef.current) return;

    const blockEl = editorRef.current.querySelector(
        `[data-block-id="${cursorState.blockId}"]`
    );

    if (!blockEl) {
        // Block doesn't exist anymore - try to find a nearby block
        const allBlocks = editorRef.current.querySelectorAll('[data-block-id]');
        if (allBlocks.length > 0) {
            // Focus first block
            const firstBlock = allBlocks[0];
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStart(firstBlock, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        return;
    }

    try {
        const range = document.createRange();
        const sel = window.getSelection();

        // Find start position
        const startPos = findPositionInBlock(blockEl, cursorState.offset);
        range.setStart(startPos.node, startPos.offset);

        // Handle selection if any
        if (cursorState.selectionLength > 0) {
            const endPos = findPositionInBlock(
                blockEl,
                cursorState.offset + cursorState.selectionLength
            );
            range.setEnd(endPos.node, endPos.offset);
        } else {
            range.collapse(true);
        }

        sel.removeAllRanges();
        sel.addRange(range);
    } catch {
        // If restoration fails, just focus the block
        blockEl.focus();
    }
};
