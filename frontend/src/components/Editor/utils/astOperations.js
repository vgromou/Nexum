/**
 * AST Editing Operations
 *
 * High-level operations for modifying AST content.
 * These functions take children arrays and return new modified arrays.
 * All operations are immutable - they never modify the original data.
 */

import {
    createTextNode,
    createLinkNode,
    createInlineCodeNode,
    createMark,
    splitTextNode,
    mergeAdjacentTextNodes,
    normalizeChildren,
    getPlainText,
    getTextLength,
    findNodeAtOffset,
    getNodeStartOffset,
    hasMark,
    applyMark,
    removeMark,
    toggleMark as toggleMarkOnNode,
} from './ast.js';

import {
    isTextNode,
    isLinkNode,
    isInlineCodeNode,
    MARK_TYPES,
    NODE_TYPES,
} from './ast-types.js';

// ============================================================================
// Mark Application to Selection
// ============================================================================

/**
 * Apply a mark to a range of text within children
 *
 * @param {import('./ast-types.js').InlineNode[]} children - Current children
 * @param {number} startOffset - Start offset in plain text
 * @param {number} endOffset - End offset in plain text
 * @param {import('./ast-types.js').Mark} mark - Mark to apply
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const applyMarkToRange = (children, startOffset, endOffset, mark) => {
    if (startOffset >= endOffset) return children;

    let currentOffset = 0;
    const result = [];

    for (const child of children) {
        // Handle non-text nodes (links, inline code)
        if (!isTextNode(child)) {
            let nodeLength;
            if (isLinkNode(child)) {
                nodeLength = getPlainText(child.children).length;
                // Recursively apply mark to link children if overlapping
                if (currentOffset < endOffset && currentOffset + nodeLength > startOffset) {
                    const linkStart = Math.max(0, startOffset - currentOffset);
                    const linkEnd = Math.min(nodeLength, endOffset - currentOffset);
                    result.push({
                        ...child,
                        children: applyMarkToRange(child.children, linkStart, linkEnd, mark),
                    });
                } else {
                    result.push(child);
                }
            } else if (isInlineCodeNode(child)) {
                // Inline code nodes cannot have marks applied
                nodeLength = child.text.length;
                result.push(child);
            } else {
                result.push(child);
                nodeLength = 0;
            }
            currentOffset += nodeLength;
            continue;
        }

        // Text node
        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        // Completely outside selection
        if (nodeEnd <= startOffset || nodeStart >= endOffset) {
            result.push(child);
            currentOffset = nodeEnd;
            continue;
        }

        // Split node at selection boundaries and apply mark
        const parts = [];

        // Part before selection
        if (nodeStart < startOffset) {
            parts.push({
                type: NODE_TYPES.TEXT,
                text: child.text.slice(0, startOffset - nodeStart),
                ...(child.marks && { marks: [...child.marks] }),
            });
        }

        // Part inside selection (apply mark)
        const insideStart = Math.max(0, startOffset - nodeStart);
        const insideEnd = Math.min(child.text.length, endOffset - nodeStart);
        const insideText = child.text.slice(insideStart, insideEnd);

        if (insideText) {
            const insideNode = {
                type: NODE_TYPES.TEXT,
                text: insideText,
                ...(child.marks && { marks: [...child.marks] }),
            };
            parts.push(applyMark(insideNode, mark));
        }

        // Part after selection
        if (nodeEnd > endOffset) {
            parts.push({
                type: NODE_TYPES.TEXT,
                text: child.text.slice(endOffset - nodeStart),
                ...(child.marks && { marks: [...child.marks] }),
            });
        }

        result.push(...parts);
        currentOffset = nodeEnd;
    }

    return mergeAdjacentTextNodes(result);
};

/**
 * Remove a mark from a range of text
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @param {string} markType - Type of mark to remove
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const removeMarkFromRange = (children, startOffset, endOffset, markType) => {
    if (startOffset >= endOffset) return children;

    let currentOffset = 0;
    const result = [];

    for (const child of children) {
        if (!isTextNode(child)) {
            let nodeLength;
            if (isLinkNode(child)) {
                nodeLength = getPlainText(child.children).length;
                if (currentOffset < endOffset && currentOffset + nodeLength > startOffset) {
                    const linkStart = Math.max(0, startOffset - currentOffset);
                    const linkEnd = Math.min(nodeLength, endOffset - currentOffset);
                    result.push({
                        ...child,
                        children: removeMarkFromRange(child.children, linkStart, linkEnd, markType),
                    });
                } else {
                    result.push(child);
                }
            } else {
                result.push(child);
                nodeLength = isInlineCodeNode(child) ? child.text.length : 0;
            }
            currentOffset += nodeLength;
            continue;
        }

        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        if (nodeEnd <= startOffset || nodeStart >= endOffset) {
            result.push(child);
            currentOffset = nodeEnd;
            continue;
        }

        const parts = [];

        if (nodeStart < startOffset) {
            parts.push({
                type: NODE_TYPES.TEXT,
                text: child.text.slice(0, startOffset - nodeStart),
                ...(child.marks && { marks: [...child.marks] }),
            });
        }

        const insideStart = Math.max(0, startOffset - nodeStart);
        const insideEnd = Math.min(child.text.length, endOffset - nodeStart);
        const insideText = child.text.slice(insideStart, insideEnd);

        if (insideText) {
            const insideNode = {
                type: NODE_TYPES.TEXT,
                text: insideText,
                ...(child.marks && { marks: [...child.marks] }),
            };
            parts.push(removeMark(insideNode, markType));
        }

        if (nodeEnd > endOffset) {
            parts.push({
                type: NODE_TYPES.TEXT,
                text: child.text.slice(endOffset - nodeStart),
                ...(child.marks && { marks: [...child.marks] }),
            });
        }

        result.push(...parts);
        currentOffset = nodeEnd;
    }

    return mergeAdjacentTextNodes(result);
};

/**
 * Toggle a mark on a range (apply if not all have it, remove if all have it)
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @param {import('./ast-types.js').Mark} mark
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const toggleMarkOnRange = (children, startOffset, endOffset, mark) => {
    if (startOffset >= endOffset) return children;

    // Check if entire range already has this mark
    const allHaveMark = rangeHasMarkFully(children, startOffset, endOffset, mark.type);

    if (allHaveMark) {
        return removeMarkFromRange(children, startOffset, endOffset, mark.type);
    } else {
        return applyMarkToRange(children, startOffset, endOffset, mark);
    }
};

/**
 * Check if entire range has a specific mark
 */
const rangeHasMarkFully = (children, startOffset, endOffset, markType) => {
    if (startOffset >= endOffset) return false;

    let currentOffset = 0;

    for (const child of children) {
        if (!isTextNode(child)) {
            const nodeLength = isLinkNode(child)
                ? getPlainText(child.children).length
                : isInlineCodeNode(child)
                ? child.text.length
                : 0;
            currentOffset += nodeLength;
            continue;
        }

        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        // Check if node overlaps with range
        if (nodeEnd > startOffset && nodeStart < endOffset) {
            if (!hasMark(child, markType)) {
                return false;
            }
        }

        currentOffset = nodeEnd;
    }

    return true;
};

// ============================================================================
// Text Insertion/Deletion
// ============================================================================

/**
 * Insert text at a specific offset
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} offset - Position to insert at
 * @param {string} text - Text to insert
 * @param {import('./ast-types.js').Mark[]} [marks=[]] - Marks to apply to inserted text
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const insertTextAtOffset = (children, offset, text, marks = []) => {
    if (!text) return children;

    // Handle empty children
    if (!children || children.length === 0) {
        return [createTextNode(text, marks)];
    }

    let currentOffset = 0;
    const result = [];
    let inserted = false;

    for (const child of children) {
        if (!isTextNode(child)) {
            const nodeLength = isLinkNode(child)
                ? getPlainText(child.children).length
                : isInlineCodeNode(child)
                ? child.text.length
                : 0;

            // Insert before this node if at the right position
            if (!inserted && currentOffset >= offset) {
                result.push(createTextNode(text, marks));
                inserted = true;
            }

            result.push(child);
            currentOffset += nodeLength;
            continue;
        }

        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        if (!inserted && offset >= nodeStart && offset <= nodeEnd) {
            // Insert within this text node
            const localOffset = offset - nodeStart;
            const beforeText = child.text.slice(0, localOffset);
            const afterText = child.text.slice(localOffset);

            // Inherit marks from the node at insertion point
            const inheritedMarks = marks.length > 0 ? marks : child.marks || [];

            if (beforeText) {
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: beforeText,
                    ...(child.marks && child.marks.length > 0 && { marks: [...child.marks] }),
                });
            }

            result.push(createTextNode(text, inheritedMarks));

            if (afterText) {
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: afterText,
                    ...(child.marks && child.marks.length > 0 && { marks: [...child.marks] }),
                });
            }

            inserted = true;
        } else {
            result.push(child);
        }

        currentOffset = nodeEnd;
    }

    // If not inserted yet, append at end
    if (!inserted) {
        result.push(createTextNode(text, marks));
    }

    return mergeAdjacentTextNodes(result);
};

/**
 * Delete text in a range
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const deleteTextInRange = (children, startOffset, endOffset) => {
    if (startOffset >= endOffset) return children;

    let currentOffset = 0;
    const result = [];

    for (const child of children) {
        if (!isTextNode(child)) {
            let nodeLength;
            if (isLinkNode(child)) {
                nodeLength = getPlainText(child.children).length;
                const nodeStart = currentOffset;
                const nodeEnd = currentOffset + nodeLength;

                if (nodeEnd <= startOffset || nodeStart >= endOffset) {
                    // Link is outside deletion range
                    result.push(child);
                } else if (nodeStart >= startOffset && nodeEnd <= endOffset) {
                    // Link is fully within deletion range - delete it
                } else {
                    // Link is partially within range - delete partial content
                    const linkStart = Math.max(0, startOffset - nodeStart);
                    const linkEnd = Math.min(nodeLength, endOffset - nodeStart);
                    const newChildren = deleteTextInRange(child.children, linkStart, linkEnd);
                    if (getPlainText(newChildren).length > 0) {
                        result.push({ ...child, children: newChildren });
                    }
                }
            } else if (isInlineCodeNode(child)) {
                nodeLength = child.text.length;
                const nodeStart = currentOffset;
                const nodeEnd = currentOffset + nodeLength;

                if (nodeEnd <= startOffset || nodeStart >= endOffset) {
                    result.push(child);
                } else if (nodeStart >= startOffset && nodeEnd <= endOffset) {
                    // Fully within deletion range - delete
                } else {
                    // Partial deletion
                    const localStart = Math.max(0, startOffset - nodeStart);
                    const localEnd = Math.min(nodeLength, endOffset - nodeStart);
                    const newText =
                        child.text.slice(0, localStart) + child.text.slice(localEnd);
                    if (newText) {
                        result.push(createInlineCodeNode(newText));
                    }
                }
            } else {
                result.push(child);
                nodeLength = 0;
            }
            currentOffset += nodeLength;
            continue;
        }

        // Text node
        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        if (nodeEnd <= startOffset || nodeStart >= endOffset) {
            // Node is outside deletion range
            result.push(child);
        } else if (nodeStart >= startOffset && nodeEnd <= endOffset) {
            // Node is fully within deletion range - delete it entirely
        } else {
            // Node is partially within range
            const localStart = Math.max(0, startOffset - nodeStart);
            const localEnd = Math.min(child.text.length, endOffset - nodeStart);
            const newText =
                child.text.slice(0, localStart) + child.text.slice(localEnd);

            if (newText) {
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: newText,
                    ...(child.marks && child.marks.length > 0 && { marks: [...child.marks] }),
                });
            }
        }

        currentOffset = nodeEnd;
    }

    return normalizeChildren(result);
};

/**
 * Replace text in a range with new text
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @param {string} newText
 * @param {import('./ast-types.js').Mark[]} [marks]
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const replaceTextInRange = (children, startOffset, endOffset, newText, marks) => {
    // First delete the range
    const afterDelete = deleteTextInRange(children, startOffset, endOffset);

    // Then insert new text at start position
    return insertTextAtOffset(afterDelete, startOffset, newText, marks);
};

// ============================================================================
// Link Operations
// ============================================================================

/**
 * Wrap a range of text in a link
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @param {string} url
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const wrapRangeInLink = (children, startOffset, endOffset, url) => {
    if (startOffset >= endOffset) return children;

    let currentOffset = 0;
    const result = [];
    const linkChildren = [];
    let linkInserted = false;

    for (const child of children) {
        if (!isTextNode(child)) {
            const nodeLength = isLinkNode(child)
                ? getPlainText(child.children).length
                : isInlineCodeNode(child)
                ? child.text.length
                : 0;

            const nodeStart = currentOffset;
            const nodeEnd = currentOffset + nodeLength;

            if (nodeEnd <= startOffset || nodeStart >= endOffset) {
                // Outside range
                if (!linkInserted && linkChildren.length > 0 && nodeStart >= endOffset) {
                    result.push(createLinkNode(url, linkChildren));
                    linkInserted = true;
                }
                result.push(child);
            } else if (isLinkNode(child)) {
                // Nested links are not allowed - flatten
                for (const linkChild of child.children) {
                    linkChildren.push({ ...linkChild });
                }
            } else {
                // Inline code inside link
                linkChildren.push(child);
            }

            currentOffset = nodeEnd;
            continue;
        }

        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        if (nodeEnd <= startOffset) {
            // Before range
            result.push(child);
        } else if (nodeStart >= endOffset) {
            // After range
            if (!linkInserted && linkChildren.length > 0) {
                result.push(createLinkNode(url, linkChildren));
                linkInserted = true;
            }
            result.push(child);
        } else {
            // Overlapping with range
            // Before selection
            if (nodeStart < startOffset) {
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: child.text.slice(0, startOffset - nodeStart),
                    ...(child.marks && { marks: [...child.marks] }),
                });
            }

            // Inside selection
            const insideStart = Math.max(0, startOffset - nodeStart);
            const insideEnd = Math.min(child.text.length, endOffset - nodeStart);
            linkChildren.push({
                type: NODE_TYPES.TEXT,
                text: child.text.slice(insideStart, insideEnd),
                ...(child.marks && { marks: [...child.marks] }),
            });

            // After selection
            if (nodeEnd > endOffset) {
                if (!linkInserted && linkChildren.length > 0) {
                    result.push(createLinkNode(url, linkChildren));
                    linkInserted = true;
                }
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: child.text.slice(endOffset - nodeStart),
                    ...(child.marks && { marks: [...child.marks] }),
                });
            }
        }

        currentOffset = nodeEnd;
    }

    // Insert link if not done yet
    if (!linkInserted && linkChildren.length > 0) {
        result.push(createLinkNode(url, linkChildren));
    }

    return mergeAdjacentTextNodes(result);
};

/**
 * Remove link at a specific offset (unwrap link)
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} offset
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const removeLinkAtOffset = (children, offset) => {
    let currentOffset = 0;
    const result = [];

    for (const child of children) {
        if (isLinkNode(child)) {
            const nodeLength = getPlainText(child.children).length;
            const nodeStart = currentOffset;
            const nodeEnd = currentOffset + nodeLength;

            if (offset >= nodeStart && offset < nodeEnd) {
                // This is the link to remove - unwrap it
                result.push(...child.children);
            } else {
                result.push(child);
            }

            currentOffset = nodeEnd;
            continue;
        }

        if (isTextNode(child)) {
            result.push(child);
            currentOffset += child.text.length;
        } else if (isInlineCodeNode(child)) {
            result.push(child);
            currentOffset += child.text.length;
        } else {
            result.push(child);
        }
    }

    return mergeAdjacentTextNodes(result);
};

/**
 * Find link at offset
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} offset
 * @returns {{ link: import('./ast-types.js').LinkNode, startOffset: number, endOffset: number } | null}
 */
export const findLinkAtOffset = (children, offset) => {
    let currentOffset = 0;

    for (const child of children) {
        if (isLinkNode(child)) {
            const nodeLength = getPlainText(child.children).length;
            const nodeStart = currentOffset;
            const nodeEnd = currentOffset + nodeLength;

            if (offset >= nodeStart && offset < nodeEnd) {
                return {
                    link: child,
                    startOffset: nodeStart,
                    endOffset: nodeEnd,
                };
            }

            currentOffset = nodeEnd;
            continue;
        }

        if (isTextNode(child)) {
            currentOffset += child.text.length;
        } else if (isInlineCodeNode(child)) {
            currentOffset += child.text.length;
        }
    }

    return null;
};

// ============================================================================
// Inline Code Operations
// ============================================================================

/**
 * Wrap a range in inline code
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const wrapRangeInInlineCode = (children, startOffset, endOffset) => {
    if (startOffset >= endOffset) return children;

    // Extract text from range (stripping all formatting)
    const text = getPlainText(children).slice(startOffset, endOffset);

    // Delete the range and insert inline code
    const afterDelete = deleteTextInRange(children, startOffset, endOffset);
    return insertInlineCodeAtOffset(afterDelete, startOffset, text);
};

/**
 * Insert inline code at offset
 */
const insertInlineCodeAtOffset = (children, offset, text) => {
    if (!text) return children;

    let currentOffset = 0;
    const result = [];
    let inserted = false;

    for (const child of children) {
        if (!isTextNode(child)) {
            const nodeLength = isLinkNode(child)
                ? getPlainText(child.children).length
                : isInlineCodeNode(child)
                ? child.text.length
                : 0;

            if (!inserted && currentOffset >= offset) {
                result.push(createInlineCodeNode(text));
                inserted = true;
            }

            result.push(child);
            currentOffset += nodeLength;
            continue;
        }

        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        if (!inserted && offset >= nodeStart && offset <= nodeEnd) {
            const localOffset = offset - nodeStart;
            const beforeText = child.text.slice(0, localOffset);
            const afterText = child.text.slice(localOffset);

            if (beforeText) {
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: beforeText,
                    ...(child.marks && { marks: [...child.marks] }),
                });
            }

            result.push(createInlineCodeNode(text));
            inserted = true;

            if (afterText) {
                result.push({
                    type: NODE_TYPES.TEXT,
                    text: afterText,
                    ...(child.marks && { marks: [...child.marks] }),
                });
            }
        } else {
            result.push(child);
        }

        currentOffset = nodeEnd;
    }

    if (!inserted) {
        result.push(createInlineCodeNode(text));
    }

    return mergeAdjacentTextNodes(result);
};

// ============================================================================
// Block Split/Merge
// ============================================================================

/**
 * Split children at offset into two arrays
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} offset
 * @returns {[import('./ast-types.js').InlineNode[], import('./ast-types.js').InlineNode[]]}
 */
export const splitChildrenAtOffset = (children, offset) => {
    let currentOffset = 0;
    const before = [];
    const after = [];
    let splitDone = false;

    for (const child of children) {
        if (splitDone) {
            after.push({ ...child });
            continue;
        }

        if (!isTextNode(child)) {
            let nodeLength;
            if (isLinkNode(child)) {
                nodeLength = getPlainText(child.children).length;
            } else if (isInlineCodeNode(child)) {
                nodeLength = child.text.length;
            } else {
                nodeLength = 0;
            }

            if (currentOffset + nodeLength <= offset) {
                before.push({ ...child });
            } else if (currentOffset >= offset) {
                after.push({ ...child });
                splitDone = true;
            } else {
                // Split inside the node (for links)
                if (isLinkNode(child)) {
                    const localOffset = offset - currentOffset;
                    const [linkBefore, linkAfter] = splitChildrenAtOffset(
                        child.children,
                        localOffset
                    );
                    if (getPlainText(linkBefore).length > 0) {
                        before.push({ ...child, children: linkBefore });
                    }
                    if (getPlainText(linkAfter).length > 0) {
                        after.push({ ...child, children: linkAfter });
                    }
                }
                splitDone = true;
            }

            currentOffset += nodeLength;
            continue;
        }

        // Text node
        const nodeEnd = currentOffset + child.text.length;

        if (nodeEnd <= offset) {
            before.push({ ...child });
        } else if (currentOffset >= offset) {
            after.push({ ...child });
            splitDone = true;
        } else {
            // Split inside text node
            const localOffset = offset - currentOffset;
            const [nodeBefore, nodeAfter] = splitTextNode(child, localOffset);

            if (nodeBefore.text) {
                before.push(nodeBefore);
            }
            if (nodeAfter.text) {
                after.push(nodeAfter);
            }
            splitDone = true;
        }

        currentOffset = nodeEnd;
    }

    return [normalizeChildren(before), normalizeChildren(after)];
};

/**
 * Merge two children arrays
 *
 * @param {import('./ast-types.js').InlineNode[]} first
 * @param {import('./ast-types.js').InlineNode[]} second
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const mergeChildren = (first, second) => {
    return normalizeChildren([...first, ...second]);
};

// ============================================================================
// Export
// ============================================================================

export default {
    // Mark operations
    applyMarkToRange,
    removeMarkFromRange,
    toggleMarkOnRange,

    // Text operations
    insertTextAtOffset,
    deleteTextInRange,
    replaceTextInRange,

    // Link operations
    wrapRangeInLink,
    removeLinkAtOffset,
    findLinkAtOffset,

    // Inline code
    wrapRangeInInlineCode,

    // Split/merge
    splitChildrenAtOffset,
    mergeChildren,
};
