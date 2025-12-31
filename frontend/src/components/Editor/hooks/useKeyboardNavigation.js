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
    pasteFromClipboard,
}) {
    /**
     * Global keyboard event handler for editor shortcuts.
     */
    const handleGlobalKeyDown = useCallback((e) => {
        const hasSelectedBlocks = state.selectedBlockIds.length > 0;
        const hasTextSelection = state.textSelectionBlockIds.length > 0;
        const activeBlockIds = hasSelectedBlocks ? state.selectedBlockIds :
            hasTextSelection ? state.textSelectionBlockIds : [];

        // Copy: Cmd/Ctrl + C
        if ((e.metaKey || e.ctrlKey) && e.key === 'c' && activeBlockIds.length > 0) {
            e.preventDefault();
            copyBlocksToClipboard(activeBlockIds, false);
            return;
        }

        // Cut: Cmd/Ctrl + X
        if ((e.metaKey || e.ctrlKey) && e.key === 'x' && activeBlockIds.length > 0) {
            e.preventDefault();
            copyBlocksToClipboard(activeBlockIds, true);
            return;
        }

        // Paste: Cmd/Ctrl + V
        if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
            const activeEl = document.activeElement;
            const isInContentEditable = activeEl?.closest?.('.block-content');

            // Shift+V = plain text paste, or paste when in contentEditable
            if (e.shiftKey || isInContentEditable) {
                if (!e.shiftKey && isInContentEditable) {
                    // Let browser handle normal paste in contentEditable
                    return;
                }
                e.preventDefault();
                pasteFromClipboard(true);
            } else if (hasSelectedBlocks || hasTextSelection) {
                e.preventDefault();
                pasteFromClipboard(false);
            }
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

        // Delete/Backspace when blocks are selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedBlockIds.length > 0) {
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
        pasteFromClipboard,
        closeSlashMenu,
    ]);

    // Attach global keyboard listener
    useEffect(() => {
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);
}

export default useKeyboardNavigation;
