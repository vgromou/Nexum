import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for managing the LinkPopover state and actions.
 * Handles opening the popover for new links (from selection) or editing existing links.
 */
export function useLinkPopover({ editorRef, onApplyLink }) {
    const [state, setState] = useState({
        isOpen: false,
        position: { top: 0, left: 0 },
        currentUrl: '',
        isEditing: false, // true if editing an existing link
        autoFocusInput: true, // whether to auto-focus input when opened
    });

    const savedRangeRef = useRef(null);
    const activeLinkRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    /**
     * Saves the current selection range for later restoration.
     */
    const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
            return true;
        }
        return false;
    }, []);

    /**
     * Restores the saved selection range.
     */
    const restoreSelection = useCallback(() => {
        if (!savedRangeRef.current) return false;

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        return true;
    }, []);

    /**
     * Opens the popover for creating a new link from selected text.
     * Positions the popover ABOVE the FormattingMenu with an 8px gap.
     * 
     * Both FormattingMenu and LinkPopover use CSS transform: translate(-50%, -100%)
     * which means their BOTTOM edge is at the `top` CSS value.
     * 
     * FormattingMenu bottom is at: formattingMenuPosition.top
     * FormattingMenu top is at: formattingMenuPosition.top - formattingMenuHeight
     * 
     * For LinkPopover to be 8px above FormattingMenu:
     * LinkPopover bottom = FormattingMenu top - GAP
     * LinkPopover bottom = formattingMenuPosition.top - formattingMenuHeight - GAP
     * 
     * @param {Object} formattingMenuPosition - Position of the FormattingMenu { top, left }
     * @param {number} formattingMenuHeight - Height of the FormattingMenu in pixels
     */
    const openForSelection = useCallback((formattingMenuPosition, formattingMenuHeight = 42) => {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return;

        // Cancel any scheduled close first
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        // Save the current selection
        saveSelection();

        // Position above the FormattingMenu with 8px gap
        // Since both menus use transform: translate(-50%, -100%), their bottom edge is at `top`
        // We need LinkPopover's bottom to be above FormattingMenu's top edge
        const GAP = 8;
        setState({
            isOpen: true,
            position: {
                top: formattingMenuPosition.top - formattingMenuHeight - GAP,
                left: formattingMenuPosition.left
            },
            currentUrl: '',
            isEditing: false,
            autoFocusInput: true,
        });

        activeLinkRef.current = null;
    }, [saveSelection]);

    /**
     * Opens the popover for editing an existing link.
     * @param {HTMLAnchorElement} linkElement - The link element to edit
     * @param {boolean} preserveCursor - If true, keeps cursor position instead of selecting link
     */
    const openForLink = useCallback((linkElement, preserveCursor = false) => {
        if (!linkElement) return;

        // Cancel any scheduled close first
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        const rect = linkElement.getBoundingClientRect();
        const GAP = 8;

        // Position above the link (CSS transform will handle the rest)
        // -100% Y transform means we set top to link's top, then it moves up by its own height
        let top = rect.top - GAP;
        let left = rect.left + rect.width / 2;

        // Adjust if too close to top edge (fallback to below)
        if (top < 60) {
            top = rect.bottom + GAP + 44; // 44 is approx popover height
        }

        if (!preserveCursor) {
            // Save selection that includes the link (original behavior)
            const range = document.createRange();
            range.selectNodeContents(linkElement);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            savedRangeRef.current = range.cloneRange();
        } else {
            // Just save current selection without changing it
            saveSelection();
        }

        setState({
            isOpen: true,
            position: { top, left },
            currentUrl: linkElement.href || '',
            isEditing: true,
            autoFocusInput: !preserveCursor, // Don't auto-focus if preserving cursor
        });

        activeLinkRef.current = linkElement;
    }, [saveSelection]);

    /**
     * Applies a link to the saved selection.
     * @param {string} url - The URL to apply
     */
    const applyLink = useCallback((url) => {
        if (!url || !url.trim()) {
            close();
            return;
        }

        // If editing existing link, just update its href directly
        if (activeLinkRef.current) {
            activeLinkRef.current.href = url;
            close();
            return;
        }

        // For new links, delegate to the external handler (useFormattingMenu)
        // which has the correct saved selection
        if (onApplyLink) {
            onApplyLink(url);
        }

        close();
    }, [onApplyLink]);

    /**
     * Removes the link from the current link element (activeLinkRef).
     * Used when unlinking from LinkPopover when editing an existing link.
     */
    const unlinkCurrentLink = useCallback(() => {
        if (activeLinkRef.current) {
            // Select the entire link content
            const range = document.createRange();
            range.selectNodeContents(activeLinkRef.current);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            // Unlink
            document.execCommand('unlink', false, null);
        }
        close();
    }, []);

    /**
     * Closes the popover and cleans up.
     */
    const close = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOpen: false,
            currentUrl: '',
            isEditing: false,
        }));
        savedRangeRef.current = null;
        activeLinkRef.current = null;

        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    /**
     * Schedules a delayed close (for cursor-on-link feature).
     * @param {number} delay - Delay in milliseconds
     */
    const scheduleClose = useCallback((delay = 150) => {
        closeTimeoutRef.current = setTimeout(() => {
            close();
        }, delay);
    }, [close]);

    /**
     * Cancels a scheduled close.
     */
    const cancelScheduledClose = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    /**
     * Checks if cursor is inside a link and opens popover if so.
     * Used for the auto-appear-on-link-cursor feature.
     */
    const checkCursorInLink = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;

        // Only for collapsed selection (cursor, no text selected)
        if (!sel.isCollapsed) return null;

        const node = sel.anchorNode;
        if (!node) return null;

        // Find parent link element
        const linkEl = node.nodeType === Node.TEXT_NODE
            ? node.parentElement?.closest('a')
            : node.closest?.('a');

        if (linkEl && editorRef.current?.contains(linkEl)) {
            return linkEl;
        }

        return null;
    }, [editorRef]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return {
        state,
        openForSelection,
        openForLink,
        applyLink,
        unlinkCurrentLink,
        close,
        scheduleClose,
        cancelScheduledClose,
        checkCursorInLink,
        restoreSelection,
    };
}

export default useLinkPopover;
