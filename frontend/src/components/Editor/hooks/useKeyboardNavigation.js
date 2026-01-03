import { useEffect, useCallback } from 'react';

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
        if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
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
        if ((e.key === 'Delete' || e.key === 'Backspace') && hasActualTextSelection && hasTextSelection) {
            e.preventDefault();
            const selectionInfo = getSelectionForDeletion?.();
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
