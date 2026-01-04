import { useEffect, useCallback } from 'react';
import { createLogger } from '../utils/debugLog';

const log = createLogger('KeyboardNav');

/**
 * Custom hook for handling global keyboard shortcuts in the Block Editor.
 * Manages copy, cut, paste, select all, delete, and escape shortcuts.
 */
export function useKeyboardNavigation({
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
}) {
    /**
     * Global keyboard event handler for editor shortcuts.
     */
    const handleGlobalKeyDown = useCallback((e) => {
        const hasSelectedBlocks = state.selectedBlockIds.length > 0;
        const hasTextSelection = state.textSelectionBlockIds.length > 0;

        // Check for actual text selection in document
        const sel = window.getSelection();
        const hasActualTextSelection = sel && !sel.isCollapsed && sel.toString().length > 0;

        // Handle Shift+Arrow for cross-block selection extension
        if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            if (handleKeyboardSelection?.(e)) {
                return;
            }
        }

        // Undo: Cmd/Ctrl + Z (without Shift)
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            actions.undo?.();
            return;
        }

        // Redo: Cmd/Ctrl + Shift + Z OR Ctrl + Y
        if (
            ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
            (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'y')
        ) {
            e.preventDefault();
            actions.redo?.();
            return;
        }

        // Copy: Cmd/Ctrl + C
        if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
            // First check for text selection across blocks
            if (hasActualTextSelection && hasTextSelection) {
                e.preventDefault();
                copySelectedTextToClipboard?.(false);
                return;
            }
            // Then check for block selection
            if (hasSelectedBlocks) {
                e.preventDefault();
                copyBlocksToClipboard(state.selectedBlockIds, false);
                return;
            }
            // Single block text selection - let browser handle it
            if (hasActualTextSelection) {
                return; // Let browser handle native copy
            }
        }

        // Cut: Cmd/Ctrl + X
        if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
            // First check for text selection across blocks
            if (hasActualTextSelection && hasTextSelection) {
                e.preventDefault();
                cutSelectedText?.();
                return;
            }
            // Then check for block selection
            if (hasSelectedBlocks) {
                e.preventDefault();
                copyBlocksToClipboard(state.selectedBlockIds, true);
                return;
            }
            // Single block text selection - let browser handle it
            if (hasActualTextSelection) {
                return; // Let browser handle native cut
            }
        }

        // Paste: Cmd/Ctrl + V
        // Always intercept to ensure proper block structure is maintained
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
            // Don't intercept if focus is in an input/textarea or popover
            // Check both activeElement and event target for most reliable detection
            const activeEl = document.activeElement;
            const targetEl = e.target;

            // Check activeElement
            const activeTagName = activeEl?.tagName?.toUpperCase();
            const isActiveInput = activeTagName === 'INPUT' || activeTagName === 'TEXTAREA';

            // Check e.target 
            const targetTagName = targetEl?.tagName?.toUpperCase();
            const isTargetInput = targetTagName === 'INPUT' || targetTagName === 'TEXTAREA';

            const isInInput = isActiveInput || isTargetInput;

            // Check if inside any popover or dialog (check both elements)
            const checkPopover = (el) => {
                if (!el) return false;
                return el.closest('.link-popover') ||
                    el.closest('.slash-command-menu') ||
                    el.closest('.formatting-popup') ||
                    el.closest('[role="dialog"]') ||
                    el.classList?.contains('link-popover-input');
            };

            const isInPopover = checkPopover(activeEl) || checkPopover(targetEl);

            if (isInInput || isInPopover) {
                return; // Allow native paste in inputs and popovers
            }

            e.preventDefault();

            // Shift+V = plain text paste
            if (e.shiftKey) {
                pasteFromClipboard(true);
                return;
            }

            // Normal paste with block structure preservation
            pasteFromClipboard(false);
            return;
        }

        // Select All: Cmd/Ctrl + A
        if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
            if (state.selectedBlockIds.length > 0) {
                e.preventDefault();
                actions.selectAll();
                return;
            }
        }

        // Delete/Backspace when text is selected across blocks
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // DEBUG: Log state values
            log('Delete pressed:', {
                hasActualTextSelection,
                hasTextSelection,
                textSelectionBlockIds: state.textSelectionBlockIds
            });

            if (hasActualTextSelection && hasTextSelection) {
                e.preventDefault();
                const selectionInfo = getSelectionForDeletion?.();
                log('selectionInfo:', selectionInfo);
                if (selectionInfo && !selectionInfo.isSingleBlock) {
                    actions.deleteCrossSelection(
                        selectionInfo.startBlockId,
                        selectionInfo.endBlockId,
                        selectionInfo.startOffset,
                        selectionInfo.endOffset
                    );
                    window.getSelection()?.removeAllRanges();
                    actions.clearTextSelection();
                }
                return;
            }
        }

        // Delete/Backspace when blocks are selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelectedBlocks) {
            e.preventDefault();
            actions.deleteSelectedBlocks();
            return;
        }

        // Escape: close menu or clear selection
        if (e.key === 'Escape') {
            if (slashMenu.isOpen) {
                closeSlashMenu();
            } else if (state.selectedBlockIds.length > 0) {
                actions.clearSelection();
            } else if (state.textSelectionBlockIds.length > 0) {
                actions.clearTextSelection();
                window.getSelection()?.removeAllRanges();
            }
        }
    }, [
        state.selectedBlockIds,
        state.textSelectionBlockIds,
        slashMenu.isOpen,
        actions,
        copyBlocksToClipboard,
        copySelectedTextToClipboard,
        cutSelectedText,
        pasteFromClipboard,
        handleKeyboardSelection,
        getSelectionForDeletion,
        closeSlashMenu,
    ]);

    // Attach global keyboard listener
    useEffect(() => {
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);
}

export default useKeyboardNavigation;
