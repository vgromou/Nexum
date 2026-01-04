import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCursorState, findPositionInBlock, restoreCursor } from './cursor';

describe('cursor utilities', () => {
    let mockEditorRef;
    let blockEl;
    let mockSelection;
    let mockRange;

    beforeEach(() => {
        // Setup mock editor ref with a block element
        mockEditorRef = {
            current: document.createElement('div'),
        };

        blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', 'block-1');
        blockEl.textContent = 'Hello World';
        mockEditorRef.current.appendChild(blockEl);

        // Setup mock range
        mockRange = document.createRange();
        mockRange.setStart(blockEl.firstChild, 3); // cursor after "Hel"
        mockRange.setEnd(blockEl.firstChild, 3);

        // Setup mock selection
        mockSelection = {
            rangeCount: 1,
            getRangeAt: vi.fn(() => mockRange),
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };

        vi.spyOn(window, 'getSelection').mockImplementation(() => mockSelection);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getCursorState', () => {
        it('returns null when there is no selection', () => {
            mockSelection.rangeCount = 0;
            const result = getCursorState(mockEditorRef);
            expect(result).toBeNull();
        });

        it('returns null when selection is outside editor blocks', () => {
            // Create a range outside any block
            const outsideEl = document.createElement('div');
            outsideEl.textContent = 'Outside';
            mockRange.setStart(outsideEl.firstChild, 0);
            mockRange.setEnd(outsideEl.firstChild, 0);

            const result = getCursorState(mockEditorRef);
            expect(result).toBeNull();
        });

        it('returns cursor state with blockId and offset', () => {
            const result = getCursorState(mockEditorRef);

            expect(result).not.toBeNull();
            expect(result.blockId).toBe('block-1');
            expect(result.offset).toBe(3);
            expect(result.selectionLength).toBe(0);
        });

        it('calculates selectionLength for non-collapsed selection', () => {
            mockRange.setEnd(blockEl.firstChild, 8); // "Hello Wo" selected

            const result = getCursorState(mockEditorRef);

            expect(result.offset).toBe(3);
            expect(result.selectionLength).toBe(5); // "lo Wo"
        });

        it('handles nested elements correctly', () => {
            // Create a block with nested formatting
            blockEl.innerHTML = 'Hello <strong>World</strong>!';
            const textNode = blockEl.childNodes[0]; // "Hello "
            mockRange.setStart(textNode, 3);
            mockRange.setEnd(textNode, 3);

            const result = getCursorState(mockEditorRef);

            expect(result.blockId).toBe('block-1');
            expect(result.offset).toBe(3);
        });

        it('handles cursor inside nested element', () => {
            blockEl.innerHTML = 'Hello <strong>World</strong>!';
            const strongEl = blockEl.querySelector('strong');
            const strongTextNode = strongEl.firstChild;
            mockRange.setStart(strongTextNode, 2);
            mockRange.setEnd(strongTextNode, 2);

            const result = getCursorState(mockEditorRef);

            expect(result.blockId).toBe('block-1');
            // Offset should be: "Hello " (6) + "Wo" (2) = 8
            expect(result.offset).toBe(8);
        });
    });

    describe('findPositionInBlock', () => {
        it('finds position at the start of block', () => {
            const result = findPositionInBlock(blockEl, 0);

            expect(result.node).toBe(blockEl.firstChild);
            expect(result.offset).toBe(0);
        });

        it('finds position in the middle of text', () => {
            const result = findPositionInBlock(blockEl, 5);

            expect(result.node).toBe(blockEl.firstChild);
            expect(result.offset).toBe(5);
        });

        it('finds position at the end of text', () => {
            const result = findPositionInBlock(blockEl, 11); // "Hello World".length

            expect(result.node).toBe(blockEl.firstChild);
            expect(result.offset).toBe(11);
        });

        it('clamps position to end when offset exceeds content', () => {
            const result = findPositionInBlock(blockEl, 100);

            expect(result.node).toBe(blockEl.firstChild);
            expect(result.offset).toBe(11);
        });

        it('handles nested elements', () => {
            blockEl.innerHTML = 'Hello <strong>World</strong>!';

            // Find position inside "World" (offset 8 = "Hello " + "Wo")
            const result = findPositionInBlock(blockEl, 8);

            const strongEl = blockEl.querySelector('strong');
            expect(result.node).toBe(strongEl.firstChild);
            expect(result.offset).toBe(2);
        });

        it('finds position in second text node', () => {
            blockEl.innerHTML = 'Hello <strong>World</strong>!';

            // Find position at "!" (offset 12 = "Hello " + "World" + "!")
            const result = findPositionInBlock(blockEl, 12);

            // Should be in the last text node after </strong>
            expect(result.offset).toBe(1); // Position 1 in "!" text node
        });
    });

    describe('restoreCursor', () => {
        it('does nothing when cursorState is null', () => {
            restoreCursor(mockEditorRef, null);
            expect(mockSelection.removeAllRanges).not.toHaveBeenCalled();
        });

        it('does nothing when editorRef.current is null', () => {
            restoreCursor({ current: null }, { blockId: 'block-1', offset: 0, selectionLength: 0 });
            expect(mockSelection.removeAllRanges).not.toHaveBeenCalled();
        });

        it('restores cursor to specified position', () => {
            const cursorState = {
                blockId: 'block-1',
                offset: 5,
                selectionLength: 0,
            };

            restoreCursor(mockEditorRef, cursorState);

            expect(mockSelection.removeAllRanges).toHaveBeenCalled();
            expect(mockSelection.addRange).toHaveBeenCalled();
        });

        it('restores selection with length', () => {
            const cursorState = {
                blockId: 'block-1',
                offset: 3,
                selectionLength: 5,
            };

            restoreCursor(mockEditorRef, cursorState);

            expect(mockSelection.removeAllRanges).toHaveBeenCalled();
            expect(mockSelection.addRange).toHaveBeenCalled();
        });

        it('falls back to first block when target block not found', () => {
            const cursorState = {
                blockId: 'non-existent-block',
                offset: 0,
                selectionLength: 0,
            };

            restoreCursor(mockEditorRef, cursorState);

            expect(mockSelection.removeAllRanges).toHaveBeenCalled();
            expect(mockSelection.addRange).toHaveBeenCalled();
        });

        it('handles missing blocks gracefully', () => {
            mockEditorRef.current.innerHTML = ''; // No blocks

            const cursorState = {
                blockId: 'block-1',
                offset: 0,
                selectionLength: 0,
            };

            // Should not throw
            expect(() => {
                restoreCursor(mockEditorRef, cursorState);
            }).not.toThrow();
        });
    });
});
