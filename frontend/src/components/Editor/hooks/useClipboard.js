import { useCallback } from 'react';

// Storage key for block clipboard data
const CLIPBOARD_STORAGE_KEY = 'notion_blocks_clipboard';

/**
 * Custom hook for managing clipboard operations in the Block Editor.
 * Supports copy/cut/paste of single and multiple blocks.
 */
export function useClipboard({ state, actions, editorRef }) {
    /**
     * Copies selected blocks to clipboard.
     * Stores both plain text and structured block data.
     * @param {string[]} blockIds - IDs of blocks to copy
     * @param {boolean} cut - If true, deletes blocks after copying
     */
    const copyBlocksToClipboard = useCallback(async (blockIds, cut = false) => {
        const blocksToCopy = state.blocks.filter(b => blockIds.includes(b.id));
        if (blocksToCopy.length === 0) return;

        // Prepare structured data for block-aware paste
        const blocksData = blocksToCopy.map(b => ({
            type: b.type,
            content: b.content,
        }));

        // Generate plain text version
        const plainText = blocksToCopy.map(b => {
            const div = document.createElement('div');
            div.innerHTML = b.content;
            return div.textContent || div.innerText || '';
        }).join('\n');

        // Generate HTML version
        const html = blocksToCopy.map(b => {
            const tag = b.type === 'h1' ? 'h1' : b.type === 'h2' ? 'h2' : b.type === 'h3' ? 'h3' :
                b.type === 'quote' ? 'blockquote' : b.type.includes('list') ? 'li' : 'p';
            return `<${tag}>${b.content}</${tag}>`;
        }).join('');

        try {
            // Use modern Clipboard API
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([plainText], { type: 'text/plain' }),
                'text/html': new Blob([html], { type: 'text/html' }),
            });
            await navigator.clipboard.write([clipboardItem]);

            // Store structured data in sessionStorage (safer than window global)
            sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(blocksData));

            if (cut) {
                blockIds.forEach(id => actions.deleteBlock(id));
                actions.clearSelection();
                actions.clearTextSelection();
            }
        } catch (err) {
            // Fallback for browsers without full Clipboard API support
            await navigator.clipboard.writeText(plainText);
            sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(blocksData));

            if (cut) {
                blockIds.forEach(id => actions.deleteBlock(id));
                actions.clearSelection();
                actions.clearTextSelection();
            }
        }
    }, [state.blocks, actions]);

    /**
     * Pastes content from clipboard.
     * @param {boolean} asPlainText - If true, pastes as plain text only
     */
    const pasteFromClipboard = useCallback(async (asPlainText = false) => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const storedBlocksJson = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
            const storedBlocks = storedBlocksJson ? JSON.parse(storedBlocksJson) : null;
            const focusedBlockId = state.focusedBlockId;

            // If structured paste and we have stored blocks
            if (!asPlainText && storedBlocks && storedBlocks.length > 0) {
                if (focusedBlockId) {
                    actions.insertBlocks(focusedBlockId, storedBlocks);
                } else if (state.blocks.length > 0) {
                    actions.insertBlocks(state.blocks[state.blocks.length - 1].id, storedBlocks);
                }
            } else {
                // Plain text paste into current block
                if (focusedBlockId) {
                    const element = editorRef.current?.querySelector(
                        `[data-block-id="${focusedBlockId}"] .block-content`
                    );
                    if (element) {
                        const sel = window.getSelection();
                        if (sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(document.createTextNode(clipboardText));
                            range.collapse(false);

                            const block = state.blocks.find(b => b.id === focusedBlockId);
                            if (block) {
                                actions.updateBlock(focusedBlockId, element.innerHTML);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    }, [state.focusedBlockId, state.blocks, actions, editorRef]);

    return {
        copyBlocksToClipboard,
        pasteFromClipboard,
    };
}

export default useClipboard;
