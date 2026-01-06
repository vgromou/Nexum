import { toPascalCase } from './utils';

describe('toPascalCase', () => {
    it('converts kebab-case to PascalCase', () => {
        expect(toPascalCase('arrow-right')).toBe('ArrowRight');
    });

    it('handles single word strings', () => {
        expect(toPascalCase('home')).toBe('Home');
    });

    it('handles multiple hyphens', () => {
        expect(toPascalCase('arrow-big-up-dash')).toBe('ArrowBigUpDash');
    });

    it('returns empty string for empty input', () => {
        expect(toPascalCase('')).toBe('');
    });

    it('returns empty string for null input', () => {
        expect(toPascalCase(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
        expect(toPascalCase(undefined)).toBe('');
    });

    it('handles already capitalized words', () => {
        expect(toPascalCase('Arrow-Right')).toBe('ArrowRight');
    });

    it('handles numbers in string', () => {
        expect(toPascalCase('heading-1')).toBe('Heading1');
    });
});
