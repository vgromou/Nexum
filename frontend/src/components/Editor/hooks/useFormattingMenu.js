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
            link: false,
        },
    });

    const selectionRef = useRef(null);
    const isMouseDownRef = useRef(false);

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
        if (!startBlockEl || !editorRef.current.contains(startBlockEl)) return null;
        if (!endBlockEl || !editorRef.current.contains(endBlockEl)) return null;

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
     * Uses document.queryCommandState for standard formats and checks for links, highlights, and tags.
     */
    const getActiveFormats = useCallback(() => {
        const formats = {
            bold: false,
            italic: false,
            underline: false,
            strikeThrough: false,
            link: false,
            highlightColor: null, // e.g., 'purple', 'blue', etc.
            tagColor: null,       // e.g., 'purple', 'blue', etc.
        };

        try {
            formats.bold = document.queryCommandState('bold');
            formats.italic = document.queryCommandState('italic');
            formats.underline = document.queryCommandState('underline');
            formats.strikeThrough = document.queryCommandState('strikeThrough');

            // Check if selection contains a link, highlight, or tag
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const node = container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : container;

                formats.link = !!node?.closest('a');

                // Check for highlight colors
                const highlightColors = ['gray', 'purple', 'blue', 'green', 'orange', 'red'];
                for (const color of highlightColors) {
                    if (node?.closest(`.highlight-${color}`)) {
                        formats.highlightColor = color;
                        break;
                    }
                }

                // Check for tag colors
                for (const color of highlightColors) {
                    if (node?.closest(`.tag-${color}`)) {
                        formats.tagColor = color;
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
     */
    const closeMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, isOpen: false, activeSubmenu: null }));
    }, []);

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
     * Restores the saved selection before applying formatting.
     */
    const restoreSelection = useCallback(() => {
        if (!selectionRef.current) return false;

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(selectionRef.current);
        return true;
    }, []);

    /**
     * Removes highlight/tag spans from the selection.
     * @param {string|null} type - 'highlight', 'tag', or null for both
     */
    const removeExistingHighlights = useCallback((type = null) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const blockEl = container.nodeType === Node.TEXT_NODE
            ? container.parentElement?.closest('[data-block-id]')
            : container.closest?.('[data-block-id]');

        if (!blockEl) return;

        // Define classes based on type
        const highlightOnlyClasses = [
            'highlight-gray', 'highlight-purple', 'highlight-blue', 'highlight-green',
            'highlight-orange', 'highlight-red',
        ];
        const tagOnlyClasses = [
            'tag-gray', 'tag-purple', 'tag-blue', 'tag-green',
            'tag-orange', 'tag-red',
        ];

        let classesToRemove;
        if (type === 'highlight') {
            classesToRemove = highlightOnlyClasses;
        } else if (type === 'tag') {
            classesToRemove = tagOnlyClasses;
        } else {
            classesToRemove = [...highlightOnlyClasses, ...tagOnlyClasses];
        }

        const spans = blockEl.querySelectorAll('span');
        spans.forEach(span => {
            const hasTargetClass = classesToRemove.some(cls => span.classList.contains(cls));
            if (hasTargetClass && range.intersectsNode(span)) {
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
     */
    const applyFormat = useCallback((command) => {
        if (!restoreSelection()) return;
        document.execCommand(command, false, null);

        // Re-save the current selection after formatting to prevent jump
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            selectionRef.current = sel.getRangeAt(0).cloneRange();
        }

        // Update active formats after applying formatting
        const newFormats = getActiveFormats();
        setMenu(prev => ({ ...prev, activeFormats: newFormats }));
    }, [restoreSelection, getActiveFormats]);

    /**
     * Applies a highlight or tag to the selected text.
     * Supports cross-block selections.
     */
    const applyHighlight = useCallback((colorName, isTag = false) => {
        if (!restoreSelection()) return;

        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) {
            return;
        }

        const range = sel.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) {
            return;
        }

        const className = isTag ? `tag-${colorName}` : `highlight-${colorName}`;

        // Separate classes for highlights and tags - only remove same type
        const highlightOnlyClasses = [
            'highlight-gray', 'highlight-purple', 'highlight-blue', 'highlight-green',
            'highlight-orange', 'highlight-red',
        ];
        const tagOnlyClasses = [
            'tag-gray', 'tag-purple', 'tag-blue', 'tag-green',
            'tag-orange', 'tag-red',
        ];

        // Only remove spans of the same type (highlight or tag)
        const classesToRemove = isTag ? tagOnlyClasses : highlightOnlyClasses;

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

            // Remove only existing spans of same type (highlight or tag) in selection
            const spans = Array.from(blockEl.querySelectorAll('span'));
            const intersectingSpans = spans.filter(span => {
                const hasSameType = classesToRemove.some(cls => span.classList.contains(cls));
                return hasSameType && range.intersectsNode(span);
            });

            intersectingSpans.forEach(span => {
                const parent = span.parentNode;
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            });

            blockEl.normalize();

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
                            }
                            break;
                        }
                        currentPos += nodeLen;
                    }
                }

                // Update active formats
                const newFormats = getActiveFormats();
                setMenu(prev => ({ ...prev, activeFormats: newFormats }));
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

                // Update active formats
                const newFormats = getActiveFormats();
                setMenu(prev => ({ ...prev, activeFormats: newFormats }));
                return;
            }

            const span = document.createElement('span');
            span.className = className;

            if (isTag) {
                // When applying tag, check if selected text was inside a highlight span
                // We need to keep the tag INSIDE the highlight
                // Check if parent of insertion point is a highlight
                const insertionParent = newRange.commonAncestorContainer;
                const parentHighlight = insertionParent.nodeType === Node.TEXT_NODE
                    ? insertionParent.parentElement?.closest('[class^="highlight-"]')
                    : insertionParent.closest?.('[class^="highlight-"]');

                // Check if contents contain a highlight span that we need to preserve
                const highlightInContents = contents.querySelector &&
                    highlightOnlyClasses.some(cls => contents.querySelector(`.${cls}`));
                const firstChildIsHighlight = contents.firstChild &&
                    contents.firstChild.nodeType === Node.ELEMENT_NODE &&
                    highlightOnlyClasses.some(cls => contents.firstChild.classList?.contains(cls));

                if (firstChildIsHighlight && contents.childNodes.length === 1) {
                    // The entire selection is a highlight span - insert tag inside it
                    const highlightSpan = contents.firstChild;
                    const tagSpan = document.createElement('span');
                    tagSpan.className = className;
                    // Move all children of highlight into tag
                    while (highlightSpan.firstChild) {
                        tagSpan.appendChild(highlightSpan.firstChild);
                    }
                    highlightSpan.appendChild(tagSpan);
                    newRange.insertNode(contents);

                    const finalRange = document.createRange();
                    finalRange.selectNodeContents(tagSpan);
                    newSel.removeAllRanges();
                    newSel.addRange(finalRange);
                    selectionRef.current = finalRange.cloneRange();
                    return;
                } else {
                    // No highlight wrapper, just apply tag
                    span.appendChild(contents);
                    newRange.insertNode(span);
                }
            } else {
                // When applying highlight, check if we're inside a tag span
                // We need the final structure to be: highlight outside, tag inside

                // Check if insertion point is inside a tag span
                const insertionParent = newRange.commonAncestorContainer;
                let parentTagSpan = null;

                if (insertionParent.nodeType === Node.TEXT_NODE) {
                    parentTagSpan = insertionParent.parentElement;
                    if (parentTagSpan && !tagOnlyClasses.some(cls => parentTagSpan.classList?.contains(cls))) {
                        parentTagSpan = parentTagSpan.closest('[class^="tag-"]');
                    }
                } else if (insertionParent.nodeType === Node.ELEMENT_NODE) {
                    if (tagOnlyClasses.some(cls => insertionParent.classList?.contains(cls))) {
                        parentTagSpan = insertionParent;
                    } else {
                        parentTagSpan = insertionParent.closest?.('[class^="tag-"]');
                    }
                }

                // Also check if contents contain a tag span
                const firstChildIsTag = contents.firstChild &&
                    contents.firstChild.nodeType === Node.ELEMENT_NODE &&
                    tagOnlyClasses.some(cls => contents.firstChild.classList?.contains(cls));

                if (parentTagSpan && blockEl.contains(parentTagSpan)) {
                    // We are inside a tag span - we need to restructure:
                    // Current: <tag>text</tag>
                    // Target: <highlight><tag>text</tag></highlight>

                    // First, put contents back
                    newRange.insertNode(contents);
                    blockEl.normalize();

                    // Now wrap the entire tag span with highlight
                    const highlightSpan = document.createElement('span');
                    highlightSpan.className = className;

                    // Clone the tag span content and structure
                    parentTagSpan.parentNode.insertBefore(highlightSpan, parentTagSpan);
                    highlightSpan.appendChild(parentTagSpan);

                    const finalRange = document.createRange();
                    finalRange.selectNodeContents(parentTagSpan);
                    newSel.removeAllRanges();
                    newSel.addRange(finalRange);
                    selectionRef.current = finalRange.cloneRange();
                    return;
                } else if (firstChildIsTag && contents.childNodes.length === 1) {
                    // The entire selection is a tag span - wrap highlight around it
                    span.appendChild(contents);
                    newRange.insertNode(span);
                } else {
                    // No tag inside or mixed content, just apply highlight normally
                    span.appendChild(contents);
                    newRange.insertNode(span);
                }
            }

            const finalRange = document.createRange();
            finalRange.selectNodeContents(span);
            newSel.removeAllRanges();
            newSel.addRange(finalRange);
            selectionRef.current = finalRange.cloneRange();

            // Update active formats after applying highlight
            const newFormats = getActiveFormats();
            setMenu(prev => ({ ...prev, activeFormats: newFormats }));
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

            // Remove existing spans of same type in this block's range
            const spans = Array.from(blockEl.querySelectorAll('span'));
            spans.forEach(span => {
                const hasSameType = classesToRemove.some(cls => span.classList.contains(cls));
                if (hasSameType && blockRange.intersectsNode(span)) {
                    const parent = span.parentNode;
                    while (span.firstChild) {
                        parent.insertBefore(span.firstChild, span);
                    }
                    parent.removeChild(span);
                }
            });

            blockEl.normalize();

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
    }, [restoreSelection, editorRef, getActiveFormats]);

    /**
     * Clears highlights or tags from the selection.
     * @param {string|null} type - 'highlight', 'tag', or null for both
     */
    const clearHighlight = useCallback((type = null) => {
        if (!restoreSelection()) return;
        removeExistingHighlights(type);

        // Update active formats after clearing
        const newFormats = getActiveFormats();
        setMenu(prev => ({ ...prev, activeFormats: newFormats }));
    }, [restoreSelection, removeExistingHighlights, getActiveFormats]);

    /**
     * Inserts a link around the selected text.
     */
    const insertLink = useCallback(() => {
        if (!restoreSelection()) return;

        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
        // Menu stays open
    }, [restoreSelection]);

    /**
     * Removes the link from the selected text.
     */
    const removeLink = useCallback(() => {
        if (!restoreSelection()) return;
        document.execCommand('unlink', false, null);
        // Menu stays open
    }, [restoreSelection]);

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
     * Track mouse down to prevent menu from opening during text selection drag.
     */
    useEffect(() => {
        const handleMouseDown = (e) => {
            // Ignore clicks inside the formatting menu or popups
            if (e.target.closest('.formatting-menu') || e.target.closest('.formatting-popup')) {
                return;
            }

            isMouseDownRef.current = true;
            // Close menu when starting new selection outside menu
            if (menu.isOpen) {
                closeMenu();
            }
        };

        const handleMouseUp = (e) => {
            // Ignore mouse up inside the formatting menu or popups
            if (e.target.closest('.formatting-menu') || e.target.closest('.formatting-popup')) {
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
            if (menu.isOpen && !e.target.closest('.formatting-menu') && !e.target.closest('.formatting-popup')) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menu.isOpen, closeMenu]);

    /**
     * Close menu when selection becomes empty (e.g., user deletes text).
     */
    useEffect(() => {
        if (!menu.isOpen) return;

        const handleSelectionChange = () => {
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

    return {
        menu,
        openMenu,
        closeMenu,
        toggleSubmenu,
        applyFormat,
        applyHighlight,
        clearHighlight,
        insertLink,
        removeLink,
        changeBlockType,
    };
}

export default useFormattingMenu;
