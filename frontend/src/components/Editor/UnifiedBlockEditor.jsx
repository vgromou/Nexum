import React, { useRef, useCallback, useEffect, useState, useLayoutEffect } from 'react';
import { GripVertical } from 'lucide-react';
import SlashCommandMenu from './SlashCommandMenu';
import { useBlockReducer } from './hooks/useBlockReducer';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useClipboard } from './hooks/useClipboard';
import { useSlashMenu } from './hooks/useSlashMenu';
import { useCrossBlockSelection } from './hooks/useCrossBlockSelection';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { debounce } from '../../utils/debounce';
import './BlockEditor.css';

// Markdown shortcuts for quick block conversion
const MARKDOWN_SHORTCUTS = {
    '# ': 'h1',
    '## ': 'h2',
    '### ': 'h3',
    '- ': 'bulleted-list',
    '* ': 'bulleted-list',
    '1. ': 'numbered-list',
    '> ': 'quote',
};

// Block type to HTML tag mapping
const BLOCK_TYPE_TAGS = {
    'paragraph': 'p',
    'h1': 'h1',
    'h2': 'h2',
    'h3': 'h3',
    'bulleted-list': 'div',
    'numbered-list': 'div',
    'quote': 'blockquote',
};

/**
 * UnifiedBlockEditor - A single contentEditable editor that enables
 * native cross-block text selection while maintaining block structure.
 */
const UnifiedBlockEditor = () => {
    const { state, actions } = useBlockReducer();
    const editorRef = useRef(null);
    const isUpdatingFromDOM = useRef(false);
    const [hoveredBlockId, setHoveredBlockId] = useState(null);
    const [handlePositions, setHandlePositions] = useState({});
    const [focusedBlockId, setFocusedBlockId] = useState(null);

    // Block Selection Hooks
    const {
        crossSelection,
        getSelectedContent,
        handleKeyboardSelection,
        getSelectionForDeletion,
    } = useCrossBlockSelection({ editorRef, state, actions });

    // Drag and drop hooks
    const {
        dragState,
        dropIndicator,
        handleHandleMouseDown,
    } = useDragAndDrop({ editorRef, state, actions, getSelectedContent });

    const {
        copyBlocksToClipboard,
        copySelectedTextToClipboard,
        cutSelectedText,
        pasteFromClipboard,
    } = useClipboard({
        state,
        actions,
        editorRef,
        getSelectedContent,
    });

    const {
        slashMenu,
        openSlashMenu,
        closeSlashMenu,
        updateSlashMenuFilter,
        handleSlashSelect,
    } = useSlashMenu({ state, actions });

    // Keyboard Navigation Hook
    useKeyboardNavigation({
        state,
        actions,
        slashMenu,
        closeSlashMenu,
        copyBlocksToClipboard,
        copySelectedTextToClipboard,
        cutSelectedText,
        pasteFromClipboard,
        handleKeyboardSelection,
        getSelectionForDeletion,
    });


    /**
     * Updates the absolute positions of drag handles based on block elements.
     */
    const updateHandlePositions = useCallback(() => {
        if (!editorRef.current) return;

        const newPositions = {};
        const blockElements = editorRef.current.querySelectorAll('[data-block-id]');

        blockElements.forEach((el) => {
            const blockId = el.getAttribute('data-block-id');
            const style = window.getComputedStyle(el);
            const lineHeight = parseInt(style.lineHeight) || 26; // Default to 26px if invalid
            const paddingTop = parseInt(style.paddingTop) || 4;

            // Calculate top position relative to the container
            // We want to center the handle (24px) with the first line of text
            // Handle Top = Block Top + Padding Top + (LineHeight / 2) - (HandleHeight / 2)
            const handleHeight = 24;
            const top = el.offsetTop + paddingTop + (lineHeight / 2) - (handleHeight / 2);

            newPositions[blockId] = top;
        });

        // Only update if changed to avoid loops (simple shallow comparison)
        setHandlePositions(prev => {
            const isDifferent = Object.keys(newPositions).some(key => newPositions[key] !== prev[key]) ||
                Object.keys(prev).length !== Object.keys(newPositions).length;
            return isDifferent ? newPositions : prev;
        });
    }, []);

    /**
     * Syncs the DOM content back to React state.
     * Parses the contentEditable children as blocks.
     */
    const syncDOMToState = useCallback(() => {
        if (!editorRef.current || isUpdatingFromDOM.current) return;

        isUpdatingFromDOM.current = true;

        const blockElements = editorRef.current.querySelectorAll('[data-block-id]');
        const newBlocks = [];

        blockElements.forEach((el) => {
            const blockId = el.getAttribute('data-block-id');
            const blockType = el.getAttribute('data-block-type') || 'paragraph';
            const content = el.innerHTML;

            newBlocks.push({
                id: blockId,
                type: blockType,
                content,
            });
        });

        // Only update if content or type actually changed
        const hasChanges = newBlocks.some((newBlock, i) => {
            const oldBlock = state.blocks[i];
            return !oldBlock || oldBlock.content !== newBlock.content || oldBlock.type !== newBlock.type;
        }) || newBlocks.length !== state.blocks.length;

        if (hasChanges && newBlocks.length > 0) {
            actions.setBlocks(newBlocks);
        }

        isUpdatingFromDOM.current = false;
    }, [state.blocks, actions]);

    /**
     * Debounced sync for performance
     */
    const debouncedSync = useCallback(
        debounce(syncDOMToState, 100),
        [syncDOMToState]
    );

    /**
     * Updates the is-empty class on blocks based on their content.
     */
    const updateEmptyState = useCallback(() => {
        if (!editorRef.current) return;

        const blockElements = editorRef.current.querySelectorAll('[data-block-id]');
        blockElements.forEach((el) => {
            const textContent = el.textContent?.trim() || '';
            if (textContent === '') {
                el.classList.add('is-empty');
            } else {
                el.classList.remove('is-empty');
            }
        });
    }, []);

    /**
     * Handles input events in the contentEditable.
     */
    const handleInput = useCallback((e) => {
        // Check for markdown shortcuts in the current block
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const blockEl = sel.anchorNode?.nodeType === Node.TEXT_NODE
            ? sel.anchorNode.parentElement?.closest('[data-block-id]')
            : sel.anchorNode?.closest?.('[data-block-id]');

        if (blockEl) {
            const textContent = blockEl.textContent || '';
            const blockId = blockEl.getAttribute('data-block-id');
            const blockType = blockEl.getAttribute('data-block-type');

            // Only check markdown shortcuts in paragraph blocks
            if (blockType === 'paragraph') {
                for (const [shortcut, newType] of Object.entries(MARKDOWN_SHORTCUTS)) {
                    if (textContent.startsWith(shortcut)) {
                        // Remove the shortcut and change block type
                        const newContent = textContent.slice(shortcut.length);
                        blockEl.textContent = newContent;
                        blockEl.setAttribute('data-block-type', newType);

                        // Update the tag if needed
                        const newTag = BLOCK_TYPE_TAGS[newType];
                        if (blockEl.tagName.toLowerCase() !== newTag) {
                            // We need to replace the element with correct tag
                            const newEl = document.createElement(newTag);
                            newEl.className = blockEl.className;
                            newEl.setAttribute('data-block-id', blockId);
                            newEl.setAttribute('data-block-type', newType);
                            newEl.textContent = newContent;

                            // Counter Reset Logic for Optimized Switch
                            if (newType === 'numbered-list') {
                                // If previous is NOT numbered list, we are the start.
                                const prev = blockEl.previousElementSibling;
                                const isPrevNumbered = prev && prev.getAttribute('data-block-type') === 'numbered-list';
                                if (!isPrevNumbered) {
                                    newEl.setAttribute('data-list-reset', 'true');
                                }
                                // We don't worry about updating next siblings here; syncDOMToState will eventually catch them
                                // if the user edits rapidly. For immediate visual, we just care about THIS block.
                            }

                            blockEl.replaceWith(newEl);

                            // Set cursor at end
                            const range = document.createRange();
                            const newSel = window.getSelection();
                            if (newEl.firstChild) {
                                range.setStart(newEl.firstChild, newEl.firstChild.textContent.length);
                            } else {
                                range.setStart(newEl, 0);
                            }
                            range.collapse(true);
                            newSel.removeAllRanges();
                            newSel.addRange(range);
                        } else if (newType === 'numbered-list') {
                            // Tag didn't change (e.g. p->p or list->list), but we still need number if type is numbered-list
                            // Wait, shortcut check only happens for 'paragraph' type (line 193). 
                            // Paragraph is 'p'. Numbered list is 'li'.
                            // So tag WILL ALWAYS change from p to li.
                            // So this else block is unreachable for p -> numbered-list conversion.
                            // Keeping it safe just in case.
                        }

                        debouncedSync();
                        return;
                    }
                }
            }
        }

        debouncedSync();
        updateEmptyState();
    }, [debouncedSync, updateEmptyState]);

    /**
     * Handles keydown events for block-level operations.
     */
    const handleKeyDown = useCallback((e) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const blockEl = sel.anchorNode?.nodeType === Node.TEXT_NODE
            ? sel.anchorNode.parentElement?.closest('[data-block-id]')
            : sel.anchorNode?.closest?.('[data-block-id]');

        if (!blockEl) return;

        const blockId = blockEl.getAttribute('data-block-id');
        const blockType = blockEl.getAttribute('data-block-type') || 'paragraph';
        const textContent = blockEl.textContent || '';

        // Slash command trigger
        if (e.key === '/' && !slashMenu.isOpen) {
            setTimeout(() => {
                const rect = range.getBoundingClientRect();
                openSlashMenu(blockId, blockEl);
            }, 10);
            return;
        }

        // Update slash menu filter while typing
        if (slashMenu.isOpen && slashMenu.blockId === blockId) {
            if (e.key === ' ') {
                closeSlashMenu();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                closeSlashMenu();
                return;
            }
            // Let SlashCommandMenu handle navigation keys
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
                return;
            }

            const slashIndex = textContent.lastIndexOf('/');
            if (slashIndex !== -1) {
                setTimeout(() => {
                    const updatedText = blockEl.textContent || '';
                    const newFilter = updatedText.slice(slashIndex + 1);
                    updateSlashMenuFilter(newFilter);
                }, 0);
            }
        }

        // Enter key - create new block or split
        if (e.key === 'Enter' && !e.shiftKey) {
            if (slashMenu.isOpen) return;

            e.preventDefault();

            // For lists and quotes: convert to paragraph if empty
            if (['bulleted-list', 'numbered-list', 'quote'].includes(blockType)) {
                if (textContent.trim() === '') {
                    blockEl.setAttribute('data-block-type', 'paragraph');
                    const newTag = BLOCK_TYPE_TAGS['paragraph'];
                    if (blockEl.tagName.toLowerCase() !== newTag) {
                        const newEl = document.createElement(newTag);
                        newEl.className = 'block-content';
                        newEl.setAttribute('data-block-id', blockId);
                        newEl.setAttribute('data-block-type', 'paragraph');
                        blockEl.replaceWith(newEl);

                        // Focus the new element
                        const newRange = document.createRange();
                        newRange.setStart(newEl, 0);
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    debouncedSync();
                    return;
                }
            }

            // Create new block after current one (Split Logic)

            // USE DOM RANGE to extract content (Preserve HTML)
            const afterRange = document.createRange();
            afterRange.setStart(range.startContainer, range.startOffset);
            if (blockEl.lastChild) {
                afterRange.setEndAfter(blockEl.lastChild);
            } else {
                afterRange.setEnd(blockEl, blockEl.childNodes.length);
            }

            const fragment = afterRange.extractContents(); // Modifies valid DOM in place

            // Get HTML string for new block
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);
            const afterHtml = tempDiv.innerHTML;

            // Determine new block type
            const newBlockType = ['bulleted-list', 'numbered-list'].includes(blockType)
                ? blockType
                : 'paragraph';
            const newBlockTag = BLOCK_TYPE_TAGS[newBlockType];
            const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create new block element
            const newBlockEl = document.createElement(newBlockTag);
            newBlockEl.className = 'block-content';
            newBlockEl.setAttribute('data-block-id', newBlockId);
            newBlockEl.setAttribute('data-block-type', newBlockType);
            newBlockEl.innerHTML = afterHtml; // Insert formatted HTML

            // Insert after current block
            blockEl.parentNode.insertBefore(newBlockEl, blockEl.nextSibling);

            // Move cursor to start of new block
            const newRange = document.createRange();
            if (newBlockEl.firstChild) {
                newRange.setStart(newBlockEl.firstChild, 0);
            } else {
                newRange.setStart(newBlockEl, 0);
            }
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);

            debouncedSync();
            return;
        }

        // Backspace at start of block - merge with previous
        // Also handle Delete key for selections
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Close slash menu if needed
            if (slashMenu.isOpen && e.key === 'Backspace') {
                const cursorPos = getCursorPosition(blockEl);
                const slashIndex = textContent.lastIndexOf('/');
                if (slashIndex === -1 || cursorPos <= slashIndex) {
                    closeSlashMenu();
                }
            }

            // If there's a selection (non-collapsed range), let browser handle it natively
            if (!range.collapsed) {
                // Let browser delete the selection
                setTimeout(debouncedSync, 0);
                return;
            }

            // No selection - check if at start of block for merge behavior
            const cursorPos = getCursorPosition(blockEl);

            if (e.key === 'Backspace' && cursorPos === 0) {
                e.preventDefault();

                // First convert non-paragraph blocks to paragraph
                if (blockType !== 'paragraph') {
                    blockEl.setAttribute('data-block-type', 'paragraph');
                    const newTag = BLOCK_TYPE_TAGS['paragraph'];
                    if (blockEl.tagName.toLowerCase() !== newTag) {
                        const newEl = document.createElement(newTag);
                        newEl.className = 'block-content';
                        newEl.setAttribute('data-block-id', blockId);
                        newEl.setAttribute('data-block-type', 'paragraph');
                        newEl.innerHTML = blockEl.innerHTML;
                        blockEl.replaceWith(newEl);

                        // Set cursor at start
                        const newRange = document.createRange();
                        if (newEl.firstChild) {
                            newRange.setStart(newEl.firstChild, 0);
                        } else {
                            newRange.setStart(newEl, 0);
                        }
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    debouncedSync();
                    return;
                }

                // Get previous block
                const prevBlock = blockEl.previousElementSibling;
                if (prevBlock && prevBlock.hasAttribute('data-block-id')) {
                    const prevContent = prevBlock.textContent || '';
                    const curContent = textContent;
                    const cursorPosInMerged = prevContent.length;

                    // Merge content
                    prevBlock.textContent = prevContent + curContent;

                    // Remove current block
                    blockEl.remove();

                    // Set cursor at merge point
                    const newRange = document.createRange();
                    if (prevBlock.firstChild) {
                        let pos = 0;
                        const walkTree = (node) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                if (pos + node.textContent.length >= cursorPosInMerged) {
                                    newRange.setStart(node, cursorPosInMerged - pos);
                                    newRange.collapse(true);
                                    return true;
                                }
                                pos += node.textContent.length;
                            } else {
                                for (const child of node.childNodes) {
                                    if (walkTree(child)) return true;
                                }
                            }
                            return false;
                        };
                        walkTree(prevBlock);
                    } else {
                        newRange.setStart(prevBlock, 0);
                        newRange.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(newRange);

                    debouncedSync();
                }
                return;
            }

            // For Delete key at end of block - merge with next
            if (e.key === 'Delete' && cursorPos === textContent.length) {
                e.preventDefault();

                const nextBlock = blockEl.nextElementSibling;
                if (nextBlock && nextBlock.hasAttribute('data-block-id')) {
                    const nextContent = nextBlock.textContent || '';
                    const cursorPosAfterMerge = textContent.length;

                    // Merge content
                    blockEl.textContent = textContent + nextContent;

                    // Remove next block
                    nextBlock.remove();

                    // Set cursor at merge point
                    const newRange = document.createRange();
                    if (blockEl.firstChild) {
                        let pos = 0;
                        const walkTree = (node) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                if (pos + node.textContent.length >= cursorPosAfterMerge) {
                                    newRange.setStart(node, cursorPosAfterMerge - pos);
                                    newRange.collapse(true);
                                    return true;
                                }
                                pos += node.textContent.length;
                            } else {
                                for (const child of node.childNodes) {
                                    if (walkTree(child)) return true;
                                }
                            }
                            return false;
                        };
                        walkTree(blockEl);
                    } else {
                        newRange.setStart(blockEl, 0);
                        newRange.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(newRange);

                    debouncedSync();
                }
                return;
            }
        }

        // Copy (Ctrl/Cmd+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            // Let native copy work for text selection
            return;
        }

        // Paste (Ctrl/Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            // Let native paste work, sync after
            setTimeout(debouncedSync, 0);
            return;
        }
    }, [slashMenu, openSlashMenu, closeSlashMenu, updateSlashMenuFilter, debouncedSync]);

    /**
     * Gets cursor position within a block element.
     */
    const getCursorPosition = (element) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return 0;

        const range = sel.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(element);
        preRange.setEnd(range.startContainer, range.startOffset);

        return preRange.toString().length;
    };

    /**
     * Sets cursor position within a block element.
     */
    const setCursorPosition = (element, position) => {
        const range = document.createRange();
        const sel = window.getSelection();

        let currentPos = 0;
        let found = false;

        const walkTree = (node) => {
            if (found) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const nodeLength = node.textContent.length;
                if (currentPos + nodeLength >= position) {
                    range.setStart(node, position - currentPos);
                    range.collapse(true);
                    found = true;
                    return;
                }
                currentPos += nodeLength;
            } else {
                for (const child of node.childNodes) {
                    walkTree(child);
                    if (found) return;
                }
            }
        };

        walkTree(element);

        if (!found) {
            range.selectNodeContents(element);
            range.collapse(false);
        }

        sel.removeAllRanges();
        sel.addRange(range);
    };



    /**
     * Calculates list number for numbered list items.
     */
    const getListNumber = (index) => {
        let count = 1;
        for (let i = 0; i < index; i++) {
            if (state.blocks[i].type === 'numbered-list') {
                count++;
            } else {
                count = 1;
            }
        }
        return count;
    };



    /**
     * Initial render: sync React state to DOM
     */
    useLayoutEffect(() => {
        if (!editorRef.current || isUpdatingFromDOM.current) return;

        const existingBlocks = editorRef.current.querySelectorAll('[data-block-id]');
        const existingIds = Array.from(existingBlocks).map(el => el.getAttribute('data-block-id'));
        const stateIds = state.blocks.map(b => b.id);

        // Check if structure changed (different IDs or order)
        const structureChanged =
            existingIds.length !== stateIds.length ||
            existingIds.some((id, i) => id !== stateIds[i]);

        // Check if any block types changed (need to rebuild with different tags)
        const typeChanged = !structureChanged && Array.from(existingBlocks).some((el, i) => {
            const block = state.blocks[i];
            if (!block) return false;
            const expectedTag = BLOCK_TYPE_TAGS[block.type] || 'p';
            return el.tagName.toLowerCase() !== expectedTag;
        });

        if (structureChanged || typeChanged) {
            // Save current selection
            const sel = window.getSelection();
            let savedBlockId = null;
            let savedOffset = 0;

            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                // Safely handle text nodes vs element nodes
                const container = range.startContainer;
                const blockEl = container.nodeType === Node.TEXT_NODE
                    ? container.parentElement?.closest('[data-block-id]')
                    : (container.closest ? container.closest('[data-block-id]') : null);

                if (blockEl) {
                    savedBlockId = blockEl.getAttribute('data-block-id');
                    savedOffset = getCursorPosition(blockEl);
                }
            }

            // Clear and rebuild
            editorRef.current.innerHTML = '';


            let isPrevNumbered = false;

            state.blocks.forEach((block, index) => {
                const Tag = BLOCK_TYPE_TAGS[block.type] || 'p';
                const el = document.createElement(Tag);
                el.className = 'block-content';
                el.setAttribute('data-block-id', block.id);
                el.setAttribute('data-block-type', block.type);
                el.setAttribute('data-block-index', index);
                el.setAttribute('data-placeholder', 'Type / for commands');
                el.innerHTML = block.content;

                // Handle List Reset
                if (block.type === 'numbered-list') {
                    if (!isPrevNumbered) {
                        el.setAttribute('data-list-reset', 'true');
                    }
                    isPrevNumbered = true;
                } else {
                    isPrevNumbered = false;
                }

                editorRef.current.appendChild(el);
            });

            // Restore cursor position
            let targetBlockId = savedBlockId;
            let targetOffset = savedOffset;

            // If we lost selection (e.g. clicked outside to menu), check if we have a focused block in state
            if (!targetBlockId && state.focusedBlockId) {
                targetBlockId = state.focusedBlockId;
                // Default to end of block content
                const block = state.blocks.find(b => b.id === targetBlockId);
                targetOffset = block ? block.content.length : 0;
            }

            if (targetBlockId) {
                const targetBlock = editorRef.current.querySelector(`[data-block-id="${targetBlockId}"]`);
                if (targetBlock) {
                    requestAnimationFrame(() => {
                        targetBlock.focus();
                        setCursorPosition(targetBlock, targetOffset);
                    });
                }
            }
        } else {
            // Just update content if needed
            let isPrevNumbered = false;

            existingBlocks.forEach((el, i) => {
                const block = state.blocks[i];
                if (!block) return;

                if (el.innerHTML !== block.content) {
                    el.innerHTML = block.content;
                }
                if (el.getAttribute('data-block-type') !== block.type) {
                    el.setAttribute('data-block-type', block.type);
                }
                if (el.getAttribute('data-placeholder') !== 'Type / for commands') {
                    el.setAttribute('data-placeholder', 'Type / for commands');
                }

                // Handle List Reset Update
                if (block.type === 'numbered-list') {
                    if (!isPrevNumbered) {
                        // Start of group
                        if (el.getAttribute('data-list-reset') !== 'true') {
                            el.setAttribute('data-list-reset', 'true');
                        }
                    } else {
                        // Continuation
                        if (el.hasAttribute('data-list-reset')) {
                            el.removeAttribute('data-list-reset');
                        }
                    }
                    if (el.hasAttribute('data-list-number')) {
                        el.removeAttribute('data-list-number'); // Clean up old attr
                    }
                    isPrevNumbered = true;
                } else {
                    isPrevNumbered = false;
                    if (el.hasAttribute('data-list-reset')) {
                        el.removeAttribute('data-list-reset');
                    }
                }
            });
        }

        // Ensure handles are updated immediately after DOM changes
        updateHandlePositions();
        // Update empty state for placeholders
        updateEmptyState();
    }, [state.blocks, updateHandlePositions, updateEmptyState]);

    // Clear selection when clicking outside editor
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (editorRef.current &&
                !editorRef.current.contains(e.target) &&
                !e.target.closest('.slash-command-menu')
            ) {
                actions.clearSelection();
                closeSlashMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [actions, closeSlashMenu]);

    // Track selection changes to update focused block for placeholder
    useEffect(() => {
        const handleSelectionChange = () => {
            if (!editorRef.current) return;

            const sel = window.getSelection();
            if (!sel.rangeCount) {
                setFocusedBlockId(null);
                return;
            }

            const range = sel.getRangeAt(0);
            const container = range.startContainer;
            const blockEl = container.nodeType === Node.TEXT_NODE
                ? container.parentElement?.closest('[data-block-id]')
                : (container.closest ? container.closest('[data-block-id]') : null);

            if (blockEl && editorRef.current.contains(blockEl)) {
                const blockId = blockEl.getAttribute('data-block-id');
                setFocusedBlockId(blockId);
            } else {
                setFocusedBlockId(null);
            }

            // Update empty state after selection change
            updateEmptyState();
        };

        const debouncedHandler = debounce(handleSelectionChange, 10);
        document.addEventListener('selectionchange', debouncedHandler);

        return () => {
            document.removeEventListener('selectionchange', debouncedHandler);
            // Cancel any pending debounced calls to prevent memory leaks
            debouncedHandler.cancel?.();
        };
    }, [updateEmptyState]);

    // Sync selection state and focused state to DOM
    useEffect(() => {
        if (!editorRef.current) return;

        const blockElements = editorRef.current.querySelectorAll('[data-block-id]');
        blockElements.forEach((el) => {
            const blockId = el.getAttribute('data-block-id');

            // Update selected class
            if (state.selectedBlockIds.includes(blockId)) {
                el.classList.add('block-selected');
            } else {
                el.classList.remove('block-selected');
            }

            // Update being-dragged class
            if (dragState.draggedBlockIds.includes(blockId)) {
                el.classList.add('block-being-dragged');
            } else {
                el.classList.remove('block-being-dragged');
            }

            // Update is-focused class for placeholder
            if (focusedBlockId === blockId) {
                el.classList.add('is-focused');
            } else {
                el.classList.remove('is-focused');
            }
        });
    }, [state.selectedBlockIds, dragState.draggedBlockIds, focusedBlockId]);



    // Update positions when blocks change
    useLayoutEffect(() => {
        updateHandlePositions();
    }, [state.blocks, updateHandlePositions]);

    // Update positions on window resize or content resize
    useEffect(() => {
        if (!editorRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            updateHandlePositions();
        });

        resizeObserver.observe(editorRef.current);

        // Also observe individual blocks if their height might change dynamically (e.g. typing wrapping lines)
        // For now observing the container handles general reflows.

        return () => resizeObserver.disconnect();
    }, [updateHandlePositions]);

    // Auto-focus the first block on mount
    useEffect(() => {
        if (!editorRef.current) return;

        // Small delay to ensure DOM is ready
        requestAnimationFrame(() => {
            const firstBlock = editorRef.current?.querySelector('[data-block-id]');
            if (firstBlock) {
                firstBlock.focus();
                // Place cursor at the start
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(firstBlock, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);

                // Update focused state for placeholder
                const blockId = firstBlock.getAttribute('data-block-id');
                setFocusedBlockId(blockId);
                firstBlock.classList.add('is-focused');

                // Update empty state
                updateEmptyState();
            }
        });
    }, [updateEmptyState]);

    // Get blocks being dragged for preview - use stored blocks from dragState
    const draggedBlocks = dragState.draggedBlocks || [];

    // Build editor class names for drag state
    const editorClassName = [
        'block-editor',
        'unified-editor',
        dragState.isDragging ? 'is-dragging' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={editorClassName}>
            {/* Block handles layer */}
            <div className="block-handles-layer">
                {state.blocks.map((block, index) => (
                    <div
                        key={block.id}
                        className={`block-handle-wrapper ${state.selectedBlockIds.includes(block.id) ? 'selected' : ''} ${hoveredBlockId === block.id ? 'hovered' : ''}`}
                        data-handle-for={block.id}
                        style={{ top: handlePositions[block.id] ?? 0, display: handlePositions[block.id] !== undefined ? 'block' : 'none' }}
                    >
                        <div
                            className="block-handle"
                            onMouseDown={(e) => handleHandleMouseDown(e, block.id, index)}
                        >
                            <GripVertical size={16} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main contentEditable area */}
            <div
                ref={editorRef}
                className="unified-content-area"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => {
                    // Clear block selection when clicking inside editor text/empty space
                    // Only if not holding modifiers (which might be for selection extension)
                    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
                        // We check if we clicked a handle in the handle layer via event bubbling, 
                        // but handles are outside this div usually. 
                        // Wait, handles are in 'block-handles-layer' which is a sibling, not child.
                        // So any click in 'unified-content-area' is definitely not on a handle.
                        // However, we should be careful not to interfere with text selection start.
                        // Clearing block selection is fine.
                        actions.clearSelection();
                    }
                }}
                onMouseMove={(e) => {
                    const blockEl = e.target.closest?.('[data-block-id]');
                    if (blockEl) {
                        const blockId = blockEl.getAttribute('data-block-id');
                        if (blockId !== hoveredBlockId) {
                            setHoveredBlockId(blockId);
                        }
                    } else {
                        setHoveredBlockId(null);
                    }
                }}
                onMouseLeave={() => setHoveredBlockId(null)}
                data-placeholder="Type '/' for commands..."
            />

            {/* Drop indicator line */}
            {dropIndicator.visible && (
                <div
                    className="drop-indicator"
                    style={{ top: dropIndicator.top }}
                />
            )}

            {/* Drag preview */}
            {dragState.isDragging && draggedBlocks.length > 0 && (
                <div
                    className={`drag-preview${dragState.isCopying ? ' is-copying' : ''}`}
                    style={{
                        left: dragState.previewPosition.x,
                        top: dragState.previewPosition.y,
                    }}
                >
                    {draggedBlocks.slice(0, 3).map((block) => (
                        <div key={block.id} className="drag-preview-item">
                            <div
                                className={`drag-preview-content block-type-${block.type}`}
                                dangerouslySetInnerHTML={{ __html: block.content || 'Empty block' }}
                            />
                        </div>
                    ))}
                    {draggedBlocks.length > 3 && (
                        <div className="drag-preview-more">
                            +{draggedBlocks.length - 3} more
                        </div>
                    )}
                </div>
            )}

            {/* Slash command menu */}
            {slashMenu.isOpen && (
                <SlashCommandMenu
                    position={slashMenu.position}
                    filter={slashMenu.filter}
                    onSelect={handleSlashSelect}
                    onClose={closeSlashMenu}
                />
            )}
        </div>
    );
};

export default UnifiedBlockEditor;
