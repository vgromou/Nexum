import { describe, it, expect } from 'vitest';
import {
    createTextNode,
    createLinkNode,
    createInlineCodeNode,
    createBlock,
    createEmptyParagraph,
    createMark,
    applyMark,
    removeMark,
    toggleMark,
    hasMark,
    getMark,
    splitTextNode,
    mergeAdjacentTextNodes,
    normalizeChildren,
    getPlainText,
    getTextLength,
    findNodeAtOffset,
    getNodeStartOffset,
    cloneBlock,
    isBlockEmpty,
    hasFormatting,
    getMarksAtOffset,
    rangeHasMark,
} from './ast.js';
import { MARK_TYPES, BLOCK_TYPES } from './ast-types.js';

describe('AST Utilities', () => {
    describe('Node Creation', () => {
        it('creates a text node without marks', () => {
            const node = createTextNode('Hello');
            expect(node).toEqual({ type: 'text', text: 'Hello' });
        });

        it('creates a text node with marks', () => {
            const node = createTextNode('Bold', [{ type: 'bold' }]);
            expect(node).toEqual({
                type: 'text',
                text: 'Bold',
                marks: [{ type: 'bold' }],
            });
        });

        it('creates a link node', () => {
            const node = createLinkNode('https://example.com', [createTextNode('Link')]);
            expect(node.type).toBe('link');
            expect(node.url).toBe('https://example.com');
            expect(node.children).toHaveLength(1);
        });

        it('creates an inline code node', () => {
            const node = createInlineCodeNode('const x = 1');
            expect(node).toEqual({ type: 'inline-code', text: 'const x = 1' });
        });

        it('creates a block with children', () => {
            const block = createBlock('paragraph', [createTextNode('Hello')], 'test-id');
            expect(block.type).toBe('paragraph');
            expect(block.id).toBe('test-id');
            expect(block.children).toHaveLength(1);
        });

        it('creates an empty paragraph', () => {
            const block = createEmptyParagraph('empty-id');
            expect(block.type).toBe('paragraph');
            expect(block.id).toBe('empty-id');
            expect(getPlainText(block.children)).toBe('');
        });
    });

    describe('Mark Operations', () => {
        it('applies a mark to a text node', () => {
            const node = createTextNode('Hello');
            const result = applyMark(node, { type: 'bold' });
            expect(result.marks).toEqual([{ type: 'bold' }]);
        });

        it('does not add duplicate marks', () => {
            const node = createTextNode('Hello', [{ type: 'bold' }]);
            const result = applyMark(node, { type: 'bold' });
            expect(result.marks).toHaveLength(1);
        });

        it('replaces color marks of the same type', () => {
            const node = createTextNode('Hello', [{ type: 'textColor', color: 'red' }]);
            const result = applyMark(node, { type: 'textColor', color: 'blue' });
            expect(result.marks).toHaveLength(1);
            expect(result.marks[0].color).toBe('blue');
        });

        it('removes a mark from a text node', () => {
            const node = createTextNode('Hello', [{ type: 'bold' }, { type: 'italic' }]);
            const result = removeMark(node, 'bold');
            expect(result.marks).toEqual([{ type: 'italic' }]);
        });

        it('toggles mark on', () => {
            const node = createTextNode('Hello');
            const result = toggleMark(node, { type: 'bold' });
            expect(hasMark(result, 'bold')).toBe(true);
        });

        it('toggles mark off', () => {
            const node = createTextNode('Hello', [{ type: 'bold' }]);
            const result = toggleMark(node, { type: 'bold' });
            expect(hasMark(result, 'bold')).toBe(false);
        });

        it('gets a specific mark', () => {
            const node = createTextNode('Hello', [{ type: 'textColor', color: 'red' }]);
            const mark = getMark(node, 'textColor');
            expect(mark).toEqual({ type: 'textColor', color: 'red' });
        });
    });

    describe('Text Node Splitting', () => {
        it('splits a text node at offset', () => {
            const node = createTextNode('Hello World', [{ type: 'bold' }]);
            const [before, after] = splitTextNode(node, 5);

            expect(before.text).toBe('Hello');
            expect(after.text).toBe(' World');
            expect(before.marks).toEqual([{ type: 'bold' }]);
            expect(after.marks).toEqual([{ type: 'bold' }]);
        });

        it('returns original node when offset is at start', () => {
            const node = createTextNode('Hello');
            const result = splitTextNode(node, 0);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(node);
        });

        it('returns original node when offset is at end', () => {
            const node = createTextNode('Hello');
            const result = splitTextNode(node, 5);
            expect(result).toHaveLength(1);
        });
    });

    describe('Merging Adjacent Nodes', () => {
        it('merges adjacent text nodes with same marks', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            const result = mergeAdjacentTextNodes(children);
            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Hello World');
        });

        it('does not merge nodes with different marks', () => {
            const children = [
                createTextNode('Hello ', [{ type: 'bold' }]),
                createTextNode('World'),
            ];
            const result = mergeAdjacentTextNodes(children);
            expect(result).toHaveLength(2);
        });

        it('handles empty children array', () => {
            const result = mergeAdjacentTextNodes([]);
            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('');
        });
    });

    describe('Text Extraction', () => {
        it('gets plain text from simple children', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            expect(getPlainText(children)).toBe('Hello World');
        });

        it('gets plain text from link nodes', () => {
            const children = [
                createTextNode('Click '),
                createLinkNode('https://example.com', [createTextNode('here')]),
                createTextNode('!'),
            ];
            expect(getPlainText(children)).toBe('Click here!');
        });

        it('gets plain text from inline code', () => {
            const children = [
                createTextNode('Use '),
                createInlineCodeNode('const x'),
                createTextNode(' in your code'),
            ];
            expect(getPlainText(children)).toBe('Use const x in your code');
        });

        it('gets text length', () => {
            const children = [createTextNode('Hello')];
            expect(getTextLength(children)).toBe(5);
        });
    });

    describe('Node Finding', () => {
        it('finds node at offset', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            const result = findNodeAtOffset(children, 8);
            expect(result.nodeIndex).toBe(1);
            expect(result.localOffset).toBe(2);
        });

        it('gets node start offset', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            expect(getNodeStartOffset(children, 0)).toBe(0);
            expect(getNodeStartOffset(children, 1)).toBe(6);
        });
    });

    describe('Block Operations', () => {
        it('clones a block', () => {
            const block = createBlock('paragraph', [createTextNode('Hello')], 'original-id');
            const cloned = cloneBlock(block);

            expect(cloned.id).toBe('original-id');
            expect(cloned.type).toBe('paragraph');
            expect(getPlainText(cloned.children)).toBe('Hello');
        });

        it('clones a block with new ID', () => {
            const block = createBlock('paragraph', [createTextNode('Hello')], 'original-id');
            const cloned = cloneBlock(block, true);

            expect(cloned.id).not.toBe('original-id');
        });

        it('detects empty block', () => {
            const emptyBlock = createEmptyParagraph();
            const nonEmptyBlock = createBlock('paragraph', [createTextNode('Hello')]);

            expect(isBlockEmpty(emptyBlock)).toBe(true);
            expect(isBlockEmpty(nonEmptyBlock)).toBe(false);
        });

        it('detects formatting', () => {
            const noFormatting = [createTextNode('Plain text')];
            const withBold = [createTextNode('Bold', [{ type: 'bold' }])];
            const withLink = [createLinkNode('url', [createTextNode('link')])];

            expect(hasFormatting(noFormatting)).toBe(false);
            expect(hasFormatting(withBold)).toBe(true);
            expect(hasFormatting(withLink)).toBe(true);
        });
    });

    describe('Selection Helpers', () => {
        it('gets marks at offset', () => {
            const children = [
                createTextNode('Plain '),
                createTextNode('Bold', [{ type: 'bold' }]),
            ];

            expect(getMarksAtOffset(children, 2)).toEqual([]);
            expect(getMarksAtOffset(children, 7)).toEqual([{ type: 'bold' }]);
        });

        it('checks if range has mark', () => {
            const children = [
                createTextNode('Plain '),
                createTextNode('Bold', [{ type: 'bold' }]),
            ];

            expect(rangeHasMark(children, 6, 10, 'bold')).toBe(true);
            expect(rangeHasMark(children, 0, 10, 'bold')).toBe(false);
        });
    });
});
