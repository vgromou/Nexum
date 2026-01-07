import React, { useRef, useCallback, useEffect, useState, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { GripVertical } from 'lucide-react';
import SlashCommandMenu from './SlashCommandMenu';
import FormattingMenu from './FormattingMenu';
import LinkPopover from './LinkPopover';
import { useBlockReducer } from './hooks/useBlockReducer';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useClipboard } from './hooks/useClipboard';
import { useSlashMenu } from './hooks/useSlashMenu';
import { useFormattingMenu } from './hooks/useFormattingMenu';
import { useLinkPopover } from './hooks/useLinkPopover';
import { useCrossBlockSelection } from './hooks/useCrossBlockSelection';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { debounce } from '../../utils/debounce';
import { isValidUrl, normalizeUrl } from '../../utils/urlUtils';
import { getCursorState, restoreCursor } from './utils/cursor';
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
const UnifiedBlockEditor = forwardRef(({ readOnly = false }, ref) => {
    const { state, actions } = useBlockReducer();
    const editorRef = useRef(null);
    const isUpdatingFromDOM = useRef(false);
    const autoOpenLinkTimeoutRef = useRef(null);
    const [hoveredBlockId, setHoveredBlockId] = useState(null);
    const [handlePositions, setHandlePositions] = useState({});
    const [focusedBlockId, setFocusedBlockId] = useState(null);

    // Cleanup auto-open link timeout on unmount only
    useEffect(() => {
        return () => {
            if (autoOpenLinkTimeoutRef.current) {
                clearTimeout(autoOpenLinkTimeoutRef.current);
            }
        };
    }, []);

    // Expose block state methods to parent via ref
    useImperativeHandle(ref, () => ({
        /**
         * Get a deep copy of the current blocks state.
         * Used for snapshotting before edit mode.
         */
        getBlocks: () => structuredClone(state.blocks),
        /**
         * Replace all blocks with the provided blocks array.
         * Used for restoring state on cancel.
         */
        setBlocks: (blocks) => actions.setBlocks(blocks),
        /**
         * Focus the first block if it's the only block and is empty.
         * Used when entering edit mode on an empty page.
         * @returns {boolean} true if focused, false otherwise
         */
        focusFirstEmptyBlock: () => {
            if (!editorRef.current) return false;

            // Check if there's only one block and it's empty
            const blocks = state.blocks;
            if (blocks.length !== 1) return false;

            const firstBlock = blocks[0];
            const textContent = firstBlock.content?.replace(/<[^>]*>/g, '').trim() || '';
            if (textContent !== '') return false;

            // Focus the empty block
            const blockEl = editorRef.current.querySelector('[data-block-id]');
            if (!blockEl) return false;

            requestAnimationFrame(() => {
                blockEl.focus();
                // Place cursor at the start
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(blockEl, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);

                // Update focused state for placeholder
                const blockId = blockEl.getAttribute('data-block-id');
                setFocusedBlockId(blockId);
                blockEl.classList.add('is-focused');
            });

            return true;
        },
    }), [state.blocks, actions]);


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

    // Formatting Menu Hook
    const {
        menu: formattingMenu,
        toggleSubmenu,
        applyFormat,
        applyHighlight,
        clearHighlight,
        applyLinkToSelection,
        removeLink,
        changeBlockType: changeBlockTypeFromMenu,
        getMenuPosition,
    } = useFormattingMenu({ editorRef, state, actions });

    // Link Popover Hook
    const {
        state: linkPopoverState,
        openForSelection: openLinkPopoverForSelection,
        openForLink: openLinkPopoverForLink,
        applyLink: applyLinkFromPopover,
        unlinkCurrentLink,
        close: closeLinkPopover,
        checkCursorInLink,
        cancelScheduledClose: cancelLinkPopoverClose,
        scheduleClose: scheduleLinkPopoverClose,
    } = useLinkPopover({ editorRef, onApplyLink: applyLinkToSelection });

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
        readOnly,
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
            const indentLevel = parseInt(el.getAttribute('data-indent-level') || '0', 10);

            newBlocks.push({
                id: blockId,
                type: blockType,
                content,
                indentLevel,
            });
        });

        // Only update if content, type, or indentLevel actually changed
        const hasChanges = newBlocks.some((newBlock, i) => {
            const oldBlock = state.blocks[i];
            return !oldBlock ||
                oldBlock.content !== newBlock.content ||
                oldBlock.type !== newBlock.type ||
                (oldBlock.indentLevel ?? 0) !== newBlock.indentLevel;
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
     * Cleans up formatting tags when a block is empty.
     * This removes color highlights, bold, italic, etc. to prevent
     * new text from inheriting old formatting.
     */
    /**
     * Cleans up formatting tags when a block is empty.
     * This removes color highlights, bold, italic, etc. to prevent
     * new text from inheriting old formatting.
     */
    const cleanupEmptyBlockFormatting = useCallback((blockEl) => {
        if (!blockEl) return;

        const textContent = blockEl.textContent || '';
        if (textContent.trim() !== '') return; // Only clean empty blocks

        // If completely empty (no children) or has formatting tags
        const hasFormatting = blockEl.querySelector('span, b, i, u, s, a, strong, em');

        // Even if no tags, we might have sticky cursor style.
        // We force a cleanup if it's empty.

        // 1. Clear content explicitly
        blockEl.innerHTML = '';

        // 2. Insert a Zero Width Space to give us something to select
        const tempText = document.createTextNode('\u200B');
        blockEl.appendChild(tempText);

        // 3. Select the temp text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(blockEl);
        sel.removeAllRanges();
        sel.addRange(range);

        // 4. Force remove format
        try {
            document.execCommand('removeFormat', false, null);
            ['bold', 'italic', 'underline', 'strikeThrough'].forEach(cmd => {
                if (document.queryCommandState(cmd)) {
                    document.execCommand(cmd, false, null);
                }
            });
        } catch (e) {
            // Ignore errors
        }

        // 5. Remove the temp text effectively clearing the block
        blockEl.textContent = '';

        // 6. Reset cursor to start
        const newRange = document.createRange();
        newRange.setStart(blockEl, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
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

            // Clean up formatting when block is empty (backup check)
            cleanupEmptyBlockFormatting(blockEl);

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
    }, [debouncedSync, updateEmptyState, cleanupEmptyBlockFormatting]);

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
        const currentIndentLevel = parseInt(blockEl.getAttribute('data-indent-level') || '0', 10);

        // Tab key - increase indent level for lists
        if (e.key === 'Tab' && !e.shiftKey) {
            // Only for list types
            if (['bulleted-list', 'numbered-list'].includes(blockType)) {
                e.preventDefault();

                // Find previous block to determine max allowed indent
                const blockIndex = state.blocks.findIndex(b => b.id === blockId);
                const prevBlock = blockIndex > 0 ? state.blocks[blockIndex - 1] : null;
                const prevIndent = prevBlock?.indentLevel ?? 0;
                // Can't be more than prev+1 and max is 2
                const maxAllowedIndent = Math.min(prevIndent + 1, 2);

                if (currentIndentLevel < maxAllowedIndent) {
                    actions.setIndentLevel(blockId, currentIndentLevel + 1);
                }
                return;
            }
            // For non-list blocks, let default Tab behavior (or do nothing)
            return;
        }

        // Shift+Tab - decrease indent level for lists
        if (e.key === 'Tab' && e.shiftKey) {
            if (['bulleted-list', 'numbered-list'].includes(blockType)) {
                e.preventDefault();

                if (currentIndentLevel > 0) {
                    actions.setIndentLevel(blockId, currentIndentLevel - 1);
                }
                return;
            }
            return;
        }

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

            // For lists and quotes: handle empty block behavior
            if (['bulleted-list', 'numbered-list', 'quote'].includes(blockType)) {
                if (textContent.trim() === '') {
                    // For nested lists - first decrease indent level
                    if (['bulleted-list', 'numbered-list'].includes(blockType) && currentIndentLevel > 0) {
                        actions.setIndentLevel(blockId, currentIndentLevel - 1);
                        debouncedSync();
                        return;
                    }

                    // At indent level 0 or for quotes - convert to paragraph
                    blockEl.setAttribute('data-block-type', 'paragraph');
                    blockEl.setAttribute('data-indent-level', '0');
                    const newTag = BLOCK_TYPE_TAGS['paragraph'];
                    if (blockEl.tagName.toLowerCase() !== newTag) {
                        const newEl = document.createElement(newTag);
                        newEl.className = 'block-content';
                        newEl.setAttribute('data-block-id', blockId);
                        newEl.setAttribute('data-block-type', 'paragraph');
                        newEl.setAttribute('data-indent-level', '0');
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
            newBlockEl.setAttribute('data-indent-level', currentIndentLevel); // Inherit indent level
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

                // For lists with indent level > 0, first decrease indent
                if (['bulleted-list', 'numbered-list'].includes(blockType) && currentIndentLevel > 0) {
                    actions.setIndentLevel(blockId, currentIndentLevel - 1);
                    debouncedSync();
                    return;
                }

                // Then convert non-paragraph blocks to paragraph
                if (blockType !== 'paragraph') {
                    blockEl.setAttribute('data-block-type', 'paragraph');
                    blockEl.setAttribute('data-indent-level', '0');
                    const newTag = BLOCK_TYPE_TAGS['paragraph'];
                    if (blockEl.tagName.toLowerCase() !== newTag) {
                        const newEl = document.createElement(newTag);
                        newEl.className = 'block-content';
                        newEl.setAttribute('data-block-id', blockId);
                        newEl.setAttribute('data-block-type', 'paragraph');
                        newEl.setAttribute('data-indent-level', '0');
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

        // Paste (Ctrl/Cmd+V) is handled by useKeyboardNavigation
        // to ensure proper block structure is maintained

        // Link shortcut (Ctrl/Cmd+K)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            // Check if cursor is inside a link
            const linkEl = checkCursorInLink();
            if (linkEl) {
                // Open link popover for editing
                openLinkPopoverForLink(linkEl);
            } else if (!sel.isCollapsed) {
                // Has text selection - open link popover for creating link
                const menuPos = getMenuPosition();
                openLinkPopoverForSelection(menuPos);
            }
            return;
        }
    }, [slashMenu, openSlashMenu, closeSlashMenu, updateSlashMenuFilter, debouncedSync, checkCursorInLink, openLinkPopoverForLink, openLinkPopoverForSelection, getMenuPosition, state.blocks, actions]);

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
                el.setAttribute('data-indent-level', block.indentLevel ?? 0);
                el.setAttribute('data-placeholder', 'Type / for commands');
                el.innerHTML = block.content;

                const indentLevel = block.indentLevel ?? 0;

                // Handle List Reset for numbered lists
                if (block.type === 'numbered-list') {
                    // Level 0 reset - only when previous block is NOT numbered-list
                    if (indentLevel === 0 && !isPrevNumbered) {
                        el.setAttribute('data-list-reset', 'true');
                    }
                    // Level 1 reset - only when coming from level < 1 (i.e. level 0 or non-list)
                    if (indentLevel === 1) {
                        const prevBlock = state.blocks[index - 1];
                        const prevLevel = prevBlock?.type === 'numbered-list' ? (prevBlock.indentLevel ?? 0) : -1;
                        if (prevLevel < 1) {
                            el.setAttribute('data-list-reset-1', 'true');
                        }
                    }
                    // Level 2 reset - only when coming from level < 2
                    if (indentLevel === 2) {
                        const prevBlock = state.blocks[index - 1];
                        const prevLevel = prevBlock?.type === 'numbered-list' ? (prevBlock.indentLevel ?? 0) : -1;
                        if (prevLevel < 2) {
                            el.setAttribute('data-list-reset-2', 'true');
                        }
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

                const indentLevel = block.indentLevel ?? 0;

                if (el.innerHTML !== block.content) {
                    el.innerHTML = block.content;
                }
                if (el.getAttribute('data-block-type') !== block.type) {
                    el.setAttribute('data-block-type', block.type);
                }
                // Update indent level
                if (el.getAttribute('data-indent-level') !== String(indentLevel)) {
                    el.setAttribute('data-indent-level', indentLevel);
                }
                if (el.getAttribute('data-placeholder') !== 'Type / for commands') {
                    el.setAttribute('data-placeholder', 'Type / for commands');
                }

                // Handle List Reset Update for all levels
                if (block.type === 'numbered-list') {
                    // Level 0 reset
                    if (indentLevel === 0 && !isPrevNumbered) {
                        if (el.getAttribute('data-list-reset') !== 'true') {
                            el.setAttribute('data-list-reset', 'true');
                        }
                    } else if (el.hasAttribute('data-list-reset') && indentLevel !== 0) {
                        el.removeAttribute('data-list-reset');
                    }

                    // Level 1 reset - only when coming from level < 1
                    const prevBlock = state.blocks[i - 1];
                    const prevLevel = prevBlock?.type === 'numbered-list' ? (prevBlock.indentLevel ?? 0) : -1;
                    if (indentLevel === 1 && prevLevel < 1) {
                        el.setAttribute('data-list-reset-1', 'true');
                    } else {
                        el.removeAttribute('data-list-reset-1');
                    }

                    // Level 2 reset - only when coming from level < 2
                    if (indentLevel === 2 && prevLevel < 2) {
                        el.setAttribute('data-list-reset-2', 'true');
                    } else {
                        el.removeAttribute('data-list-reset-2');
                    }

                    if (el.hasAttribute('data-list-number')) {
                        el.removeAttribute('data-list-number'); // Clean up old attr
                    }
                    isPrevNumbered = true;
                } else {
                    isPrevNumbered = false;
                    // Clean up list reset attrs for non-list blocks
                    el.removeAttribute('data-list-reset');
                    el.removeAttribute('data-list-reset-1');
                    el.removeAttribute('data-list-reset-2');
                }
            });
        }

        // Ensure handles are updated immediately after DOM changes
        updateHandlePositions();
        // Update empty state for placeholders
        updateEmptyState();
    }, [state.blocks, updateHandlePositions, updateEmptyState]);

    // Restore cursor position after undo/redo
    useEffect(() => {
        if (state.pendingCursor) {
            // Use requestAnimationFrame to ensure DOM has been updated
            requestAnimationFrame(() => {
                restoreCursor(editorRef, state.pendingCursor);
                actions.clearPendingCursor?.();
            });
        }
    }, [state.pendingCursor, actions]);

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

            // Check for cursor inside link (collapsed selection only)
            // Skip if focus is inside the link popover (input is focused)
            const activeElement = document.activeElement;
            const isPopoverInputFocused = activeElement?.closest('.link-popover');

            if (sel.isCollapsed && !isPopoverInputFocused) {
                const linkEl = checkCursorInLink();
                if (linkEl) {
                    // Cancel any scheduled close
                    cancelLinkPopoverClose();
                    // Clear any previous auto-open timeout
                    if (autoOpenLinkTimeoutRef.current) {
                        clearTimeout(autoOpenLinkTimeoutRef.current);
                    }
                    // Store the href and block ID for comparison
                    const targetHref = linkEl.href;
                    const targetBlockId = linkEl.closest('[data-block-id]')?.getAttribute('data-block-id');
                    // Open popover for this link with a slight delay
                    autoOpenLinkTimeoutRef.current = setTimeout(() => {
                        const currentLink = checkCursorInLink();
                        // Compare both href AND block ID to handle multiple links with same URL
                        const currentBlockId = currentLink?.closest('[data-block-id]')?.getAttribute('data-block-id');
                        if (currentLink && currentLink.href === targetHref && currentBlockId === targetBlockId) {
                            // Open popover but keep cursor in text
                            openLinkPopoverForLink(currentLink, true); // pass true to preserve cursor
                        }
                        autoOpenLinkTimeoutRef.current = null;
                    }, 300);
                } else {
                    // Cursor moved away from links - clear pending auto-open
                    if (autoOpenLinkTimeoutRef.current) {
                        clearTimeout(autoOpenLinkTimeoutRef.current);
                        autoOpenLinkTimeoutRef.current = null;
                    }
                }
            } else if (sel.isCollapsed && linkPopoverState.isOpen && linkPopoverState.isEditing && !isPopoverInputFocused) {
                // Only close if popover was opened for EDITING (cursor on existing link)
                // Don't close if opened for creating a NEW link (from FormattingMenu)
                // Don't close if focus is on the popover input
                const linkEl = checkCursorInLink();
                if (!linkEl) {
                    scheduleLinkPopoverClose(150);
                }
            }

            // Update empty state after selection change
            updateEmptyState();

            // Track cursor position for undo/redo history
            if (editorRef.current?.contains(sel.anchorNode)) {
                const cursor = getCursorState({ current: editorRef.current });
                if (cursor) {
                    actions.setLastCursor?.(cursor);
                }
            }
        };

        const debouncedHandler = debounce(handleSelectionChange, 10);
        document.addEventListener('selectionchange', debouncedHandler);

        return () => {
            document.removeEventListener('selectionchange', debouncedHandler);
            // Cancel any pending debounced calls to prevent memory leaks
            debouncedHandler.cancel?.();
            // DO NOT clear auto-open timeout here - it needs to survive dependency changes
            // The timeout will be cleared on next selectionchange or component unmount
        };
    }, [updateEmptyState, checkCursorInLink, openLinkPopoverForLink, linkPopoverState.isOpen, linkPopoverState.isEditing, cancelLinkPopoverClose, scheduleLinkPopoverClose, actions]);

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

    // Handle paste for URL linking
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handlePaste = (e) => {
            // Disable smart URL paste in read-only mode
            if (readOnly) return;

            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            // Only handle if there's a text selection
            if (sel.isCollapsed) return;

            // Check if selection is within editor
            const range = sel.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const blockEl = container.nodeType === Node.TEXT_NODE
                ? container.parentElement?.closest('[data-block-id]')
                : container.closest?.('[data-block-id]');

            if (!blockEl || !editor.contains(blockEl)) return;

            // Get clipboard text
            const clipboardText = e.clipboardData?.getData('text/plain');
            if (!clipboardText || !isValidUrl(clipboardText)) return;

            // We have a valid URL and selected text - create a link
            e.preventDefault();

            const normalizedUrl = normalizeUrl(clipboardText);
            document.execCommand('createLink', false, normalizedUrl);
        };

        editor.addEventListener('paste', handlePaste);

        return () => {
            editor.removeEventListener('paste', handlePaste);
        };
    }, [readOnly]);


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
        readOnly ? 'read-only' : '',
    ].filter(Boolean).join(' ');

    // Handle click on links in read-only mode
    const handleEditorClick = useCallback((e) => {
        if (!readOnly) return;

        // Check if clicked on a link
        const linkEl = e.target.closest('a');
        if (linkEl && linkEl.href) {
            e.preventDefault();
            e.stopPropagation();
            window.open(linkEl.href, '_blank', 'noopener,noreferrer');
        }
    }, [readOnly]);

    return (
        <div className={editorClassName}>
            {/* Block handles layer - hidden in read-only mode */}
            {!readOnly && (
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
            )}

            {/* Main contentEditable area */}
            <div
                ref={editorRef}
                className="unified-content-area"
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={readOnly ? undefined : handleInput}
                onKeyDown={readOnly ? undefined : handleKeyDown}
                onClick={handleEditorClick}
                onKeyUp={readOnly ? undefined : (e) => {
                    // Clean up formatting after Backspace/Delete if block becomes empty
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        const sel = window.getSelection();
                        if (!sel.rangeCount) return;

                        const blockEl = sel.anchorNode?.nodeType === Node.TEXT_NODE
                            ? sel.anchorNode.parentElement?.closest('[data-block-id]')
                            : sel.anchorNode?.closest?.('[data-block-id]');

                        if (blockEl) {
                            cleanupEmptyBlockFormatting(blockEl);
                        }
                    }
                }}
                onMouseDown={readOnly ? undefined : (e) => {
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
                onMouseMove={readOnly ? undefined : (e) => {
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
                onMouseLeave={readOnly ? undefined : () => setHoveredBlockId(null)}
                data-placeholder={readOnly ? '' : "Type '/' for commands..."}
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

            {/* Slash command menu - hidden in read-only mode */}
            {!readOnly && slashMenu.isOpen && (
                <SlashCommandMenu
                    position={slashMenu.position}
                    filter={slashMenu.filter}
                    onSelect={handleSlashSelect}
                    onClose={closeSlashMenu}
                />
            )}

            {/* Formatting menu - hidden in read-only mode */}
            {!readOnly && formattingMenu.isOpen && (
                <FormattingMenu
                    position={formattingMenu.position}
                    currentBlockType={formattingMenu.currentBlockType}
                    activeFormats={formattingMenu.activeFormats}
                    activeSubmenu={formattingMenu.activeSubmenu}
                    onToggleSubmenu={toggleSubmenu}
                    onFormat={applyFormat}
                    onHighlight={applyHighlight}
                    onClearHighlight={clearHighlight}
                    onOpenLinkPopover={() => {
                        const menuPos = getMenuPosition();
                        openLinkPopoverForSelection(menuPos);
                    }}
                    onRemoveLink={removeLink}
                    onChangeBlockType={changeBlockTypeFromMenu}
                />
            )}

            {/* Link popover - hidden in read-only mode */}
            {!readOnly && (
                <LinkPopover
                    isOpen={linkPopoverState.isOpen}
                    position={linkPopoverState.position}
                    currentUrl={linkPopoverState.currentUrl}
                    isEditing={linkPopoverState.isEditing}
                    autoFocusInput={linkPopoverState.autoFocusInput}
                    onApply={applyLinkFromPopover}
                    onUnlink={unlinkCurrentLink}
                    onClose={closeLinkPopover}
                    formattingMenuHeight={40}
                />
            )}
        </div>
    );
});

// Display name for debugging
UnifiedBlockEditor.displayName = 'UnifiedBlockEditor';

export default UnifiedBlockEditor;
