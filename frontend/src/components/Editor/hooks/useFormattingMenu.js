import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing the formatting menu state and actions.
 * Handles text selection detection, menu positioning, and formatting commands.
 */
export function useFormattingMenu({ editorRef, state, actions }) {
    const [menu, setMenu] = useState({
        isOpen: false,
        position: { top: 0, left: 0 },
        activeSubmenu: null, // 'turnInto', 'highlight', or null
        currentBlockType: 'paragraph',
        activeFormats: {
            bold: false,
            italic: false,
            underline: false,
            strikeThrough: false,
            inlineCode: false,
            link: false,
        },
    });

    const selectionRef = useRef(null);
    const isMouseDownRef = useRef(false);
    const isApplyingFormatRef = useRef(false);

    // Set of block elements that were modified during this formatting session
    // Each entry is { blockEl, innerHTML } to capture state at modification time
    const modifiedBlocksRef = useRef(new Map());

    /**
     * Gets block element from a node.
     */
    const getBlockFromNode = useCallback((node) => {
        if (!node) return null;
        return node.nodeType === Node.TEXT_NODE
            ? node.parentElement?.closest('[data-block-id]')
            : node.closest?.('[data-block-id]');
    }, []);

    /**
     * Syncs a block's current innerHTML to state for undo history.
     * @param {Element|null} blockEl - The block element to sync, or null to detect from selection.
     */
    const syncBlockToState = useCallback((blockEl = null) => {
        const element = blockEl || (() => {
            const sel = window.getSelection();
            if (!sel?.anchorNode) return null;
            return sel.anchorNode.nodeType === Node.TEXT_NODE
                ? sel.anchorNode.parentElement?.closest('[data-block-id]')
                : sel.anchorNode?.closest?.('[data-block-id]');
        })();

        if (element) {
            const blockId = element.getAttribute('data-block-id');
            if (blockId) {
                actions.updateBlock(blockId, element.innerHTML);
            }
        }
    }, [actions]);

    /**
     * Gets the current text selection if it's within the editor.
     * Supports both single-block and cross-block selections.
     */
    const getValidSelection = useCallback(() => {
        if (!editorRef.current) return null;

        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return null;

        const range = sel.getRangeAt(0);

        // Check if start and end are within blocks in the editor
        const startBlockEl = getBlockFromNode(range.startContainer);
        const endBlockEl = getBlockFromNode(range.endContainer);

        // Both must be within blocks contained in the editor
        if (!startBlockEl || !editorRef.current.contains(startBlockEl)) {
            return null;
        }
        if (!endBlockEl || !editorRef.current.contains(endBlockEl)) {
            return null;
        }

        // For cross-block selections, use the topmost block for positioning
        // Compare vertical positions to find the block that is higher on the page
        let blockEl = startBlockEl;
        if (startBlockEl !== endBlockEl) {
            const startRect = startBlockEl.getBoundingClientRect();
            const endRect = endBlockEl.getBoundingClientRect();
            blockEl = startRect.top <= endRect.top ? startBlockEl : endBlockEl;
        }

        return { selection: sel, range, blockEl };
    }, [editorRef, getBlockFromNode]);

    /**
     * Gets the active formatting states for the current selection.
     * Uses document.queryCommandState for standard formats and checks for links, highlights, and inline code.
     */
    const getActiveFormats = useCallback(() => {
        const formats = {
            bold: false,
            italic: false,
            underline: false,
            strikeThrough: false,
            inlineCode: false,
            link: false,
            highlightColor: null, // background color, e.g., 'purple', 'blue', etc.
            textColor: null,      // text color, e.g., 'purple', 'blue', etc.
        };

        try {
            formats.bold = document.queryCommandState('bold');
            formats.italic = document.queryCommandState('italic');
            formats.underline = document.queryCommandState('underline');
            formats.strikeThrough = document.queryCommandState('strikeThrough');

            // Check if selection contains a link, highlight, or inline code
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const node = container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : container;

                formats.link = !!node?.closest('a');
                formats.inlineCode = !!node?.closest('code');

                // Check for highlight (background) colors
                const highlightColors = ['default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'magenta', 'red'];
                for (const color of highlightColors) {
                    if (node?.closest(`.highlight-${color}`)) {
                        formats.highlightColor = color;
                        break;
                    }
                }

                // Check for text colors
                for (const color of highlightColors) {
                    if (node?.closest(`.text-color-${color}`)) {
                        formats.textColor = color;
                        break;
                    }
                }
            }
        } catch (e) {
            // queryCommandState may throw in some browsers
        }

        return formats;
    }, []);

    /**
     * Opens the formatting menu above the selection.
     */
    const openMenu = useCallback(() => {
        const valid = getValidSelection();
        if (!valid) return;

        const { range } = valid;

        // Use getClientRects() to get individual rectangles for each line of selection
        // The first rect is the topmost selected text
        const rects = range.getClientRects();
        if (!rects.length) return;

        // Find the topmost rect (smallest top value)
        let topRect = rects[0];
        for (let i = 1; i < rects.length; i++) {
            if (rects[i].top < topRect.top) {
                topRect = rects[i];
            }
        }

        // Get current block type
        const { blockEl } = valid;
        const currentBlockType = blockEl?.getAttribute('data-block-type') || 'paragraph';

        // Get active formatting states
        const activeFormats = getActiveFormats();

        // Position menu above the topmost selection
        setMenu({
            isOpen: true,
            position: {
                top: topRect.top - 8,
                left: topRect.left + (topRect.width / 2),
            },
            activeSubmenu: null,
            currentBlockType,
            activeFormats,
        });

        selectionRef.current = range.cloneRange();
    }, [getValidSelection, getActiveFormats]);

    /**
     * Closes the formatting menu.
     * Syncs all modified blocks to state for undo/redo history before closing.
     */
    const closeMenu = useCallback(() => {
        // Sync all modified blocks to state for undo/redo history
        if (modifiedBlocksRef.current.size > 0) {
            modifiedBlocksRef.current.forEach((savedHTML, blockEl) => {
                if (blockEl && blockEl.isConnected) {
                    const blockId = blockEl.getAttribute('data-block-id');
                    if (blockId && savedHTML) {
                        actions.updateBlock(blockId, savedHTML);
                    }
                }
            });
            modifiedBlocksRef.current.clear();
        }

        setMenu(prev => ({ ...prev, isOpen: false, activeSubmenu: null }));
    }, [actions]);

    /**
     * Toggles a submenu open/closed.
     * Re-saves the current selection when opening a submenu to ensure it's valid.
     */
    const toggleSubmenu = useCallback((submenuName) => {
        // Re-save the current selection to keep it fresh
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && !sel.isCollapsed) {
            selectionRef.current = sel.getRangeAt(0).cloneRange();
        }

        setMenu(prev => ({
            ...prev,
            activeSubmenu: prev.activeSubmenu === submenuName ? null : submenuName,
        }));
    }, []);

    /**
     * Updates only the active formats in the menu without causing re-renders.
     */
    const updateActiveFormats = useCallback(() => {
        const newFormats = getActiveFormats();
        setMenu(prev => ({ ...prev, activeFormats: newFormats }));
    }, [getActiveFormats]);

    /**
     * Marks a block as modified by saving its current innerHTML.
     * The saved HTML will be synced to state when menu closes.
     */
    const markBlockModified = useCallback((blockEl) => {
        if (blockEl && blockEl.isConnected) {
            const innerHTML = blockEl.innerHTML;
            modifiedBlocksRef.current.set(blockEl, innerHTML);
        }
    }, []);

    /**
     * Restores the saved selection before applying formatting.
     */
    const restoreSelection = useCallback(() => {
        if (!selectionRef.current) {
            return false;
        }

        try {
            const sel = window.getSelection();
            sel.removeAllRanges();
            // Clone the range before adding it to avoid mutation issues
            sel.addRange(selectionRef.current.cloneRange());
            return true;
        } catch (e) {
            return false;
        }
    }, []);

    /**
     * Removes highlight spans from the selection.
     */
    const removeExistingHighlights = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const blockEl = container.nodeType === Node.TEXT_NODE
            ? container.parentElement?.closest('[data-block-id]')
            : container.closest?.('[data-block-id]');

        if (!blockEl) return;

        const highlightClasses = [
            'highlight-default', 'highlight-gray', 'highlight-brown', 'highlight-orange',
            'highlight-yellow', 'highlight-green', 'highlight-blue', 'highlight-purple',
            'highlight-magenta', 'highlight-red',
        ];

        const spans = blockEl.querySelectorAll('span');
        spans.forEach(span => {
            const hasHighlightClass = highlightClasses.some(cls => span.classList.contains(cls));
            if (hasHighlightClass && range.intersectsNode(span)) {
                // Replace span with its text content
                const text = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(text, span);
            }
        });

        // Normalize to merge adjacent text nodes
        blockEl.normalize();
    }, []);

    /**
     * Applies inline formatting (bold, italic, etc.).
     * For 'inlineCode', uses custom wrapping since execCommand doesn't support it.
     */
    const applyFormat = useCallback((command) => {
        const sel = window.getSelection();

        // For inline code, try to use current selection if it's valid
        // because after multiple execCommands the saved range may become invalid
        const useCurrentSelection = command === 'inlineCode' &&
                                   sel.rangeCount > 0 &&
                                   !sel.isCollapsed &&
                                   sel.toString().trim() !== '';

        if (!useCurrentSelection && !restoreSelection()) {
            return;
        }

        // Set flag to prevent menu from closing during format application
        isApplyingFormatRef.current = true;

        try {
            // Handle inline code specially since execCommand doesn't support it
            if (command === 'inlineCode') {
                // Use current selection (already validated above)
                if (!sel.rangeCount || sel.isCollapsed) {
                    return;
                }

                const range = sel.getRangeAt(0);
                const selectedText = range.toString();
                if (!selectedText) return;

                const container = range.commonAncestorContainer;
                const blockEl = container.nodeType === Node.TEXT_NODE
                    ? container.parentElement?.closest('[data-block-id]')
                    : container.closest?.('[data-block-id]');

                if (!blockEl) return;

                // Check if already inside a code element
                const node = container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : container;
                const existingCode = node?.closest('code');

                if (existingCode) {
                    // Remove the code wrapper (toggle off)
                    const parent = existingCode.parentNode;
                    while (existingCode.firstChild) {
                        parent.insertBefore(existingCode.firstChild, existingCode);
                    }
                    parent.removeChild(existingCode);
                    blockEl.normalize();

                    // Mark block as modified for undo history
                    markBlockModified(blockEl);

                    // Need to recreate selection after removing code element
                    const textContent = blockEl.textContent || '';
                    const textIndex = textContent.indexOf(selectedText);

                    if (textIndex !== -1) {
                        let currentPos = 0;
                        const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
                        let node;

                        while ((node = walker.nextNode())) {
                            const nodeLen = node.textContent.length;
                            if (currentPos + nodeLen > textIndex) {
                                const startOffset = textIndex - currentPos;
                                const endOffset = startOffset + selectedText.length;

                                if (endOffset <= nodeLen) {
                                    // Selection is within this single text node
                                    const newRange = document.createRange();
                                    newRange.setStart(node, startOffset);
                                    newRange.setEnd(node, endOffset);

                                    sel.removeAllRanges();
                                    sel.addRange(newRange);
                                    selectionRef.current = newRange.cloneRange();
                                }
                                break;
                            }
                            currentPos += nodeLen;
                        }
                    }
                } else {
                    // Wrap selection in <code>
                    const codeEl = document.createElement('code');
                    try {
                        const contents = range.extractContents();
                        codeEl.appendChild(contents);
                        range.insertNode(codeEl);

                        // Select the new code element contents
                        const newRange = document.createRange();
                        newRange.selectNodeContents(codeEl);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                        selectionRef.current = newRange.cloneRange();
                    } catch (e) {
                        // Fallback
                        codeEl.textContent = selectedText;
                        range.deleteContents();
                        range.insertNode(codeEl);
                    }

                    // Mark block as modified for undo history
                    markBlockModified(blockEl);
                }

                // DON'T sync or update state immediately - it causes re-render which loses selection
                return;
            }

            // Standard execCommand for other formats
            document.execCommand(command, false, null);

            // Save the updated selection after execCommand changes the DOM
            const updatedSel = window.getSelection();
            if (updatedSel.rangeCount > 0 && !updatedSel.isCollapsed) {
                selectionRef.current = updatedSel.getRangeAt(0).cloneRange();

                // Mark block as modified for undo history
                const blockEl = getBlockFromNode(updatedSel.anchorNode);
                if (blockEl) {
                    markBlockModified(blockEl);
                }
            }

            // DON'T sync or update state immediately - delays will handle it
        } finally {
            // Reset flag and update active formats after a delay
            setTimeout(() => {
                isApplyingFormatRef.current = false;
                updateActiveFormats();

                // Schedule selection restoration in next event loop tick
                setTimeout(() => {
                    const sel2 = window.getSelection();

                    if ((!sel2.rangeCount || sel2.isCollapsed) && selectionRef.current) {
                        try {
                            sel2.removeAllRanges();
                            sel2.addRange(selectionRef.current.cloneRange());
                        } catch (e) {
                            // Selection restoration failed
                        }
                    }
                }, 0);
            }, 100);
        }
    }, [restoreSelection, getActiveFormats, syncBlockToState, updateActiveFormats]);

    /**
     * Applies a highlight to the selected text.
     * Supports cross-block selections.
     * When colorName is 'default', removes existing highlights without adding new span.
     */
    const applyHighlight = useCallback((colorName) => {
        if (!restoreSelection()) {
            return;
        }

        // Set flag to prevent menu from closing during highlight application
        isApplyingFormatRef.current = true;

        try {
            const sel = window.getSelection();
            if (!sel.rangeCount || sel.isCollapsed) {
                return;
            }

            const range = sel.getRangeAt(0);
            const selectedText = range.toString();

            if (!selectedText) {
                return;
            }

            const className = `highlight-${colorName}`;

            const highlightClasses = [
                'highlight-default', 'highlight-gray', 'highlight-brown', 'highlight-orange',
                'highlight-yellow', 'highlight-green', 'highlight-blue', 'highlight-purple',
                'highlight-magenta', 'highlight-red',
            ];

            // Get all blocks that intersect with the selection
            const editorEl = editorRef.current;
            if (!editorEl) return;

            const allBlocks = editorEl.querySelectorAll('[data-block-id]');
            const intersectingBlocks = Array.from(allBlocks).filter(block =>
                range.intersectsNode(block)
            );

            if (intersectingBlocks.length === 0) return;

            // For single block selection
            if (intersectingBlocks.length === 1) {
                const blockEl = intersectingBlocks[0];

                // Remove existing highlight spans in selection
                const spans = Array.from(blockEl.querySelectorAll('span'));
                const intersectingSpans = spans.filter(span => {
                    const hasHighlightClass = highlightClasses.some(cls => span.classList.contains(cls));
                    return hasHighlightClass && range.intersectsNode(span);
                });

                intersectingSpans.forEach(span => {
                    const parent = span.parentNode;
                    while (span.firstChild) {
                        parent.insertBefore(span.firstChild, span);
                    }
                    parent.removeChild(span);
                });

                blockEl.normalize();

                // If colorName is 'default', we're done - just removing existing highlights
                if (colorName === 'default') {
                    // Mark block as modified for undo history
                    markBlockModified(blockEl);

                    // Need to recreate selection after removing spans
                    const textContent = blockEl.textContent || '';
                    const textIndex = textContent.indexOf(selectedText);

                    let selectionRecreated = false;

                    if (textIndex !== -1) {
                        let currentPos = 0;
                        const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
                        let node;

                        while ((node = walker.nextNode())) {
                            const nodeLen = node.textContent.length;
                            if (currentPos + nodeLen > textIndex) {
                                const startOffset = textIndex - currentPos;
                                const endOffset = startOffset + selectedText.length;

                                if (endOffset <= nodeLen) {
                                    // Selection is within this single text node
                                    const newRange = document.createRange();
                                    newRange.setStart(node, startOffset);
                                    newRange.setEnd(node, endOffset);

                                    sel.removeAllRanges();
                                    sel.addRange(newRange);
                                    selectionRef.current = newRange.cloneRange();
                                    selectionRecreated = true;
                                }
                                break;
                            }
                            currentPos += nodeLen;
                        }
                    }

                    // If we couldn't recreate selection, try to restore the saved one
                    if (!selectionRecreated) {
                        restoreSelection();
                    }

                    // DON'T sync or update state immediately - it causes re-render which loses selection
                    return;
                }

                // Try to restore selection
                restoreSelection();

                const newSel = window.getSelection();

                // If selection was lost after removing spans, use fallback with saved text
                if (!newSel.rangeCount || newSel.isCollapsed) {
                    // Find position in block text and insert there
                    const textContent = blockEl.textContent || '';
                    const textIndex = textContent.indexOf(selectedText);

                    if (textIndex !== -1) {
                        // Create a tree walker to find the text node and position
                        let currentPos = 0;
                        const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
                        let node;

                        while ((node = walker.nextNode())) {
                            const nodeLen = node.textContent.length;
                            if (currentPos + nodeLen > textIndex) {
                                // Found the node containing start of selection
                                const startOffset = textIndex - currentPos;
                                const endOffset = startOffset + selectedText.length;

                                if (endOffset <= nodeLen) {
                                    // Selection is within this single text node
                                    const newRange = document.createRange();
                                    newRange.setStart(node, startOffset);
                                    newRange.setEnd(node, endOffset);

                                    // Create span and extract contents into it
                                    const span = document.createElement('span');
                                    span.className = className;
                                    const contents = newRange.extractContents();
                                    span.appendChild(contents);
                                    newRange.insertNode(span);

                                    const finalRange = document.createRange();
                                    finalRange.selectNodeContents(span);
                                    newSel.removeAllRanges();
                                    newSel.addRange(finalRange);
                                    selectionRef.current = finalRange.cloneRange();

                                    // Mark block as modified for undo history
                                    markBlockModified(blockEl);
                                }
                                break;
                            }
                            currentPos += nodeLen;
                        }
                    }

                    return;
                }

                const newRange = newSel.getRangeAt(0);

                // Get the contents first
                let contents;
                try {
                    contents = newRange.extractContents();
                } catch (e) {
                    // Fallback if extraction fails
                    const span = document.createElement('span');
                    span.className = className;
                    span.textContent = selectedText;
                    newRange.deleteContents();
                    newRange.insertNode(span);

                    const finalRange = document.createRange();
                    finalRange.selectNodeContents(span);
                    newSel.removeAllRanges();
                    newSel.addRange(finalRange);
                    selectionRef.current = finalRange.cloneRange();

                    // Mark block as modified for undo history
                    markBlockModified(blockEl);

                    return;
                }

                const span = document.createElement('span');
                span.className = className;
                span.appendChild(contents);
                newRange.insertNode(span);

                const finalRange = document.createRange();
                finalRange.selectNodeContents(span);
                newSel.removeAllRanges();
                newSel.addRange(finalRange);
                selectionRef.current = finalRange.cloneRange();

                // Mark block as modified for undo history
                markBlockModified(blockEl);

                return;
            }

            // For multi-block selection, process each block separately
            intersectingBlocks.forEach((blockEl, index) => {
                // Create a range for just this block's portion of the selection
                const blockRange = document.createRange();

                if (index === 0) {
                    // First block: from selection start to end of block
                    blockRange.setStart(range.startContainer, range.startOffset);
                    blockRange.setEndAfter(blockEl.lastChild || blockEl);
                } else if (index === intersectingBlocks.length - 1) {
                    // Last block: from start of block to selection end
                    blockRange.setStartBefore(blockEl.firstChild || blockEl);
                    blockRange.setEnd(range.endContainer, range.endOffset);
                } else {
                    // Middle block: entire block content
                    blockRange.selectNodeContents(blockEl);
                }

                const blockText = blockRange.toString();
                if (!blockText) return;

                // Remove existing highlight spans in this block's range
                const spans = Array.from(blockEl.querySelectorAll('span'));
                spans.forEach(span => {
                    const hasHighlightClass = highlightClasses.some(cls => span.classList.contains(cls));
                    if (hasHighlightClass && blockRange.intersectsNode(span)) {
                        const parent = span.parentNode;
                        while (span.firstChild) {
                            parent.insertBefore(span.firstChild, span);
                        }
                        parent.removeChild(span);
                    }
                });

                blockEl.normalize();

                // Mark block as modified (for both adding and removing highlights)
                markBlockModified(blockEl);

                // If colorName is 'default', don't add new spans
                if (colorName === 'default') {
                    return;
                }

                // Re-create the block range after DOM changes
                const newBlockRange = document.createRange();
                try {
                    if (index === 0) {
                        newBlockRange.setStart(range.startContainer, range.startOffset);
                        newBlockRange.setEndAfter(blockEl.lastChild || blockEl);
                    } else if (index === intersectingBlocks.length - 1) {
                        newBlockRange.setStartBefore(blockEl.firstChild || blockEl);
                        newBlockRange.setEnd(range.endContainer, range.endOffset);
                    } else {
                        newBlockRange.selectNodeContents(blockEl);
                    }

                    const span = document.createElement('span');
                    span.className = className;
                    const contents = newBlockRange.extractContents();
                    span.appendChild(contents);
                    newBlockRange.insertNode(span);
                } catch (e) {
                    // Skip this block if there's an error applying highlight
                }
            });

            // Clear selection after multi-block operation
            sel.removeAllRanges();
            selectionRef.current = null;
        } finally {
            // Reset flag and update active formats after a delay
            setTimeout(() => {
                isApplyingFormatRef.current = false;
                updateActiveFormats();

                // Schedule selection restoration in next event loop tick
                setTimeout(() => {
                    const sel2 = window.getSelection();

                    if ((!sel2.rangeCount || sel2.isCollapsed) && selectionRef.current) {
                        try {
                            sel2.removeAllRanges();
                            sel2.addRange(selectionRef.current.cloneRange());
                        } catch (e) {
                            // Selection restoration failed
                        }
                    }
                }, 0);
            }, 100);
        }
    }, [restoreSelection, editorRef, getActiveFormats, syncBlockToState, updateActiveFormats]);

    /**
     * Clears highlights from the selection.
     */
    const clearHighlight = useCallback(() => {
        if (!restoreSelection()) return;

        // Get the affected block before clearing
        const sel = window.getSelection();
        const blockEl = sel.anchorNode?.nodeType === Node.TEXT_NODE
            ? sel.anchorNode.parentElement?.closest('[data-block-id]')
            : sel.anchorNode?.closest?.('[data-block-id]');

        removeExistingHighlights();

        // Sync clearing to state for undo history
        syncBlockToState(blockEl);

        // Update active formats after clearing
        const newFormats = getActiveFormats();
        setMenu(prev => ({ ...prev, activeFormats: newFormats }));
    }, [restoreSelection, removeExistingHighlights, getActiveFormats, syncBlockToState]);

    /**
     * Removes existing text color spans from the selection.
     */
    const removeExistingTextColors = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const blockEl = container.nodeType === Node.TEXT_NODE
            ? container.parentElement?.closest('[data-block-id]')
            : container.closest?.('[data-block-id]');

        if (!blockEl) return;

        const textColorClasses = [
            'text-color-default', 'text-color-gray', 'text-color-brown', 'text-color-orange',
            'text-color-yellow', 'text-color-green', 'text-color-blue', 'text-color-purple',
            'text-color-magenta', 'text-color-red',
        ];

        const spans = blockEl.querySelectorAll('span');
        spans.forEach(span => {
            const hasTextColorClass = textColorClasses.some(cls => span.classList.contains(cls));
            if (hasTextColorClass && range.intersectsNode(span)) {
                // Replace span with its text content
                const text = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(text, span);
            }
        });

        // Normalize to merge adjacent text nodes
        blockEl.normalize();
    }, []);

    /**
     * Applies a text color to the selected text.
     * Handles removal of existing text-color spans and 'default' case.
     */
    const applyTextColor = useCallback((colorName) => {
        if (!restoreSelection()) {
            return;
        }

        // Set flag to prevent menu from closing during text color application
        isApplyingFormatRef.current = true;

        try {
            const sel = window.getSelection();

            if (!sel.rangeCount || sel.isCollapsed) {
                return;
            }

            const range = sel.getRangeAt(0);
            const selectedText = range.toString();

            if (!selectedText) {
                return;
            }

            // Get the block element
            const container = range.commonAncestorContainer;
            const blockEl = container.nodeType === Node.TEXT_NODE
                ? container.parentElement?.closest('[data-block-id]')
                : container.closest?.('[data-block-id]');

            if (!blockEl) {
                return;
            }

            const textColorClasses = [
                'text-color-default', 'text-color-gray', 'text-color-brown', 'text-color-orange',
                'text-color-yellow', 'text-color-green', 'text-color-blue', 'text-color-purple',
                'text-color-magenta', 'text-color-red',
            ];

            // Remove existing text-color spans that intersect with selection
            const spans = Array.from(blockEl.querySelectorAll('span'));
            const intersectingSpans = spans.filter(span => {
                const hasTextColorClass = textColorClasses.some(cls => span.classList.contains(cls));
                return hasTextColorClass && range.intersectsNode(span);
            });

            intersectingSpans.forEach(span => {
                const parent = span.parentNode;
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            });

            blockEl.normalize();

            // If colorName is 'default', we're done - just removing existing colors
            if (colorName === 'default') {
                // Mark block as modified for undo history
                markBlockModified(blockEl);

                // Need to recreate selection after removing spans
                const textContent = blockEl.textContent || '';
                const textIndex = textContent.indexOf(selectedText);

                let selectionRecreated = false;

                if (textIndex !== -1) {
                    let currentPos = 0;
                    const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
                    let node;

                    while ((node = walker.nextNode())) {
                        const nodeLen = node.textContent.length;
                        if (currentPos + nodeLen > textIndex) {
                            const startOffset = textIndex - currentPos;
                            const endOffset = startOffset + selectedText.length;

                            if (endOffset <= nodeLen) {
                                // Selection is within this single text node
                                const newRange = document.createRange();
                                newRange.setStart(node, startOffset);
                                newRange.setEnd(node, endOffset);

                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(newRange);
                                selectionRef.current = newRange.cloneRange();
                                selectionRecreated = true;
                            }
                            break;
                        }
                        currentPos += nodeLen;
                    }
                }

                // If we couldn't recreate selection, try to restore the saved one
                if (!selectionRecreated) {
                    restoreSelection();
                }

                // DON'T sync or update state immediately - it causes re-render which loses selection
                return;
            }

            // Try to restore selection after removing spans
            restoreSelection();

            const newSel = window.getSelection();
            if (!newSel.rangeCount || newSel.isCollapsed) {
                // Selection was lost, try to find the text in the block
                const textContent = blockEl.textContent || '';
                const textIndex = textContent.indexOf(selectedText);

                if (textIndex !== -1) {
                    let currentPos = 0;
                    const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
                    let node;

                    while ((node = walker.nextNode())) {
                        const nodeLen = node.textContent.length;
                        if (currentPos + nodeLen > textIndex) {
                            const startOffset = textIndex - currentPos;
                            const endOffset = startOffset + selectedText.length;

                            if (endOffset <= nodeLen) {
                                const newRange = document.createRange();
                                newRange.setStart(node, startOffset);
                                newRange.setEnd(node, endOffset);

                                const span = document.createElement('span');
                                span.className = `text-color-${colorName}`;
                                const contents = newRange.extractContents();
                                span.appendChild(contents);
                                newRange.insertNode(span);

                                const finalRange = document.createRange();
                                finalRange.selectNodeContents(span);
                                newSel.removeAllRanges();
                                newSel.addRange(finalRange);
                                selectionRef.current = finalRange.cloneRange();

                                // Mark block as modified for undo history
                                markBlockModified(blockEl);
                            }
                            break;
                        }
                        currentPos += nodeLen;
                    }
                }

                return;
            }

            const newRange = newSel.getRangeAt(0);
            const className = `text-color-${colorName}`;

            // Wrap the selection in a span with the text color class
            let contents;
            try {
                contents = newRange.extractContents();
            } catch (e) {
                // Fallback if extraction fails
                const span = document.createElement('span');
                span.className = className;
                span.textContent = selectedText;
                newRange.deleteContents();
                newRange.insertNode(span);

                const finalRange = document.createRange();
                finalRange.selectNodeContents(span);
                newSel.removeAllRanges();
                newSel.addRange(finalRange);
                selectionRef.current = finalRange.cloneRange();

                // Mark block as modified for undo history
                markBlockModified(blockEl);

                return;
            }

            const span = document.createElement('span');
            span.className = className;
            span.appendChild(contents);
            newRange.insertNode(span);

            // Update selection to include the new span
            const finalRange = document.createRange();
            finalRange.selectNodeContents(span);
            newSel.removeAllRanges();
            newSel.addRange(finalRange);
            selectionRef.current = finalRange.cloneRange();

            // Mark block as modified for undo history
            markBlockModified(blockEl);
        } finally {
            // Reset flag and update active formats after a delay
            setTimeout(() => {
                isApplyingFormatRef.current = false;
                updateActiveFormats();

                // Schedule selection restoration in next event loop tick
                setTimeout(() => {
                    const sel2 = window.getSelection();

                    if ((!sel2.rangeCount || sel2.isCollapsed) && selectionRef.current) {
                        try {
                            sel2.removeAllRanges();
                            sel2.addRange(selectionRef.current.cloneRange());
                        } catch (e) {
                            // Selection restoration failed
                        }
                    }
                }, 0);
            }, 100);
        }
    }, [restoreSelection, getActiveFormats, syncBlockToState, updateActiveFormats]);

    /**
     * Clears text color from the selection.
     */
    const clearTextColor = useCallback(() => {
        if (!restoreSelection()) return;

        // Get the affected block before clearing
        const sel = window.getSelection();
        const blockEl = sel.anchorNode?.nodeType === Node.TEXT_NODE
            ? sel.anchorNode.parentElement?.closest('[data-block-id]')
            : sel.anchorNode?.closest?.('[data-block-id]');

        removeExistingTextColors();

        // Sync clearing to state for undo history
        syncBlockToState(blockEl);

        // Update active formats after clearing
        const newFormats = getActiveFormats();
        setMenu(prev => ({ ...prev, activeFormats: newFormats }));
    }, [restoreSelection, removeExistingTextColors, getActiveFormats, syncBlockToState]);

    /**
     * Applies a link to the selected text with the given URL.
     * Called from LinkPopover after user enters URL.
     */
    const applyLinkToSelection = useCallback((url) => {
        if (!url || !url.trim()) return;
        if (!restoreSelection()) return;

        isApplyingFormatRef.current = true;

        try {
            document.execCommand('createLink', false, url);

            // Save the updated selection after execCommand changes the DOM
            const updatedSel = window.getSelection();
            if (updatedSel.rangeCount > 0 && !updatedSel.isCollapsed) {
                selectionRef.current = updatedSel.getRangeAt(0).cloneRange();

                // Mark block as modified for undo history
                const blockEl = getBlockFromNode(updatedSel.anchorNode);
                if (blockEl) {
                    markBlockModified(blockEl);
                }
            }

            // DON'T sync or update state immediately - it causes re-render which loses selection
            // syncBlockToState();
            // const newFormats = getActiveFormats();
            // setMenu(prev => ({ ...prev, activeFormats: newFormats }));
        } finally {
            setTimeout(() => {
                isApplyingFormatRef.current = false;
                updateActiveFormats();
            }, 100);
        }
    }, [restoreSelection, getActiveFormats, syncBlockToState, updateActiveFormats]);

    /**
     * Gets the current menu position for LinkPopover positioning.
     */
    const getMenuPosition = useCallback(() => {
        return menu.position;
    }, [menu.position]);

    /**
     * Gets the saved selection for external use.
     */
    const getSavedSelection = useCallback(() => {
        return selectionRef.current;
    }, []);

    /**
     * Removes the link from the selected text.
     * If cursor is inside a link without selection, selects the entire link first.
     */
    const removeLink = useCallback(() => {
        if (!restoreSelection()) return;

        isApplyingFormatRef.current = true;

        try {
            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            const range = sel.getRangeAt(0);

            // If selection is collapsed (just cursor), check if inside a link
            if (range.collapsed) {
                const node = sel.anchorNode;
                const linkEl = node?.nodeType === Node.TEXT_NODE
                    ? node.parentElement?.closest('a')
                    : node?.closest?.('a');

                if (linkEl) {
                    // Select the entire link content
                    const linkRange = document.createRange();
                    linkRange.selectNodeContents(linkEl);
                    sel.removeAllRanges();
                    sel.addRange(linkRange);
                }
            }

            document.execCommand('unlink', false, null);

            // Save the updated selection after execCommand changes the DOM
            const updatedSel = window.getSelection();
            if (updatedSel.rangeCount > 0 && !updatedSel.isCollapsed) {
                selectionRef.current = updatedSel.getRangeAt(0).cloneRange();

                // Mark block as modified for undo history
                const blockEl = getBlockFromNode(updatedSel.anchorNode);
                if (blockEl) {
                    markBlockModified(blockEl);
                }
            }
        } finally {
            setTimeout(() => {
                isApplyingFormatRef.current = false;
                updateActiveFormats();
            }, 100);
        }
    }, [restoreSelection, updateActiveFormats]);

    /**
     * Changes the block type of all blocks in the current selection.
     * Supports cross-block selections.
     */
    const changeBlockType = useCallback((blockType) => {
        if (!restoreSelection()) {
            closeMenu();
            return;
        }

        const sel = window.getSelection();
        if (!sel.rangeCount) {
            closeMenu();
            return;
        }

        const range = sel.getRangeAt(0);
        const editorEl = editorRef.current;
        if (!editorEl) {
            closeMenu();
            return;
        }

        // Get all blocks that intersect with the selection
        const allBlocks = editorEl.querySelectorAll('[data-block-id]');
        const intersectingBlocks = Array.from(allBlocks).filter(block =>
            range.intersectsNode(block)
        );

        if (intersectingBlocks.length === 0) {
            closeMenu();
            return;
        }

        // Change type for all intersecting blocks
        intersectingBlocks.forEach(blockEl => {
            const blockId = blockEl.getAttribute('data-block-id');
            if (blockId) {
                actions.changeBlockType(blockId, blockType);
            }
        });

        closeMenu();
    }, [restoreSelection, editorRef, actions, closeMenu]);

    /**
     * Helper to check if an element is inside a menu-related UI.
     */
    const isInsideMenuUI = (target) => {
        return target.closest('.formatting-menu') ||
               target.closest('.formatting-popup') ||
               target.closest('.turn-into-menu') ||
               target.closest('.color-picker') ||
               target.closest('.link-popover');
    };

    /**
     * Track mouse down to prevent menu from opening during text selection drag.
     */
    useEffect(() => {
        const handleMouseDown = (e) => {
            // Ignore clicks inside menu-related UI elements (including link popover)
            if (isInsideMenuUI(e.target)) {
                return;
            }

            isMouseDownRef.current = true;
            // Close menu when starting new selection outside menu
            if (menu.isOpen) {
                closeMenu();
            }
        };

        const handleMouseUp = (e) => {
            // Ignore mouse up inside menu-related UI elements (including link popover)
            if (isInsideMenuUI(e.target)) {
                return;
            }

            isMouseDownRef.current = false;
            // Small delay to let selection finalize
            setTimeout(() => {
                if (!isMouseDownRef.current) {
                    const valid = getValidSelection();
                    if (valid) {
                        openMenu();
                    }
                }
            }, 10);
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [menu.isOpen, closeMenu, getValidSelection, openMenu]);

    /**
     * Close menu when clicking outside.
     */
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Don't close if clicking inside menu-related UI elements (including link popover)
            if (menu.isOpen && !isInsideMenuUI(e.target)) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menu.isOpen, closeMenu]);

    /**
     * Close menu when selection becomes empty (e.g., user deletes text).
     * But not when the focus is inside the link popover input.
     */
    useEffect(() => {
        if (!menu.isOpen) return;

        const handleSelectionChange = () => {
            // Don't close the menu if we're currently applying formatting
            if (isApplyingFormatRef.current) {
                return;
            }

            // Don't close the menu if focus is inside the link popover
            const activeElement = document.activeElement;
            if (activeElement?.closest('.link-popover')) {
                return;
            }

            const sel = window.getSelection();

            // If selection is collapsed (no text selected) or empty, close the menu
            if (!sel.rangeCount || sel.isCollapsed || sel.toString().trim() === '') {
                closeMenu();
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [menu.isOpen, closeMenu]);

    /**
     * Close menu on Escape key.
     */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && menu.isOpen) {
                closeMenu();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [menu.isOpen, closeMenu]);

    /**
     * Update active formats when user does undo/redo while menu is open.
     */
    useEffect(() => {
        if (!menu.isOpen) return;

        const handleKeyDown = (e) => {
            // Check for Cmd+Z (undo) or Cmd+Shift+Z (redo) on Mac, Ctrl+Z/Ctrl+Y on Windows
            const isUndo = (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey;
            const isRedo = ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) ||
                          ((e.ctrlKey) && e.key === 'y');

            if (isUndo || isRedo) {
                // Update active formats after a short delay to let the DOM update
                setTimeout(() => {
                    updateActiveFormats();
                }, 50);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [menu.isOpen, updateActiveFormats]);

    return {
        menu,
        openMenu,
        closeMenu,
        toggleSubmenu,
        applyFormat,
        applyHighlight,
        clearHighlight,
        applyTextColor,
        clearTextColor,
        applyLinkToSelection,
        removeLink,
        changeBlockType,
        getMenuPosition,
        getSavedSelection,
        restoreSelection,
    };
}

export default useFormattingMenu;
