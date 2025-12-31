import React, { useRef, useCallback, useEffect } from 'react';
import Block from './Block';
import SlashCommandMenu from './SlashCommandMenu';
import { useBlockReducer } from './hooks/useBlockReducer';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useClipboard } from './hooks/useClipboard';
import { useSlashMenu } from './hooks/useSlashMenu';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import './BlockEditor.css';

// Markdown shortcuts for quick block type conversion
const MARKDOWN_SHORTCUTS = {
    '# ': 'h1',
    '## ': 'h2',
    '### ': 'h3',
    '- ': 'bulleted-list',
    '* ': 'bulleted-list',
    '1. ': 'numbered-list',
    '> ': 'quote',
};

const BlockEditor = () => {
    const { state, actions } = useBlockReducer();
    const editorRef = useRef(null);
    const lastClickedBlockRef = useRef(null);

    // Custom hooks for modular functionality
    const {
        dragState,
        dropIndicator,
        handleHandleMouseDown,
        handleDragOver,
        handleDrop,
    } = useDragAndDrop({ editorRef, state, actions });

    const { copyBlocksToClipboard, pasteFromClipboard } = useClipboard({
        state,
        actions,
        editorRef,
    });

    const {
        slashMenu,
        openSlashMenu,
        closeSlashMenu,
        updateSlashMenuFilter,
        handleSlashSelect,
    } = useSlashMenu({ state, actions });

    // Global keyboard navigation
    useKeyboardNavigation({
        state,
        actions,
        slashMenu,
        closeSlashMenu,
        copyBlocksToClipboard,
        pasteFromClipboard,
    });

    /**
     * Gets cursor position within a contentEditable element.
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
     * Sets cursor position within a contentEditable element.
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
     * Gets block IDs that have text selection spanning across them.
     */
    const getBlocksWithTextSelection = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return [];

        const range = sel.getRangeAt(0);
        const blockIds = [];

        const blockElements = editorRef.current?.querySelectorAll('[data-block-id]');
        if (!blockElements) return [];

        blockElements.forEach((blockEl) => {
            const blockId = blockEl.getAttribute('data-block-id');
            if (range.intersectsNode(blockEl)) {
                blockIds.push(blockId);
            }
        });

        return blockIds;
    }, []);

    // Listen for cross-block text selection changes
    useEffect(() => {
        const handleSelectionChange = () => {
            const blockIds = getBlocksWithTextSelection();

            if (blockIds.length > 1) {
                actions.setTextSelectionBlocks(blockIds);
            } else if (state.textSelectionBlockIds.length > 0 && blockIds.length <= 1) {
                actions.clearTextSelection();
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [getBlocksWithTextSelection, actions, state.textSelectionBlockIds.length]);

    /**
     * Handles content changes with Markdown shortcut detection.
     */
    const handleContentChange = useCallback((blockId, content) => {
        const block = state.blocks.find(b => b.id === blockId);
        if (!block) {
            actions.updateBlock(blockId, content);
            return;
        }

        // Check for Markdown shortcuts only in paragraph blocks
        if (block.type === 'paragraph') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';

            for (const [shortcut, blockType] of Object.entries(MARKDOWN_SHORTCUTS)) {
                if (textContent.startsWith(shortcut)) {
                    const newContent = textContent.slice(shortcut.length);
                    actions.updateBlock(blockId, newContent);
                    actions.changeBlockType(blockId, blockType);

                    // Set cursor at end of content after type change
                    setTimeout(() => {
                        const element = editorRef.current?.querySelector(
                            `[data-block-id="${blockId}"] .block-content`
                        );
                        if (element) {
                            element.innerHTML = newContent;
                            element.focus();
                            const range = document.createRange();
                            const sel = window.getSelection();
                            if (element.childNodes.length > 0) {
                                const lastChild = element.childNodes[element.childNodes.length - 1];
                                if (lastChild.nodeType === Node.TEXT_NODE) {
                                    range.setStart(lastChild, lastChild.textContent.length);
                                } else {
                                    range.setStartAfter(lastChild);
                                }
                            } else {
                                range.setStart(element, 0);
                            }
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    }, 0);

                    return;
                }
            }
        }

        actions.updateBlock(blockId, content);
    }, [actions, state.blocks]);

    /**
     * Handles keyboard events within a block.
     */
    const handleBlockKeyDown = useCallback((e, blockId, element) => {
        const block = state.blocks.find(b => b.id === blockId);
        if (!block) return;

        const textContent = element.textContent;
        const cursorPos = getCursorPosition(element);
        const blockIndex = state.blocks.findIndex(b => b.id === blockId);

        // Slash command trigger
        if (e.key === '/' && !slashMenu.isOpen) {
            setTimeout(() => {
                openSlashMenu(blockId, element);
            }, 10);
            return;
        }

        // Update slash menu filter while typing
        if (slashMenu.isOpen && slashMenu.blockId === blockId) {
            const slashIndex = textContent.lastIndexOf('/');
            if (slashIndex !== -1) {
                setTimeout(() => {
                    const updatedText = element.textContent;
                    const newFilter = updatedText.slice(slashIndex + 1);
                    updateSlashMenuFilter(newFilter);
                }, 0);
            }

            if (e.key === 'Escape') {
                closeSlashMenu();
                return;
            }

            // Let SlashCommandMenu handle navigation keys
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
                return;
            }
        }

        // Enter key handling
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (slashMenu.isOpen) return;

            // For lists and quotes: convert to paragraph if empty
            if (['bulleted-list', 'numbered-list', 'quote'].includes(block.type)) {
                if (textContent.trim() === '') {
                    actions.changeBlockType(blockId, 'paragraph');
                    return;
                }
            }

            // Create new block or split current one
            if (cursorPos === textContent.length) {
                const newBlockType = ['bulleted-list', 'numbered-list'].includes(block.type)
                    ? block.type
                    : 'paragraph';
                actions.addBlock(blockId, newBlockType);
            } else {
                actions.splitBlock(blockId, cursorPos, textContent);
            }
            return;
        }

        // Backspace handling
        if (e.key === 'Backspace') {
            // Close slash menu if deleting past slash
            if (slashMenu.isOpen) {
                const slashIndex = textContent.lastIndexOf('/');
                if (slashIndex === -1 || cursorPos <= slashIndex) {
                    closeSlashMenu();
                }
            }

            // Delete empty block or convert type
            if (cursorPos === 0 && textContent.length === 0) {
                e.preventDefault();

                if (state.blocks.length > 1) {
                    if (block.type !== 'paragraph') {
                        actions.changeBlockType(blockId, 'paragraph');
                    } else {
                        actions.deleteBlock(blockId);
                    }
                }
                return;
            }

            // Merge with previous block
            if (cursorPos === 0 && textContent.length > 0) {
                e.preventDefault();

                if (block.type !== 'paragraph') {
                    actions.changeBlockType(blockId, 'paragraph');
                    return;
                }

                if (blockIndex > 0) {
                    const prevBlock = state.blocks[blockIndex - 1];
                    const prevLength = prevBlock.content.length;

                    actions.mergeBlocks(blockId);

                    setTimeout(() => {
                        const prevElement = editorRef.current?.querySelector(
                            `[data-block-id="${prevBlock.id}"] .block-content`
                        );
                        if (prevElement) {
                            prevElement.focus();
                            setCursorPosition(prevElement, prevLength);
                        }
                    }, 0);
                }
                return;
            }
        }

        // Arrow Up: move to previous block
        if (e.key === 'ArrowUp' && cursorPos === 0) {
            e.preventDefault();
            if (blockIndex > 0) {
                const prevBlock = state.blocks[blockIndex - 1];
                actions.setFocusedBlock(prevBlock.id);
            }
            return;
        }

        // Arrow Down: move to next block
        if (e.key === 'ArrowDown' && cursorPos === textContent.length) {
            e.preventDefault();
            if (blockIndex < state.blocks.length - 1) {
                const nextBlock = state.blocks[blockIndex + 1];
                actions.setFocusedBlock(nextBlock.id);
            }
            return;
        }

        // Tab: prevent default (could be used for indentation later)
        if (e.key === 'Tab') {
            e.preventDefault();
            return;
        }
    }, [state.blocks, slashMenu, actions, openSlashMenu, closeSlashMenu, updateSlashMenuFilter]);

    /**
     * Handles block focus event.
     */
    const handleBlockFocus = useCallback((blockId) => {
        actions.setFocusedBlock(blockId);
        actions.clearSelection();
    }, [actions]);

    /**
     * Handles click on block handle for selection.
     */
    const handleHandleClick = useCallback((e, blockId) => {
        if (dragState.isDragging) return;

        if (e.shiftKey && lastClickedBlockRef.current) {
            actions.selectBlocksRange(lastClickedBlockRef.current, blockId);
        } else if (e.metaKey || e.ctrlKey) {
            actions.toggleBlockSelection(blockId);
        } else {
            actions.selectBlock(blockId, true);
        }
        lastClickedBlockRef.current = blockId;
    }, [actions, dragState.isDragging]);

    // Clear selection when clicking outside editor
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (editorRef.current && !editorRef.current.contains(e.target)) {
                actions.clearSelection();
                actions.clearTextSelection();
                closeSlashMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [actions, closeSlashMenu]);

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

    // Get blocks being dragged for preview
    const draggedBlocks = dragState.isDragging
        ? state.blocks.filter(b => dragState.draggedBlockIds.includes(b.id))
        : [];

    return (
        <div className="block-editor" ref={editorRef}>
            <div className="block-list">
                {state.blocks.map((block, index) => (
                    <Block
                        key={block.id}
                        block={block}
                        index={index}
                        isSelected={state.selectedBlockIds.includes(block.id)}
                        hasTextSelection={state.textSelectionBlockIds.includes(block.id)}
                        isBeingDragged={dragState.draggedBlockIds.includes(block.id)}
                        isFocused={state.focusedBlockId === block.id}
                        focusVersion={state.focusVersion}
                        onContentChange={handleContentChange}
                        onKeyDown={handleBlockKeyDown}
                        onFocus={handleBlockFocus}
                        onHandleMouseDown={handleHandleMouseDown}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onHandleClick={handleHandleClick}
                        listNumber={block.type === 'numbered-list' ? getListNumber(index) : null}
                    />
                ))}
            </div>

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
                    className="drag-preview"
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

export default BlockEditor;
