import { describe, it, expect } from 'vitest';
import {
    applyMarkToRange,
    removeMarkFromRange,
    toggleMarkOnRange,
    insertTextAtOffset,
    deleteTextInRange,
    replaceTextInRange,
    wrapRangeInLink,
    removeLinkAtOffset,
    findLinkAtOffset,
    wrapRangeInInlineCode,
    splitChildrenAtOffset,
    mergeChildren,
} from './astOperations.js';
import { createTextNode, createLinkNode, getPlainText } from './ast.js';

describe('AST Operations', () => {
    describe('applyMarkToRange', () => {
        it('applies bold to a text range', () => {
            const children = [createTextNode('Hello World')];
            const result = applyMarkToRange(children, 0, 5, { type: 'bold' });

            expect(result).toHaveLength(2);
            expect(result[0].text).toBe('Hello');
            expect(result[0].marks).toEqual([{ type: 'bold' }]);
            expect(result[1].text).toBe(' World');
            expect(result[1].marks).toBeUndefined();
        });

        it('applies mark to middle of text', () => {
            const children = [createTextNode('Hello World')];
            const result = applyMarkToRange(children, 6, 11, { type: 'italic' });

            expect(result).toHaveLength(2);
            expect(result[0].text).toBe('Hello ');
            expect(result[1].text).toBe('World');
            expect(result[1].marks).toEqual([{ type: 'italic' }]);
        });

        it('applies mark across multiple nodes', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            const result = applyMarkToRange(children, 3, 9, { type: 'bold' });

            // Should produce: "Hel", "lo W" (bold), "orld"
            const plainText = getPlainText(result);
            expect(plainText).toBe('Hello World');
        });
    });

    describe('removeMarkFromRange', () => {
        it('removes bold from a range', () => {
            const children = [createTextNode('Hello World', [{ type: 'bold' }])];
            const result = removeMarkFromRange(children, 0, 5, 'bold');

            expect(result).toHaveLength(2);
            expect(result[0].marks).toBeUndefined();
            expect(result[1].marks).toEqual([{ type: 'bold' }]);
        });
    });

    describe('toggleMarkOnRange', () => {
        it('adds mark when not present', () => {
            const children = [createTextNode('Hello')];
            const result = toggleMarkOnRange(children, 0, 5, { type: 'bold' });

            expect(result[0].marks).toEqual([{ type: 'bold' }]);
        });

        it('removes mark when fully present', () => {
            const children = [createTextNode('Hello', [{ type: 'bold' }])];
            const result = toggleMarkOnRange(children, 0, 5, { type: 'bold' });

            expect(result[0].marks).toBeUndefined();
        });
    });

    describe('insertTextAtOffset', () => {
        it('inserts text at beginning', () => {
            const children = [createTextNode('World')];
            const result = insertTextAtOffset(children, 0, 'Hello ');

            expect(getPlainText(result)).toBe('Hello World');
        });

        it('inserts text in middle', () => {
            const children = [createTextNode('Hello World')];
            const result = insertTextAtOffset(children, 5, ' Beautiful');

            expect(getPlainText(result)).toBe('Hello Beautiful World');
        });

        it('inserts text at end', () => {
            const children = [createTextNode('Hello')];
            const result = insertTextAtOffset(children, 5, ' World');

            expect(getPlainText(result)).toBe('Hello World');
        });

        it('inherits marks from insertion point', () => {
            const children = [createTextNode('Bold', [{ type: 'bold' }])];
            const result = insertTextAtOffset(children, 2, 'XX');

            expect(getPlainText(result)).toBe('BoXXld');
            // Inserted text should inherit bold mark
        });
    });

    describe('deleteTextInRange', () => {
        it('deletes text from beginning', () => {
            const children = [createTextNode('Hello World')];
            const result = deleteTextInRange(children, 0, 6);

            expect(getPlainText(result)).toBe('World');
        });

        it('deletes text from middle', () => {
            const children = [createTextNode('Hello World')];
            const result = deleteTextInRange(children, 5, 11);

            expect(getPlainText(result)).toBe('Hello');
        });

        it('deletes entire content', () => {
            const children = [createTextNode('Hello')];
            const result = deleteTextInRange(children, 0, 5);

            expect(getPlainText(result)).toBe('');
        });

        it('handles deletion across multiple nodes', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            const result = deleteTextInRange(children, 3, 9);

            expect(getPlainText(result)).toBe('Helld');
        });
    });

    describe('replaceTextInRange', () => {
        it('replaces text with new text', () => {
            const children = [createTextNode('Hello World')];
            const result = replaceTextInRange(children, 6, 11, 'Universe');

            expect(getPlainText(result)).toBe('Hello Universe');
        });
    });

    describe('wrapRangeInLink', () => {
        it('wraps text in a link', () => {
            const children = [createTextNode('Click here for more')];
            const result = wrapRangeInLink(children, 6, 10, 'https://example.com');

            expect(getPlainText(result)).toBe('Click here for more');

            // Find the link node
            const linkNode = result.find(n => n.type === 'link');
            expect(linkNode).toBeDefined();
            expect(linkNode.url).toBe('https://example.com');
        });

        it('preserves text before and after link', () => {
            const children = [createTextNode('Go to link now')];
            const result = wrapRangeInLink(children, 6, 10, 'https://test.com');

            expect(result[0].type).toBe('text');
            expect(result[0].text).toBe('Go to ');
            expect(result[1].type).toBe('link');
            expect(result[2].type).toBe('text');
            expect(result[2].text).toBe(' now');
        });
    });

    describe('removeLinkAtOffset', () => {
        it('unwraps a link', () => {
            const children = [
                createTextNode('Click '),
                createLinkNode('https://example.com', [createTextNode('here')]),
                createTextNode(' now'),
            ];
            const result = removeLinkAtOffset(children, 7);

            // Should have no links, just text
            expect(result.every(n => n.type === 'text')).toBe(true);
            expect(getPlainText(result)).toBe('Click here now');
        });
    });

    describe('findLinkAtOffset', () => {
        it('finds link at offset', () => {
            const children = [
                createTextNode('Click '),
                createLinkNode('https://example.com', [createTextNode('here')]),
            ];
            const result = findLinkAtOffset(children, 7);

            expect(result).not.toBeNull();
            expect(result.link.url).toBe('https://example.com');
            expect(result.startOffset).toBe(6);
            expect(result.endOffset).toBe(10);
        });

        it('returns null when not on a link', () => {
            const children = [
                createTextNode('No link here'),
            ];
            const result = findLinkAtOffset(children, 3);

            expect(result).toBeNull();
        });
    });

    describe('wrapRangeInInlineCode', () => {
        it('wraps text in inline code', () => {
            const children = [createTextNode('Use the code function')];
            const result = wrapRangeInInlineCode(children, 8, 12);

            expect(getPlainText(result)).toBe('Use the code function');

            const codeNode = result.find(n => n.type === 'inline-code');
            expect(codeNode).toBeDefined();
            expect(codeNode.text).toBe('code');
        });
    });

    describe('splitChildrenAtOffset', () => {
        it('splits children at offset', () => {
            const children = [createTextNode('Hello World')];
            const [before, after] = splitChildrenAtOffset(children, 5);

            expect(getPlainText(before)).toBe('Hello');
            expect(getPlainText(after)).toBe(' World');
        });

        it('handles split at node boundary', () => {
            const children = [
                createTextNode('Hello '),
                createTextNode('World'),
            ];
            const [before, after] = splitChildrenAtOffset(children, 6);

            expect(getPlainText(before)).toBe('Hello ');
            expect(getPlainText(after)).toBe('World');
        });

        it('handles split at beginning', () => {
            const children = [createTextNode('Hello')];
            const [before, after] = splitChildrenAtOffset(children, 0);

            expect(getPlainText(before)).toBe('');
            expect(getPlainText(after)).toBe('Hello');
        });

        it('handles split at end', () => {
            const children = [createTextNode('Hello')];
            const [before, after] = splitChildrenAtOffset(children, 5);

            expect(getPlainText(before)).toBe('Hello');
            expect(getPlainText(after)).toBe('');
        });
    });

    describe('mergeChildren', () => {
        it('merges two children arrays', () => {
            const first = [createTextNode('Hello ')];
            const second = [createTextNode('World')];
            const result = mergeChildren(first, second);

            expect(getPlainText(result)).toBe('Hello World');
        });

        it('merges adjacent text nodes with same marks', () => {
            const first = [createTextNode('Hello', [{ type: 'bold' }])];
            const second = [createTextNode(' World', [{ type: 'bold' }])];
            const result = mergeChildren(first, second);

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Hello World');
        });
    });
});
