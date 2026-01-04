import { useCallback } from 'react';
import DOMPurify from 'dompurify';

// Storage key for block clipboard data
const CLIPBOARD_STORAGE_KEY = 'notion_blocks_clipboard';

// Custom MIME type for structured block data
export const WIKI_BLOCKS_MIME_TYPE = 'application/x-wiki-blocks';

/**
 * Custom hook for managing clipboard operations in the Block Editor.
 * Supports copy/cut/paste of single and multiple blocks with partial content.
 */
export function useClipboard({ state, actions, editorRef, getSelectedContent }) {
    /**
     * Copies selected blocks to clipboard (full blocks).
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
            indentLevel: b.indentLevel ?? 0,
            isPartial: { start: false, end: false },
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

        // Create wiki-blocks JSON format
        const wikiBlocksData = JSON.stringify({ blocks: blocksData });

        try {
            // Use modern Clipboard API with all formats
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([plainText], { type: 'text/plain' }),
                'text/html': new Blob([html], { type: 'text/html' }),
            });
            await navigator.clipboard.write([clipboardItem]);

            // Store structured data in sessionStorage (custom format backup)
            sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, wikiBlocksData);

            if (cut) {
                blockIds.forEach(id => actions.deleteBlock(id));
                actions.clearSelection();
                actions.clearTextSelection();
            }
        } catch (err) {
            // Fallback for browsers without full Clipboard API support
            await navigator.clipboard.writeText(plainText);
            sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, wikiBlocksData);

            if (cut) {
                blockIds.forEach(id => actions.deleteBlock(id));
                actions.clearSelection();
                actions.clearTextSelection();
            }
        }
    }, [state.blocks, actions]);

    /**
     * Copies selected text across blocks to clipboard.
     * Extracts partial content from selection and stores with isPartial flags.
     * @param {boolean} cut - If true, deletes selected content after copying
     */
    const copySelectedTextToClipboard = useCallback(async (cut = false) => {
        // Use the cross-block selection hook's content extraction
        const selectedContent = getSelectedContent?.();
        if (!selectedContent || selectedContent.blocks.length === 0) {
            return false;
        }

        const { blocks, plainText, htmlText } = selectedContent;

        // Create wiki-blocks JSON format with partial info
        const wikiBlocksData = JSON.stringify({ blocks });

        try {
            // Use modern Clipboard API
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([plainText], { type: 'text/plain' }),
                'text/html': new Blob([htmlText], { type: 'text/html' }),
            });
            await navigator.clipboard.write([clipboardItem]);

            // Store structured data
            sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, wikiBlocksData);

            if (cut) {
                // Get deletion info and perform delete
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    sel.deleteFromDocument();
                    // Update block content after deletion
                    const blockEl = sel.anchorNode?.parentElement?.closest('[data-block-id]');
                    if (blockEl) {
                        const blockId = blockEl.getAttribute('data-block-id');
                        const contentEl = blockEl.querySelector('.block-content');
                        if (contentEl && blockId) {
                            actions.updateBlock(blockId, contentEl.innerHTML);
                        }
                    }
                }
                actions.clearTextSelection();
            }

            return true;
        } catch (err) {
            // Fallback
            await navigator.clipboard.writeText(plainText);
            sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, wikiBlocksData);
            return true;
        }
    }, [getSelectedContent, actions]);

    /**
     * Pastes content from clipboard.
     * If the pasted content is a URL and text is selected, wraps the text in a link.
     * @param {boolean} asPlainText - If true, pastes as plain text only
     */
    const pasteFromClipboard = useCallback(async (asPlainText = false) => {
        try {
            const clipboardText = await navigator.clipboard.readText();

            // Check if clipboard content is a URL
            const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
            const isUrl = urlPattern.test(clipboardText.trim());

            // Check if there's a text selection
            const sel = window.getSelection();
            const hasTextSelection = sel && !sel.isCollapsed && sel.toString().length > 0;

            // Smart URL paste: if pasting a URL on selected text, wrap it as a link
            // Only apply if selection contains non-whitespace text
            const selectedText = hasTextSelection ? sel.toString().trim() : '';
            if (isUrl && hasTextSelection && !asPlainText && selectedText) {
                const range = sel.getRangeAt(0);
                const url = clipboardText.trim().startsWith('http')
                    ? clipboardText.trim()
                    : 'https://' + clipboardText.trim();

                // Create a link element
                const linkHtml = `<a href="${DOMPurify.sanitize(url)}">${DOMPurify.sanitize(selectedText)}</a>`;

                // Delete the selected content and insert the link
                range.deleteContents();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = linkHtml;
                const linkNode = tempDiv.firstChild;
                range.insertNode(linkNode);

                // Move cursor after the link
                range.setStartAfter(linkNode);
                range.setEndAfter(linkNode);
                sel.removeAllRanges();
                sel.addRange(range);

                // Update the block content
                const blockEl = linkNode.closest('[data-block-id]');
                if (blockEl) {
                    const blockId = blockEl.getAttribute('data-block-id');
                    actions.updateBlock(blockId, blockEl.innerHTML);
                }
                return;
            }

            const storedBlocksJson = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
            let storedData = null;

            try {
                storedData = storedBlocksJson ? JSON.parse(storedBlocksJson) : null;
            } catch (e) {
                storedData = null;
            }

            // Normalize stored data structure
            const storedBlocks = storedData?.blocks || (Array.isArray(storedData) ? storedData : null);
            const focusedBlockId = state.focusedBlockId;

            // Get current cursor position for smart paste
            const getCursorOffset = () => {
                const sel = window.getSelection();
                if (!sel.rangeCount) return 0;

                const range = sel.getRangeAt(0);
                const focusedEl = editorRef.current?.querySelector(
                    `[data-block-id="${focusedBlockId}"] .block-content`
                );
                if (!focusedEl) return 0;

                const preRange = document.createRange();
                preRange.setStart(focusedEl, 0);
                preRange.setEnd(range.startContainer, range.startOffset);
                return preRange.toString().length;
            };

            // Validate that stored blocks match current clipboard
            // (protects against stale sessionStorage data from previous copies)
            const storedPlainText = storedBlocks?.map(b => {
                const div = document.createElement('div');
                div.innerHTML = b.content || '';
                return div.textContent || '';
            }).join('\n') || '';

            const isOurData = storedBlocks &&
                storedBlocks.length > 0 &&
                storedPlainText.trim() === clipboardText.trim();

            // If structured paste and we have VALID stored blocks
            if (!asPlainText && isOurData) {
                // Sanitize stored content before inserting
                const sanitizedBlocks = storedBlocks.map(block => ({
                    type: block.type || 'paragraph',
                    content: DOMPurify.sanitize(block.content || ''),
                    indentLevel: block.indentLevel ?? 0,
                    isPartial: block.isPartial || { start: false, end: false },
                }));

                const hasPartialBlocks = sanitizedBlocks.some(
                    b => b.isPartial?.start || b.isPartial?.end
                );

                if (focusedBlockId && hasPartialBlocks) {
                    // Smart paste: split and insert
                    const cursorOffset = getCursorOffset();
                    actions.splitAndInsertBlocks(focusedBlockId, cursorOffset, sanitizedBlocks);
                } else if (focusedBlockId) {
                    // Insert as new blocks after focused block
                    actions.insertBlocks(focusedBlockId, sanitizedBlocks);
                } else if (state.blocks.length > 0) {
                    // Insert after last block
                    actions.insertBlocks(state.blocks[state.blocks.length - 1].id, sanitizedBlocks);
                }
            } else {
                // External content or plain text paste
                const lines = clipboardText.split('\n');

                if (lines.length === 1 && focusedBlockId) {
                    // Single line: insert into current block at cursor
                    const element = editorRef.current?.querySelector(
                        `[data-block-id="${focusedBlockId}"] .block-content`
                    );
                    if (element) {
                        const sel = window.getSelection();
                        if (sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            // createTextNode escapes HTML entities, safe from XSS
                            range.insertNode(document.createTextNode(clipboardText));
                            range.collapse(false);

                            actions.updateBlock(focusedBlockId, element.innerHTML);
                        }
                    }
                } else if (lines.length > 1) {
                    // Multiple lines: create separate blocks for each
                    const nonEmptyLines = lines.filter(line => line.trim() !== '');
                    if (nonEmptyLines.length === 0) return;

                    const newBlocks = nonEmptyLines.map(line => ({
                        type: 'paragraph',
                        content: DOMPurify.sanitize(line),
                        indentLevel: 0,
                        isPartial: { start: false, end: false },
                    }));

                    if (focusedBlockId) {
                        actions.insertBlocks(focusedBlockId, newBlocks);
                    } else if (state.blocks.length > 0) {
                        actions.insertBlocks(state.blocks[state.blocks.length - 1].id, newBlocks);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    }, [state.focusedBlockId, state.blocks, actions, editorRef]);

    /**
     * Handles cut operation for cross-block selection.
     * Deletes selected content after copying.
     */
    const cutSelectedText = useCallback(async () => {
        return copySelectedTextToClipboard(true);
    }, [copySelectedTextToClipboard]);

    return {
        copyBlocksToClipboard,
        copySelectedTextToClipboard,
        cutSelectedText,
        pasteFromClipboard,
    };
}

export default useClipboard;
