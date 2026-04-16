/**
 * AST (Abstract Syntax Tree) Type Definitions for Block Editor
 *
 * This module defines the structure of content using a tree-based representation
 * instead of raw HTML strings. This provides:
 * - Reliable formatting operations
 * - Easy undo/redo implementation
 * - Support for collaborative editing
 * - Consistent serialization/deserialization
 */

// ============================================================================
// Mark Types (Inline Formatting)
// ============================================================================

/**
 * @typedef {Object} BoldMark
 * @property {'bold'} type
 */

/**
 * @typedef {Object} ItalicMark
 * @property {'italic'} type
 */

/**
 * @typedef {Object} UnderlineMark
 * @property {'underline'} type
 */

/**
 * @typedef {Object} StrikethroughMark
 * @property {'strikethrough'} type
 */

/**
 * @typedef {Object} CodeMark
 * @property {'code'} type
 */

/**
 * @typedef {Object} TextColorMark
 * @property {'textColor'} type
 * @property {string} color - Color name (e.g., 'red', 'blue') or CSS color value
 */

/**
 * @typedef {Object} BackgroundColorMark
 * @property {'backgroundColor'} type
 * @property {string} color - Color name (e.g., 'yellow', 'green') or CSS color value
 */

/**
 * @typedef {BoldMark | ItalicMark | UnderlineMark | StrikethroughMark | CodeMark | TextColorMark | BackgroundColorMark} Mark
 */

// ============================================================================
// Inline Node Types (Content within blocks)
// ============================================================================

/**
 * @typedef {Object} TextNode
 * @property {'text'} type
 * @property {string} text - The actual text content
 * @property {Mark[]} [marks] - Array of formatting marks applied to this text
 */

/**
 * @typedef {Object} LinkNode
 * @property {'link'} type
 * @property {string} url - The URL of the link
 * @property {InlineNode[]} children - Child nodes (usually TextNodes)
 * @property {Mark[]} [marks] - Array of formatting marks applied to the link
 */

/**
 * @typedef {Object} InlineCodeNode
 * @property {'inline-code'} type
 * @property {string} text - The code content
 */

/**
 * @typedef {TextNode | LinkNode | InlineCodeNode} InlineNode
 */

// ============================================================================
// Block Types
// ============================================================================

/**
 * @typedef {'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'bulleted-list' | 'numbered-list' | 'quote'} BlockType
 */

/**
 * @typedef {Object} BlockMetadata
 * @property {number} [indentLevel] - Nesting level for lists (0-10)
 * @property {boolean} [collapsed] - Whether the block is collapsed (for future use)
 */

/**
 * @typedef {Object} Block
 * @property {string} id - Unique identifier for the block
 * @property {BlockType} type - The type of block
 * @property {InlineNode[]} children - Array of inline nodes (the content)
 * @property {BlockMetadata} [metadata] - Additional block-level data
 */

// ============================================================================
// Document Structure
// ============================================================================

/**
 * @typedef {Object} Document
 * @property {Block[]} blocks - Array of blocks in the document
 * @property {number} [version] - Document version for conflict resolution
 */

// ============================================================================
// Selection Types (for editing operations)
// ============================================================================

/**
 * Represents a point in the AST
 * @typedef {Object} ASTPoint
 * @property {string} blockId - ID of the block
 * @property {number} offset - Character offset within the block's plain text
 */

/**
 * Represents a selection range in the AST
 * @typedef {Object} ASTSelection
 * @property {ASTPoint} anchor - Start point of selection
 * @property {ASTPoint} focus - End point of selection
 * @property {boolean} isCollapsed - Whether anchor and focus are the same point
 */

// ============================================================================
// Mark Type Constants
// ============================================================================

export const MARK_TYPES = {
    BOLD: 'bold',
    ITALIC: 'italic',
    UNDERLINE: 'underline',
    STRIKETHROUGH: 'strikethrough',
    CODE: 'code',
    TEXT_COLOR: 'textColor',
    BACKGROUND_COLOR: 'backgroundColor',
};

// ============================================================================
// Block Type Constants
// ============================================================================

export const BLOCK_TYPES = {
    PARAGRAPH: 'paragraph',
    H1: 'h1',
    H2: 'h2',
    H3: 'h3',
    H4: 'h4',
    BULLETED_LIST: 'bulleted-list',
    NUMBERED_LIST: 'numbered-list',
    QUOTE: 'quote',
};

// ============================================================================
// Node Type Constants
// ============================================================================

export const NODE_TYPES = {
    TEXT: 'text',
    LINK: 'link',
    INLINE_CODE: 'inline-code',
};

// ============================================================================
// Type Guards (for runtime type checking)
// ============================================================================

/**
 * Check if a node is a text node
 * @param {InlineNode} node
 * @returns {node is TextNode}
 */
export const isTextNode = (node) => node && node.type === NODE_TYPES.TEXT;

/**
 * Check if a node is a link node
 * @param {InlineNode} node
 * @returns {node is LinkNode}
 */
export const isLinkNode = (node) => node && node.type === NODE_TYPES.LINK;

/**
 * Check if a node is an inline code node
 * @param {InlineNode} node
 * @returns {node is InlineCodeNode}
 */
export const isInlineCodeNode = (node) => node && node.type === NODE_TYPES.INLINE_CODE;

/**
 * Check if a mark is a color mark (has color property)
 * @param {Mark} mark
 * @returns {mark is TextColorMark | BackgroundColorMark}
 */
export const isColorMark = (mark) =>
    mark && (mark.type === MARK_TYPES.TEXT_COLOR || mark.type === MARK_TYPES.BACKGROUND_COLOR);

/**
 * Check if two marks are equal
 * @param {Mark} mark1
 * @param {Mark} mark2
 * @returns {boolean}
 */
export const marksEqual = (mark1, mark2) => {
    if (mark1.type !== mark2.type) return false;
    if (isColorMark(mark1) && isColorMark(mark2)) {
        return mark1.color === mark2.color;
    }
    return true;
};

/**
 * Check if two mark arrays are equal (order-independent)
 * @param {Mark[]} marks1
 * @param {Mark[]} marks2
 * @returns {boolean}
 */
export const markArraysEqual = (marks1, marks2) => {
    const m1 = marks1 || [];
    const m2 = marks2 || [];
    if (m1.length !== m2.length) return false;

    return m1.every(mark1 =>
        m2.some(mark2 => marksEqual(mark1, mark2))
    );
};

export default {
    MARK_TYPES,
    BLOCK_TYPES,
    NODE_TYPES,
    isTextNode,
    isLinkNode,
    isInlineCodeNode,
    isColorMark,
    marksEqual,
    markArraysEqual,
};
