import { describe, it, expect } from 'vitest';
import { isValidUrl, normalizeUrl } from './urlUtils';

describe('urlUtils', () => {
    describe('isValidUrl', () => {
        it('returns true for valid http URL', () => {
            expect(isValidUrl('http://example.com')).toBe(true);
        });

        it('returns true for valid https URL', () => {
            expect(isValidUrl('https://example.com')).toBe(true);
        });

        it('returns true for URL with path', () => {
            expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
        });

        it('returns true for URL with query params', () => {
            expect(isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true);
        });

        it('returns true for URL with port', () => {
            expect(isValidUrl('https://example.com:8080')).toBe(true);
        });

        it('returns true for domain pattern without protocol', () => {
            expect(isValidUrl('example.com')).toBe(true);
        });

        it('returns true for subdomain pattern without protocol', () => {
            expect(isValidUrl('www.example.com')).toBe(true);
        });

        it('returns true for multi-level domain without protocol', () => {
            expect(isValidUrl('sub.domain.example.com')).toBe(true);
        });

        it('returns false for empty string', () => {
            expect(isValidUrl('')).toBe(false);
        });

        it('returns false for null', () => {
            expect(isValidUrl(null)).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(isValidUrl(undefined)).toBe(false);
        });

        it('returns false for whitespace only', () => {
            expect(isValidUrl('   ')).toBe(false);
        });

        it('returns false for plain text without domain pattern', () => {
            expect(isValidUrl('just some text')).toBe(false);
        });

        it('returns false for single word', () => {
            expect(isValidUrl('example')).toBe(false);
        });

        it('returns false for ftp protocol', () => {
            expect(isValidUrl('ftp://example.com')).toBe(false);
        });

        it('returns false for file protocol', () => {
            expect(isValidUrl('file:///path/to/file')).toBe(false);
        });

        it('handles URL with trailing spaces', () => {
            expect(isValidUrl('  example.com  ')).toBe(true);
        });
    });

    describe('normalizeUrl', () => {
        it('returns URL unchanged if it starts with https://', () => {
            expect(normalizeUrl('https://example.com')).toBe('https://example.com');
        });

        it('returns URL unchanged if it starts with http://', () => {
            expect(normalizeUrl('http://example.com')).toBe('http://example.com');
        });

        it('adds https:// to domain without protocol', () => {
            expect(normalizeUrl('example.com')).toBe('https://example.com');
        });

        it('adds https:// to www domain without protocol', () => {
            expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
        });

        it('trims whitespace and adds https://', () => {
            expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
        });

        it('trims whitespace from URL with protocol', () => {
            expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
        });

        it('returns empty string for null', () => {
            expect(normalizeUrl(null)).toBe('');
        });

        it('returns empty string for undefined', () => {
            expect(normalizeUrl(undefined)).toBe('');
        });

        it('returns empty string for whitespace only', () => {
            expect(normalizeUrl('   ')).toBe('');
        });

        it('returns empty string for empty string', () => {
            expect(normalizeUrl('')).toBe('');
        });

        it('preserves path in URL', () => {
            expect(normalizeUrl('example.com/path/to/page')).toBe('https://example.com/path/to/page');
        });

        it('preserves query params in URL', () => {
            expect(normalizeUrl('example.com?foo=bar')).toBe('https://example.com?foo=bar');
        });
    });
});
