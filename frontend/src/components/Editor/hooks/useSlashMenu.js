import { useState, useCallback } from 'react';
import { getPlainText, createTextNode } from '../utils/ast';

/**
 * Custom hook for managing the slash command menu state.
 * Handles opening, closing, and selection of block types.
 */
export function useSlashMenu({ state, actions }) {
    // Slash command menu state
    const [slashMenu, setSlashMenu] = useState({
        isOpen: false,
        position: { top: 0, left: 0 },
        filter: '',
        blockId: null,
    });

    /**
     * Opens the slash command menu at the current cursor position.
     */
    const openSlashMenu = useCallback((blockId, element) => {
        const rect = element.getBoundingClientRect();
        const sel = window.getSelection();

        let left = rect.left;
        let top = rect.bottom + 4;

        // Position menu at cursor if there's a selection
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const rangeRect = range.getBoundingClientRect();
            if (rangeRect.width > 0 || rangeRect.height > 0) {
                left = rangeRect.left;
                top = rangeRect.bottom + 4;
            }
        }

        setSlashMenu({
            isOpen: true,
            position: { top, left },
            filter: '',
            blockId,
        });
    }, []);

    /**
     * Closes the slash command menu.
     */
    const closeSlashMenu = useCallback(() => {
        setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    /**
     * Updates the filter for slash menu items.
     */
    const updateSlashMenuFilter = useCallback((newFilter) => {
        setSlashMenu(prev => ({ ...prev, filter: newFilter }));
    }, []);

    /**
     * Handles selection of a block type from the slash menu.
     * Removes the slash command from content and applies the new type.
     */
    const handleSlashSelect = useCallback((blockType) => {
        if (slashMenu.blockId) {
            const block = state.blocks.find(b => b.id === slashMenu.blockId);
            if (block) {
                // Get plain text from AST children
                const plainText = getPlainText(block.children || []);

                const slashIndex = plainText.lastIndexOf('/');
                let newContent = plainText;
                if (slashIndex !== -1) {
                    newContent = plainText.slice(0, slashIndex);
                }

                actions.updateBlock(slashMenu.blockId, newContent);
                actions.changeBlockType(slashMenu.blockId, blockType);
                actions.setFocusedBlock(slashMenu.blockId);
            }
        }
        closeSlashMenu();
    }, [slashMenu.blockId, state.blocks, actions, closeSlashMenu]);

    return {
        slashMenu,
        openSlashMenu,
        closeSlashMenu,
        updateSlashMenuFilter,
        handleSlashSelect,
    };
}

export default useSlashMenu;
