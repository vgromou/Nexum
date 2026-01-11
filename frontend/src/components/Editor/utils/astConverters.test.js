import { describe, it, expect, beforeEach } from 'vitest';
import {
    htmlToAST,
    astToHTML,
} from './astConverters.js';
import { createTextNode, createLinkNode, getPlainText } from './ast.js';

describe('AST Converters', () => {
    describe('htmlToAST', () => {
        it('converts plain text', () => {
            const result = htmlToAST('Hello World');
            expect(getPlainText(result)).toBe('Hello World');
            expect(result[0].type).toBe('text');
        });

        it('converts bold text', () => {
            const result = htmlToAST('<strong>Bold</strong> text');
            expect(getPlainText(result)).toBe('Bold text');
            expect(result[0].marks).toContainEqual({ type: 'bold' });
        });

        it('converts italic text', () => {
            const result = htmlToAST('<em>Italic</em>');
            expect(result[0].marks).toContainEqual({ type: 'italic' });
        });

        it('converts underline text', () => {
            const result = htmlToAST('<u>Underlined</u>');
            expect(result[0].marks).toContainEqual({ type: 'underline' });
        });

        it('converts strikethrough text', () => {
            const result = htmlToAST('<s>Strikethrough</s>');
            expect(result[0].marks).toContainEqual({ type: 'strikethrough' });
        });

        it('converts inline code', () => {
            const result = htmlToAST('<code>const x = 1</code>');
            expect(result[0].type).toBe('inline-code');
            expect(result[0].text).toBe('const x = 1');
        });

        it('converts links', () => {
            const result = htmlToAST('<a href="https://example.com">Link</a>');
            expect(result[0].type).toBe('link');
            expect(result[0].url).toBe('https://example.com');
            expect(getPlainText(result[0].children)).toBe('Link');
        });

        it('converts highlight spans', () => {
            const result = htmlToAST('<span class="highlight-yellow">Highlighted</span>');
            expect(result[0].marks).toContainEqual({
                type: 'backgroundColor',
                color: 'yellow',
            });
        });

        it('converts text color spans', () => {
            const result = htmlToAST('<span class="text-color-red">Red text</span>');
            expect(result[0].marks).toContainEqual({
                type: 'textColor',
                color: 'red',
            });
        });

        it('handles nested formatting', () => {
            const result = htmlToAST('<strong><em>Bold italic</em></strong>');
            const marks = result[0].marks;
            expect(marks).toContainEqual({ type: 'bold' });
            expect(marks).toContainEqual({ type: 'italic' });
        });

        it('handles empty string', () => {
            const result = htmlToAST('');
            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('');
        });

        it('handles null/undefined', () => {
            expect(htmlToAST(null)).toHaveLength(1);
            expect(htmlToAST(undefined)).toHaveLength(1);
        });
    });

    describe('astToHTML', () => {
        it('converts text node to HTML', () => {
            const children = [createTextNode('Hello World')];
            expect(astToHTML(children)).toBe('Hello World');
        });

        it('converts bold text to HTML', () => {
            const children = [createTextNode('Bold', [{ type: 'bold' }])];
            expect(astToHTML(children)).toBe('<strong>Bold</strong>');
        });

        it('converts italic text to HTML', () => {
            const children = [createTextNode('Italic', [{ type: 'italic' }])];
            expect(astToHTML(children)).toBe('<em>Italic</em>');
        });

        it('converts multiple marks to HTML', () => {
            const children = [createTextNode('BoldItalic', [
                { type: 'bold' },
                { type: 'italic' },
            ])];
            const html = astToHTML(children);
            expect(html).toContain('<strong>');
            expect(html).toContain('<em>');
        });

        it('converts link to HTML', () => {
            const children = [
                createLinkNode('https://example.com', [createTextNode('Link')]),
            ];
            const html = astToHTML(children);
            expect(html).toContain('href="https://example.com"');
            expect(html).toContain('>Link</a>');
        });

        it('converts text color to HTML', () => {
            const children = [createTextNode('Red', [{ type: 'textColor', color: 'red' }])];
            expect(astToHTML(children)).toContain('class="text-color-red"');
        });

        it('converts background color to HTML', () => {
            const children = [createTextNode('Yellow', [{ type: 'backgroundColor', color: 'yellow' }])];
            expect(astToHTML(children)).toContain('class="highlight-yellow"');
        });

        it('escapes HTML special characters', () => {
            const children = [createTextNode('<script>alert("xss")</script>')];
            const html = astToHTML(children);
            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
        });

        it('handles empty children array', () => {
            expect(astToHTML([])).toBe('');
        });
    });

    describe('Roundtrip Conversion', () => {
        it('preserves content through HTML -> AST -> HTML', () => {
            const originalHTML = '<strong>Bold</strong> and <em>italic</em> text';
            const ast = htmlToAST(originalHTML);
            const resultHTML = astToHTML(ast);

            // Parse again to compare structure
            const reAST = htmlToAST(resultHTML);
            expect(getPlainText(reAST)).toBe(getPlainText(ast));
        });

        it('preserves links through roundtrip', () => {
            const originalHTML = 'Click <a href="https://example.com">here</a>!';
            const ast = htmlToAST(originalHTML);
            const resultHTML = astToHTML(ast);

            expect(resultHTML).toContain('href="https://example.com"');
            expect(getPlainText(htmlToAST(resultHTML))).toBe('Click here!');
        });
    });
});
