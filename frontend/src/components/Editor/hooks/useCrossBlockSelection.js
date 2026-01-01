import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom clipboard format identifier for wiki blocks.
 */
export const WIKI_BLOCKS_MIME_TYPE = 'application/x-wiki-blocks';

/**
 * Custom hook for managing cross-block text selection.
 * Handles selection tracking, content extraction, and keyboard-based selection.
 */
export function useCrossBlockSelection({ editorRef, state, actions }) {
    // Tracks the current cross-block selection details
    const [crossSelection, setCrossSelection] = useState(null);
    const selectionChangeRef = useRef(null);

    /**
     * Extracts text content from a DOM node, handling nested elements.
     */
    const extractTextContent = useCallback((node) => {
        const div = document.createElement('div');
        div.innerHTML = node.innerHTML || node.textContent || '';
        return div.textContent || div.innerText || '';
    }, []);

    /**
     * Gets the block element and its ID from a DOM node.
     */
    const getBlockFromNode = useCallback((node) => {
        if (!node) return null;
        const blockEl = node.nodeType === Node.ELEMENT_NODE
            ? node.closest('[data-block-id]')
            : node.parentElement?.closest('[data-block-id]');
        if (!blockEl) return null;
        return {
            element: blockEl,
            id: blockEl.getAttribute('data-block-id'),
        };
    }, []);

    /**
     * Gets partial content from a block based on selection range.
     * @param {Element} blockEl - The block element
     * @param {Range} range - The selection range
     * @param {string} position - 'start', 'middle', or 'end'
     */
    const getPartialContent = useCallback((blockEl, range, position) => {
        const contentEl = blockEl.querySelector('.block-content');
        if (!contentEl) return { content: '', isPartial: { start: false, end: false } };

        const blockRange = document.createRange();
        blockRange.selectNodeContents(contentEl);

        let content = '';
        let isPartial = { start: false, end: false };

        if (position === 'start') {
            // From selection start to end of block
            blockRange.setStart(range.startContainer, range.startOffset);
            content = blockRange.toString();
            isPartial = { start: true, end: false };
        } else if (position === 'end') {
            // From block start to selection end
            blockRange.setEnd(range.endContainer, range.endOffset);
            content = blockRange.toString();
            isPartial = { start: false, end: true };
        } else {
            // Full block content
            content = extractTextContent(contentEl);
            isPartial = { start: false, end: false };
        }

        return { content, isPartial };
    }, [extractTextContent]);

    /**
     * Extracts selected content across multiple blocks.
     * Returns structured data suitable for clipboard operations.
     */
    const getSelectedContent = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return null;

        const range = sel.getRangeAt(0);
        const startBlock = getBlockFromNode(range.startContainer);
        const endBlock = getBlockFromNode(range.endContainer);

        if (!startBlock || !endBlock) return null;

        // Single block selection
        if (startBlock.id === endBlock.id) {
            const block = state.blocks.find(b => b.id === startBlock.id);
            if (!block) return null;

            const content = range.toString();
            return {
                blocks: [{
                    type: block.type,
                    content,
                    isPartial: { start: true, end: true },
                }],
                plainText: content,
                htmlText: `<p>${content}</p>`,
                isSingleBlock: true,
                startBlockId: startBlock.id,
                endBlockId: endBlock.id,
            };
        }

        // Multi-block selection
        const blocks = [];
        const startIndex = state.blocks.findIndex(b => b.id === startBlock.id);
        const endIndex = state.blocks.findIndex(b => b.id === endBlock.id);

        if (startIndex === -1 || endIndex === -1) return null;

        const [minIndex, maxIndex] = startIndex < endIndex
            ? [startIndex, endIndex]
            : [endIndex, startIndex];

        for (let i = minIndex; i <= maxIndex; i++) {
            const block = state.blocks[i];
            const blockEl = editorRef.current?.querySelector(`[data-block-id="${block.id}"]`);
            if (!blockEl) continue;

            let position = 'middle';
            if (i === minIndex && startIndex <= endIndex) position = 'start';
            else if (i === minIndex && startIndex > endIndex) position = 'end';
            else if (i === maxIndex && startIndex <= endIndex) position = 'end';
            else if (i === maxIndex && startIndex > endIndex) position = 'start';

            const { content, isPartial } = getPartialContent(blockEl, range, position);

            blocks.push({
                type: block.type,
                content,
                isPartial,
                originalId: block.id,
            });
        }

        // Generate plain text (newline separated)
        const plainText = blocks.map(b => b.content).join('\n');

        // Generate HTML representation
        const htmlText = blocks.map(b => {
            const tag = b.type === 'h1' ? 'h1' : b.type === 'h2' ? 'h2' : b.type === 'h3' ? 'h3' :
                b.type === 'quote' ? 'blockquote' : b.type.includes('list') ? 'li' : 'p';
            return `<${tag}>${b.content}</${tag}>`;
        }).join('');

        return {
            blocks,
            plainText,
            htmlText,
            isSingleBlock: false,
            startBlockId: startBlock.id,
            endBlockId: endBlock.id,
        };
    }, [state.blocks, editorRef, getBlockFromNode, getPartialContent]);

    /**
     * Handles keyboard-based cross-block selection extension.
     * Supports Shift+Arrow to extend selection across blocks.
     */
    const handleKeyboardSelection = useCallback((e) => {
        // Only handle selection-extending keys with Shift
        if (!e.shiftKey) return false;

        const sel = window.getSelection();
        if (!sel.rangeCount) return false;

        const range = sel.getRangeAt(0);
        const isAtStart = range.collapsed && sel.anchorOffset === 0;
        const activeBlock = getBlockFromNode(sel.focusNode);

        if (!activeBlock) return false;

        const blockIndex = state.blocks.findIndex(b => b.id === activeBlock.id);
        if (blockIndex === -1) return false;

        // Shift+Up at start of block → extend to previous block
        if (e.key === 'ArrowUp' && isAtStart && blockIndex > 0) {
            e.preventDefault();
            const prevBlock = state.blocks[blockIndex - 1];
            const prevEl = editorRef.current?.querySelector(
                `[data-block-id="${prevBlock.id}"] .block-content`
            );
            if (prevEl) {
                range.setStart(prevEl, 0);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            return true;
        }

        // Shift+Down at end of block → extend to next block
        const contentEl = activeBlock.element.querySelector('.block-content');
        const textLength = contentEl ? extractTextContent(contentEl).length : 0;
        const isAtEnd = sel.focusOffset >= textLength;

        if (e.key === 'ArrowDown' && isAtEnd && blockIndex < state.blocks.length - 1) {
            e.preventDefault();
            const nextBlock = state.blocks[blockIndex + 1];
            const nextEl = editorRef.current?.querySelector(
                `[data-block-id="${nextBlock.id}"] .block-content`
            );
            if (nextEl) {
                const newRange = document.createRange();
                newRange.setStart(range.startContainer, range.startOffset);
                if (nextEl.lastChild) {
                    const lastNode = nextEl.lastChild;
                    if (lastNode.nodeType === Node.TEXT_NODE) {
                        newRange.setEnd(lastNode, lastNode.textContent.length);
                    } else {
                        newRange.setEndAfter(lastNode);
                    }
                } else {
                    newRange.setEnd(nextEl, 0);
                }
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
            return true;
        }

        // Shift+Ctrl+Home → select to document start
        if (e.key === 'Home' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const firstBlock = state.blocks[0];
            const firstEl = editorRef.current?.querySelector(
                `[data-block-id="${firstBlock.id}"] .block-content`
            );
            if (firstEl) {
                range.setStart(firstEl, 0);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            return true;
        }

        // Shift+Ctrl+End → select to document end
        if (e.key === 'End' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const lastBlock = state.blocks[state.blocks.length - 1];
            const lastEl = editorRef.current?.querySelector(
                `[data-block-id="${lastBlock.id}"] .block-content`
            );
            if (lastEl) {
                const newRange = document.createRange();
                newRange.setStart(range.startContainer, range.startOffset);
                if (lastEl.lastChild) {
                    const lastNode = lastEl.lastChild;
                    if (lastNode.nodeType === Node.TEXT_NODE) {
                        newRange.setEnd(lastNode, lastNode.textContent.length);
                    } else {
                        newRange.setEndAfter(lastNode);
                    }
                } else {
                    newRange.setEnd(lastEl, 0);
                }
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
            return true;
        }

        return false;
    }, [state.blocks, editorRef, getBlockFromNode, extractTextContent]);

    /**
     * Gets selection info for deletion operations.
     * Returns data needed to delete content and merge blocks.
     */
    const getSelectionForDeletion = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return null;

        const range = sel.getRangeAt(0);
        const startBlock = getBlockFromNode(range.startContainer);
        const endBlock = getBlockFromNode(range.endContainer);

        if (!startBlock || !endBlock) return null;

        const startIndex = state.blocks.findIndex(b => b.id === startBlock.id);
        const endIndex = state.blocks.findIndex(b => b.id === endBlock.id);

        if (startIndex === -1 || endIndex === -1) return null;

        // Get position info within blocks
        const startContentEl = startBlock.element.querySelector('.block-content');
        const endContentEl = endBlock.element.querySelector('.block-content');

        if (!startContentEl || !endContentEl) return null;

        // Calculate offset from block start
        const getOffsetInBlock = (node, offset) => {
            const tempRange = document.createRange();
            tempRange.setStart(startContentEl, 0);
            tempRange.setEnd(node, offset);
            return tempRange.toString().length;
        };

        const startOffset = getOffsetInBlock(range.startContainer, range.startOffset);

        // Calculate remaining content after selection in end block
        const endTempRange = document.createRange();
        endTempRange.setStart(endContentEl, 0);
        endTempRange.setEnd(range.endContainer, range.endOffset);
        const endOffset = endTempRange.toString().length;

        return {
            startBlockId: startBlock.id,
            endBlockId: endBlock.id,
            startBlockIndex: startIndex,
            endBlockIndex: endIndex,
            startOffset,
            endOffset,
            isSingleBlock: startBlock.id === endBlock.id,
        };
    }, [state.blocks, getBlockFromNode]);

    /**
     * Updates cross-selection state when selection changes.
     */
    useEffect(() => {
        const handleSelectionChange = () => {
            const content = getSelectedContent();
            setCrossSelection(content);
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [getSelectedContent]);

    return {
        crossSelection,
        getSelectedContent,
        handleKeyboardSelection,
        getSelectionForDeletion,
    };
}

export default useCrossBlockSelection;
