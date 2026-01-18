/**
 * AST Utility Functions
 *
 * Core utilities for creating, modifying, and querying AST nodes.
 */

import {
    NODE_TYPES,
    MARK_TYPES,
    BLOCK_TYPES,
    isTextNode,
    isLinkNode,
    isInlineCodeNode,
    isColorMark,
    marksEqual,
    markArraysEqual,
} from './ast-types.js';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID for blocks
 * @returns {string}
 */
export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `block-${crypto.randomUUID()}`;
    }
    // Fallback for older browsers
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Node Creation
// ============================================================================

/**
 * Create a text node
 * @param {string} text - The text content
 * @param {import('./ast-types.js').Mark[]} [marks=[]] - Array of marks
 * @returns {import('./ast-types.js').TextNode}
 */
export const createTextNode = (text, marks = []) => {
    const node = { type: NODE_TYPES.TEXT, text };
    if (marks && marks.length > 0) {
        node.marks = [...marks];
    }
    return node;
};

/**
 * Create a link node
 * @param {string} url - The URL
 * @param {import('./ast-types.js').InlineNode[]} children - Child nodes
 * @param {import('./ast-types.js').Mark[]} [marks=[]] - Array of marks
 * @returns {import('./ast-types.js').LinkNode}
 */
export const createLinkNode = (url, children, marks = []) => {
    const node = {
        type: NODE_TYPES.LINK,
        url,
        children: children.length > 0 ? children : [createTextNode('')],
    };
    if (marks && marks.length > 0) {
        node.marks = [...marks];
    }
    return node;
};

/**
 * Create an inline code node
 * @param {string} text - The code content
 * @returns {import('./ast-types.js').InlineCodeNode}
 */
export const createInlineCodeNode = (text) => ({
    type: NODE_TYPES.INLINE_CODE,
    text,
});

/**
 * Create a block
 * @param {import('./ast-types.js').BlockType} type - Block type
 * @param {import('./ast-types.js').InlineNode[]} [children=[]] - Child nodes
 * @param {string} [id] - Block ID (auto-generated if not provided)
 * @param {import('./ast-types.js').BlockMetadata} [metadata={}] - Block metadata
 * @returns {import('./ast-types.js').Block}
 */
export const createBlock = (type, children = [], id = generateId(), metadata = {}) => ({
    id,
    type,
    children: children.length > 0 ? children : [createTextNode('')],
    metadata,
});

/**
 * Create an empty paragraph block
 * @param {string} [id] - Block ID
 * @returns {import('./ast-types.js').Block}
 */
export const createEmptyParagraph = (id = generateId()) =>
    createBlock(BLOCK_TYPES.PARAGRAPH, [createTextNode('')], id);

// ============================================================================
// Mark Operations
// ============================================================================

/**
 * Create a mark object
 * @param {string} type - Mark type
 * @param {Object} [props={}] - Additional properties (e.g., color)
 * @returns {import('./ast-types.js').Mark}
 */
export const createMark = (type, props = {}) => ({ type, ...props });

/**
 * Apply a mark to a text node
 * @param {import('./ast-types.js').TextNode} node - Text node
 * @param {import('./ast-types.js').Mark} mark - Mark to apply
 * @returns {import('./ast-types.js').TextNode}
 */
export const applyMark = (node, mark) => {
    if (!isTextNode(node)) return node;

    const marks = node.marks || [];

    // For color marks, replace existing mark of same type
    if (isColorMark(mark)) {
        const filteredMarks = marks.filter(m => m.type !== mark.type);
        return { ...node, marks: [...filteredMarks, mark] };
    }

    // For other marks, don't add duplicate
    if (marks.some(m => marksEqual(m, mark))) {
        return node;
    }

    return { ...node, marks: [...marks, mark] };
};

/**
 * Remove a mark from a text node
 * @param {import('./ast-types.js').TextNode} node - Text node
 * @param {string} markType - Type of mark to remove
 * @returns {import('./ast-types.js').TextNode}
 */
export const removeMark = (node, markType) => {
    if (!isTextNode(node)) return node;

    const marks = (node.marks || []).filter(m => m.type !== markType);
    if (marks.length === 0) {
        const { marks: _, ...rest } = node;
        return rest;
    }
    return { ...node, marks };
};

/**
 * Toggle a mark on a text node
 * @param {import('./ast-types.js').TextNode} node - Text node
 * @param {import('./ast-types.js').Mark} mark - Mark to toggle
 * @returns {import('./ast-types.js').TextNode}
 */
export const toggleMark = (node, mark) => {
    if (!isTextNode(node)) return node;

    const hasMark = (node.marks || []).some(m => marksEqual(m, mark));
    return hasMark ? removeMark(node, mark.type) : applyMark(node, mark);
};

/**
 * Check if a node has a specific mark
 * @param {import('./ast-types.js').InlineNode} node - Node to check
 * @param {string} markType - Type of mark to look for
 * @returns {boolean}
 */
export const hasMark = (node, markType) => {
    if (!isTextNode(node)) return false;
    return (node.marks || []).some(m => m.type === markType);
};

/**
 * Get a specific mark from a node
 * @param {import('./ast-types.js').InlineNode} node - Node to check
 * @param {string} markType - Type of mark to get
 * @returns {import('./ast-types.js').Mark | undefined}
 */
export const getMark = (node, markType) => {
    if (!isTextNode(node)) return undefined;
    return (node.marks || []).find(m => m.type === markType);
};

// ============================================================================
// Node Manipulation
// ============================================================================

/**
 * Split a text node at a given offset
 * @param {import('./ast-types.js').TextNode} node - Text node to split
 * @param {number} offset - Character offset to split at
 * @returns {import('./ast-types.js').TextNode[]} Array of 1-2 nodes
 */
export const splitTextNode = (node, offset) => {
    if (!isTextNode(node)) return [node];

    // Handle edge cases
    if (offset <= 0) return [node];
    if (offset >= node.text.length) return [node];

    const before = {
        type: NODE_TYPES.TEXT,
        text: node.text.slice(0, offset),
    };
    const after = {
        type: NODE_TYPES.TEXT,
        text: node.text.slice(offset),
    };

    // Copy marks to both parts
    if (node.marks && node.marks.length > 0) {
        before.marks = [...node.marks];
        after.marks = [...node.marks];
    }

    return [before, after];
};

/**
 * Merge adjacent text nodes with identical marks
 * @param {import('./ast-types.js').InlineNode[]} children - Array of inline nodes
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const mergeAdjacentTextNodes = (children) => {
    if (!children || children.length === 0) {
        return [createTextNode('')];
    }

    const merged = [];

    for (const child of children) {
        const last = merged[merged.length - 1];

        // Skip empty text nodes (except if it's the only node)
        if (isTextNode(child) && child.text === '' && children.length > 1) {
            continue;
        }

        // Try to merge with previous text node
        if (
            last &&
            isTextNode(last) &&
            isTextNode(child) &&
            markArraysEqual(last.marks, child.marks)
        ) {
            // Merge: combine text
            last.text += child.text;
        } else {
            // Can't merge: add as new node
            merged.push({ ...child });
        }
    }

    // Ensure at least one text node exists
    if (merged.length === 0) {
        return [createTextNode('')];
    }

    return merged;
};

/**
 * Normalize children array (merge adjacent nodes, handle empty)
 * @param {import('./ast-types.js').InlineNode[]} children
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const normalizeChildren = (children) => {
    if (!children || children.length === 0) {
        return [createTextNode('')];
    }

    // Deep clone and merge
    return mergeAdjacentTextNodes(
        children.map(child => {
            if (isLinkNode(child)) {
                return {
                    ...child,
                    children: normalizeChildren(child.children),
                };
            }
            return { ...child };
        })
    );
};

// ============================================================================
// Text Extraction
// ============================================================================

/**
 * Get plain text from children array
 * @param {import('./ast-types.js').InlineNode[]} children
 * @returns {string}
 */
export const getPlainText = (children) => {
    if (!children) return '';

    return children
        .map(child => {
            if (isTextNode(child)) return child.text;
            if (isLinkNode(child)) return getPlainText(child.children);
            if (isInlineCodeNode(child)) return child.text;
            return '';
        })
        .join('');
};

/**
 * Get the total length of text in children
 * @param {import('./ast-types.js').InlineNode[]} children
 * @returns {number}
 */
export const getTextLength = (children) => getPlainText(children).length;

// ============================================================================
// Node Finding and Traversal
// ============================================================================

/**
 * Find node and local offset for a given absolute offset
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} offset - Absolute offset in plain text
 * @returns {{ node: import('./ast-types.js').InlineNode, nodeIndex: number, localOffset: number } | null}
 */
export const findNodeAtOffset = (children, offset) => {
    let currentOffset = 0;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        let nodeLength;

        if (isTextNode(child)) {
            nodeLength = child.text.length;
        } else if (isLinkNode(child)) {
            nodeLength = getPlainText(child.children).length;
        } else if (isInlineCodeNode(child)) {
            nodeLength = child.text.length;
        } else {
            nodeLength = 0;
        }

        if (currentOffset + nodeLength >= offset) {
            return {
                node: child,
                nodeIndex: i,
                localOffset: offset - currentOffset,
            };
        }

        currentOffset += nodeLength;
    }

    // If offset is beyond end, return last node
    if (children.length > 0) {
        const lastNode = children[children.length - 1];
        const lastLength = isTextNode(lastNode)
            ? lastNode.text.length
            : isInlineCodeNode(lastNode)
            ? lastNode.text.length
            : getPlainText(lastNode.children).length;

        return {
            node: lastNode,
            nodeIndex: children.length - 1,
            localOffset: lastLength,
        };
    }

    return null;
};

/**
 * Get absolute offset for start of a node
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} nodeIndex - Index of the node
 * @returns {number}
 */
export const getNodeStartOffset = (children, nodeIndex) => {
    let offset = 0;
    for (let i = 0; i < nodeIndex && i < children.length; i++) {
        const child = children[i];
        if (isTextNode(child)) {
            offset += child.text.length;
        } else if (isLinkNode(child)) {
            offset += getPlainText(child.children).length;
        } else if (isInlineCodeNode(child)) {
            offset += child.text.length;
        }
    }
    return offset;
};

// ============================================================================
// Block Operations
// ============================================================================

/**
 * Clone a block (deep copy)
 * @param {import('./ast-types.js').Block} block
 * @param {boolean} [newId=false] - Generate new ID
 * @returns {import('./ast-types.js').Block}
 */
export const cloneBlock = (block, newId = false) => ({
    id: newId ? generateId() : block.id,
    type: block.type,
    children: normalizeChildren(block.children),
    metadata: block.metadata ? { ...block.metadata } : {},
});

/**
 * Check if a block is empty
 * @param {import('./ast-types.js').Block} block
 * @returns {boolean}
 */
export const isBlockEmpty = (block) => {
    const text = getPlainText(block.children);
    return text.length === 0;
};

/**
 * Check if children array has any formatting
 * @param {import('./ast-types.js').InlineNode[]} children
 * @returns {boolean}
 */
export const hasFormatting = (children) => {
    for (const child of children) {
        if (isTextNode(child) && child.marks && child.marks.length > 0) {
            return true;
        }
        if (isLinkNode(child)) {
            return true; // Links are formatting
        }
        if (isInlineCodeNode(child)) {
            return true; // Inline code is formatting
        }
    }
    return false;
};

// ============================================================================
// Selection Helpers
// ============================================================================

/**
 * Check if selection spans entire block content
 * @param {import('./ast-types.js').Block} block
 * @param {number} startOffset
 * @param {number} endOffset
 * @returns {boolean}
 */
export const isFullBlockSelection = (block, startOffset, endOffset) => {
    const length = getTextLength(block.children);
    return startOffset === 0 && endOffset >= length;
};

/**
 * Get marks at a specific offset
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} offset
 * @returns {import('./ast-types.js').Mark[]}
 */
export const getMarksAtOffset = (children, offset) => {
    const result = findNodeAtOffset(children, offset);
    if (!result) return [];

    const { node } = result;
    if (isTextNode(node)) {
        return node.marks || [];
    }
    return [];
};

/**
 * Check if all nodes in a range have a specific mark
 * @param {import('./ast-types.js').InlineNode[]} children
 * @param {number} startOffset
 * @param {number} endOffset
 * @param {string} markType
 * @returns {boolean}
 */
export const rangeHasMark = (children, startOffset, endOffset, markType) => {
    if (startOffset >= endOffset) return false;

    let currentOffset = 0;

    for (const child of children) {
        if (!isTextNode(child)) {
            const length = isLinkNode(child)
                ? getPlainText(child.children).length
                : isInlineCodeNode(child)
                ? child.text.length
                : 0;
            currentOffset += length;
            continue;
        }

        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + child.text.length;

        // Check if this node overlaps with the range
        if (nodeEnd > startOffset && nodeStart < endOffset) {
            // This node is in the range - check if it has the mark
            if (!hasMark(child, markType)) {
                return false;
            }
        }

        currentOffset = nodeEnd;
    }

    return true;
};

export default {
    // ID
    generateId,
    // Creation
    createTextNode,
    createLinkNode,
    createInlineCodeNode,
    createBlock,
    createEmptyParagraph,
    createMark,
    // Marks
    applyMark,
    removeMark,
    toggleMark,
    hasMark,
    getMark,
    // Node manipulation
    splitTextNode,
    mergeAdjacentTextNodes,
    normalizeChildren,
    // Text extraction
    getPlainText,
    getTextLength,
    // Finding
    findNodeAtOffset,
    getNodeStartOffset,
    // Block operations
    cloneBlock,
    isBlockEmpty,
    hasFormatting,
    // Selection
    isFullBlockSelection,
    getMarksAtOffset,
    rangeHasMark,
};
