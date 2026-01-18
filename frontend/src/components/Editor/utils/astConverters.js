/**
 * AST Converters
 *
 * Convert between AST, HTML, and DOM representations.
 * Used for:
 * - Migrating legacy HTML content to AST
 * - Syncing DOM changes back to AST
 * - Exporting AST to HTML for storage
 */

import {
    createTextNode,
    createLinkNode,
    createInlineCodeNode,
    createMark,
    normalizeChildren,
    mergeAdjacentTextNodes,
} from './ast.js';

import {
    NODE_TYPES,
    MARK_TYPES,
    isTextNode,
    isLinkNode,
    isInlineCodeNode,
} from './ast-types.js';

// ============================================================================
// HTML → AST Conversion
// ============================================================================

/**
 * Convert HTML string to AST children array
 *
 * @param {string} html - HTML string
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const htmlToAST = (html) => {
    if (!html || typeof html !== 'string') {
        return [createTextNode('')];
    }

    // Use DOMParser to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstChild;

    if (!container) {
        return [createTextNode('')];
    }

    return domToAST(container);
};

/**
 * Convert DOM node to AST children array
 *
 * @param {Node} domNode - DOM node to convert
 * @param {import('./ast-types.js').Mark[]} [inheritedMarks=[]] - Marks inherited from parent
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const domToAST = (domNode, inheritedMarks = []) => {
    const children = [];

    for (const child of domNode.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            // Text node
            const text = child.textContent || '';
            if (text) {
                children.push(createTextNode(text, [...inheritedMarks]));
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child;
            const tagName = element.tagName.toLowerCase();

            // Determine marks from this element
            const marks = [...inheritedMarks];
            let isBlockElement = false;
            let isLink = false;
            let isCode = false;

            switch (tagName) {
                case 'strong':
                case 'b':
                    marks.push(createMark(MARK_TYPES.BOLD));
                    break;

                case 'em':
                case 'i':
                    marks.push(createMark(MARK_TYPES.ITALIC));
                    break;

                case 'u':
                    marks.push(createMark(MARK_TYPES.UNDERLINE));
                    break;

                case 's':
                case 'strike':
                case 'del':
                    marks.push(createMark(MARK_TYPES.STRIKETHROUGH));
                    break;

                case 'code':
                    isCode = true;
                    break;

                case 'a':
                    isLink = true;
                    break;

                case 'span':
                    // Check for color classes
                    const className = element.className || '';
                    const highlightMatch = className.match(/highlight-(\w+)/);
                    const textColorMatch = className.match(/text-color-(\w+)/);

                    if (highlightMatch) {
                        marks.push(createMark(MARK_TYPES.BACKGROUND_COLOR, {
                            color: highlightMatch[1],
                        }));
                    }
                    if (textColorMatch) {
                        marks.push(createMark(MARK_TYPES.TEXT_COLOR, {
                            color: textColorMatch[1],
                        }));
                    }

                    // Check for inline styles
                    const style = element.style;
                    if (style.backgroundColor) {
                        marks.push(createMark(MARK_TYPES.BACKGROUND_COLOR, {
                            color: style.backgroundColor,
                        }));
                    }
                    if (style.color) {
                        marks.push(createMark(MARK_TYPES.TEXT_COLOR, {
                            color: style.color,
                        }));
                    }
                    break;

                case 'br':
                    // Line break - convert to newline
                    children.push(createTextNode('\n', [...inheritedMarks]));
                    continue;

                case 'div':
                case 'p':
                    // Block elements - treat as line breaks between them
                    isBlockElement = true;
                    break;

                default:
                    // Unknown element - just extract content
                    break;
            }

            if (isCode) {
                // Inline code - extract text content only
                const codeText = element.textContent || '';
                if (codeText) {
                    children.push(createInlineCodeNode(codeText));
                }
            } else if (isLink) {
                // Link element
                const url = element.getAttribute('href') || '';
                const linkChildren = domToAST(element, marks);

                if (linkChildren.length > 0) {
                    children.push(createLinkNode(url, linkChildren));
                }
            } else {
                // Regular element - recurse into children with accumulated marks
                const elementChildren = domToAST(element, marks);
                children.push(...elementChildren);
            }

            // Add implicit newline after block elements (except last one)
            if (isBlockElement && element.nextSibling) {
                children.push(createTextNode('\n', []));
            }
        }
    }

    return normalizeChildren(children);
};

/**
 * Extract marks from a DOM element (for sync purposes)
 *
 * @param {Element} element - DOM element
 * @returns {import('./ast-types.js').Mark[]}
 */
export const extractMarksFromElement = (element) => {
    const marks = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
        const tagName = current.tagName.toLowerCase();

        switch (tagName) {
            case 'strong':
            case 'b':
                marks.push(createMark(MARK_TYPES.BOLD));
                break;

            case 'em':
            case 'i':
                marks.push(createMark(MARK_TYPES.ITALIC));
                break;

            case 'u':
                marks.push(createMark(MARK_TYPES.UNDERLINE));
                break;

            case 's':
            case 'strike':
            case 'del':
                marks.push(createMark(MARK_TYPES.STRIKETHROUGH));
                break;

            case 'code':
                marks.push(createMark(MARK_TYPES.CODE));
                break;

            case 'span':
                const className = current.className || '';
                const highlightMatch = className.match(/highlight-(\w+)/);
                const textColorMatch = className.match(/text-color-(\w+)/);

                if (highlightMatch) {
                    marks.push(createMark(MARK_TYPES.BACKGROUND_COLOR, {
                        color: highlightMatch[1],
                    }));
                }
                if (textColorMatch) {
                    marks.push(createMark(MARK_TYPES.TEXT_COLOR, {
                        color: textColorMatch[1],
                    }));
                }
                break;
        }

        current = current.parentElement;
    }

    return marks;
};

// ============================================================================
// AST → HTML Conversion
// ============================================================================

/**
 * Convert AST children to HTML string
 *
 * @param {import('./ast-types.js').InlineNode[]} children
 * @returns {string}
 */
export const astToHTML = (children) => {
    if (!children || children.length === 0) {
        return '';
    }

    return children.map(nodeToHTML).join('');
};

/**
 * Validate URL to prevent XSS attacks via javascript: or data: protocols
 *
 * @param {string} url
 * @returns {boolean}
 */
const isUrlSafe = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    // Block dangerous protocols
    if (trimmed.startsWith('javascript:')) return false;
    if (trimmed.startsWith('data:')) return false;
    if (trimmed.startsWith('vbscript:')) return false;
    return true;
};

/**
 * Convert a single AST node to HTML string
 *
 * @param {import('./ast-types.js').InlineNode} node
 * @returns {string}
 */
const nodeToHTML = (node) => {
    if (isTextNode(node)) {
        let html = escapeHTML(node.text);

        if (node.marks && node.marks.length > 0) {
            // Apply marks from innermost to outermost
            for (const mark of node.marks) {
                html = wrapWithMark(html, mark);
            }
        }

        return html;
    }

    if (isLinkNode(node)) {
        const innerHTML = node.children.map(nodeToHTML).join('');
        // Validate URL to prevent XSS via javascript: protocol
        const safeUrl = isUrlSafe(node.url) ? escapeAttr(node.url) : '#';
        let html = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${innerHTML}</a>`;

        if (node.marks && node.marks.length > 0) {
            for (const mark of node.marks) {
                html = wrapWithMark(html, mark);
            }
        }

        return html;
    }

    if (isInlineCodeNode(node)) {
        return `<code>${escapeHTML(node.text)}</code>`;
    }

    return '';
};

/**
 * Wrap HTML content with a mark's HTML tag
 *
 * @param {string} html - Inner HTML
 * @param {import('./ast-types.js').Mark} mark
 * @returns {string}
 */
const wrapWithMark = (html, mark) => {
    switch (mark.type) {
        case MARK_TYPES.BOLD:
            return `<strong>${html}</strong>`;

        case MARK_TYPES.ITALIC:
            return `<em>${html}</em>`;

        case MARK_TYPES.UNDERLINE:
            return `<u>${html}</u>`;

        case MARK_TYPES.STRIKETHROUGH:
            return `<s>${html}</s>`;

        case MARK_TYPES.CODE:
            return `<code>${html}</code>`;

        case MARK_TYPES.TEXT_COLOR:
            return `<span class="text-color-${mark.color}">${html}</span>`;

        case MARK_TYPES.BACKGROUND_COLOR:
            return `<span class="highlight-${mark.color}">${html}</span>`;

        default:
            return html;
    }
};

/**
 * Escape HTML special characters
 *
 * @param {string} text
 * @returns {string}
 */
const escapeHTML = (text) => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/**
 * Escape attribute value
 *
 * @param {string} value
 * @returns {string}
 */
const escapeAttr = (value) => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// ============================================================================
// DOM Sync (for contentEditable changes)
// ============================================================================

/**
 * Sync DOM content back to AST
 * Called after contentEditable changes to update the AST state
 *
 * @param {Element} blockElement - The block's DOM element
 * @returns {import('./ast-types.js').InlineNode[]}
 */
export const syncDOMToAST = (blockElement) => {
    if (!blockElement) {
        return [createTextNode('')];
    }

    return domToAST(blockElement);
};

/**
 * Get cursor offset in terms of plain text position
 *
 * @param {Element} blockElement - The block's DOM element
 * @param {Node} anchorNode - Selection anchor node
 * @param {number} anchorOffset - Selection anchor offset
 * @returns {number} Plain text offset
 */
export const domOffsetToASTOffset = (blockElement, anchorNode, anchorOffset) => {
    // Create a range from start of block to cursor position
    const range = document.createRange();
    range.setStart(blockElement, 0);
    range.setEnd(anchorNode, anchorOffset);

    // Get text content of the range
    return range.toString().length;
};

/**
 * Convert AST offset to DOM position
 *
 * @param {Element} blockElement - The block's DOM element
 * @param {number} offset - AST offset (plain text position)
 * @returns {{ node: Node, offset: number } | null}
 */
export const astOffsetToDOM = (blockElement, offset) => {
    const walker = document.createTreeWalker(
        blockElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let currentOffset = 0;
    let node;

    while ((node = walker.nextNode())) {
        const nodeLength = node.textContent?.length || 0;

        if (currentOffset + nodeLength >= offset) {
            return {
                node,
                offset: offset - currentOffset,
            };
        }

        currentOffset += nodeLength;
    }

    // If offset is beyond content, return end of last text node
    const lastTextNode = getLastTextNode(blockElement);
    if (lastTextNode) {
        return {
            node: lastTextNode,
            offset: lastTextNode.textContent?.length || 0,
        };
    }

    // Fallback to block element itself
    return {
        node: blockElement,
        offset: 0,
    };
};

/**
 * Get the last text node in an element
 */
const getLastTextNode = (element) => {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let lastNode = null;
    let node;

    while ((node = walker.nextNode())) {
        lastNode = node;
    }

    return lastNode;
};

// ============================================================================
// Selection Helpers
// ============================================================================

/**
 * Get current selection as AST offsets
 *
 * @param {Element} blockElement
 * @returns {{ startOffset: number, endOffset: number, isCollapsed: boolean } | null}
 */
export const getSelectionAsASTOffsets = (blockElement) => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const range = selection.getRangeAt(0);

    // Check if selection is within the block
    if (!blockElement.contains(range.startContainer)) {
        return null;
    }

    const startOffset = domOffsetToASTOffset(
        blockElement,
        range.startContainer,
        range.startOffset
    );

    const endOffset = domOffsetToASTOffset(
        blockElement,
        range.endContainer,
        range.endOffset
    );

    return {
        startOffset: Math.min(startOffset, endOffset),
        endOffset: Math.max(startOffset, endOffset),
        isCollapsed: range.collapsed,
    };
};

/**
 * Set selection from AST offsets
 *
 * @param {Element} blockElement
 * @param {number} startOffset
 * @param {number} endOffset
 */
export const setSelectionFromASTOffsets = (blockElement, startOffset, endOffset) => {
    const startPos = astOffsetToDOM(blockElement, startOffset);
    const endPos = astOffsetToDOM(blockElement, endOffset);

    if (!startPos || !endPos) {
        return;
    }

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);

    selection.removeAllRanges();
    selection.addRange(range);
};

// ============================================================================
// Export
// ============================================================================

export default {
    // HTML → AST
    htmlToAST,
    domToAST,
    extractMarksFromElement,

    // AST → HTML
    astToHTML,

    // DOM Sync
    syncDOMToAST,
    domOffsetToASTOffset,
    astOffsetToDOM,

    // Selection
    getSelectionAsASTOffsets,
    setSelectionFromASTOffsets,
};
