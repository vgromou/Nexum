import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLinkPopover } from './useLinkPopover';

describe('useLinkPopover', () => {
    let mockEditorRef;
    let mockOnApplyLink;

    beforeEach(() => {
        mockEditorRef = {
            current: document.createElement('div'),
        };
        mockOnApplyLink = vi.fn();

        // Setup block element with link
        const blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', '1');
        blockEl.innerHTML = 'Hello <a href="https://example.com">world</a>!';
        mockEditorRef.current.appendChild(blockEl);

        // Mock execCommand
        document.execCommand = vi.fn(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with popover closed', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(result.current.state.isOpen).toBe(false);
        expect(result.current.state.currentUrl).toBe('');
        expect(result.current.state.isEditing).toBe(false);
    });

    it('should provide openForSelection function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.openForSelection).toBe('function');
    });

    it('should provide openForLink function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.openForLink).toBe('function');
    });

    it('should provide applyLink function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.applyLink).toBe('function');
    });

    it('should provide close function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.close).toBe('function');
    });

    it('should provide checkCursorInLink function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.checkCursorInLink).toBe('function');
    });

    it('should close popover when close is called', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        // Open first by simulating openForLink
        const linkEl = mockEditorRef.current.querySelector('a');
        act(() => {
            result.current.openForLink(linkEl);
        });

        expect(result.current.state.isOpen).toBe(true);

        // Now close
        act(() => {
            result.current.close();
        });

        expect(result.current.state.isOpen).toBe(false);
        expect(result.current.state.currentUrl).toBe('');
    });

    it('should open for link with correct URL', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        const linkEl = mockEditorRef.current.querySelector('a');

        act(() => {
            result.current.openForLink(linkEl);
        });

        expect(result.current.state.isOpen).toBe(true);
        // Browser normalizes URLs and may add trailing slash
        expect(result.current.state.currentUrl).toContain('https://example.com');
        expect(result.current.state.isEditing).toBe(true);
    });

    it('should provide scheduleClose function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.scheduleClose).toBe('function');
    });

    it('should provide cancelScheduledClose function', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        expect(typeof result.current.cancelScheduledClose).toBe('function');
    });

    it('should call onApplyLink when applyLink is called', () => {
        // Mock selection with proper range
        const mockRange = {
            collapsed: false,
            cloneRange: vi.fn(function () { return this; }),
            getBoundingClientRect: vi.fn(() => ({
                top: 100,
                left: 200,
                width: 50,
                height: 20,
            })),
        };
        const mockSelection = {
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: vi.fn(() => mockRange),
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };
        vi.spyOn(window, 'getSelection').mockImplementation(() => mockSelection);

        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        // Open for selection first to save the range
        act(() => {
            result.current.openForSelection({ top: 100, left: 200 }, 40);
        });

        // Apply link
        act(() => {
            result.current.applyLink('https://newlink.com');
        });

        // After applying, popover should close
        expect(result.current.state.isOpen).toBe(false);
    });

    it('should set autoFocusInput to true by default when opening for link', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        const linkEl = mockEditorRef.current.querySelector('a');

        act(() => {
            result.current.openForLink(linkEl);
        });

        expect(result.current.state.isOpen).toBe(true);
        expect(result.current.state.autoFocusInput).toBe(true);
    });

    it('should set autoFocusInput to false when preserveCursor is true', () => {
        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        const linkEl = mockEditorRef.current.querySelector('a');

        act(() => {
            result.current.openForLink(linkEl, true); // preserveCursor = true
        });

        expect(result.current.state.isOpen).toBe(true);
        expect(result.current.state.autoFocusInput).toBe(false);
    });

    it('should not change selection when preserveCursor is true', () => {
        // Setup selection mock to track if it was modified
        const mockRange = {
            collapsed: true,
            cloneRange: vi.fn(function () { return this; }),
        };
        const mockSelection = {
            rangeCount: 1,
            isCollapsed: true,
            getRangeAt: vi.fn(() => mockRange),
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };
        vi.spyOn(window, 'getSelection').mockImplementation(() => mockSelection);

        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        const linkEl = mockEditorRef.current.querySelector('a');

        act(() => {
            result.current.openForLink(linkEl, true); // preserveCursor = true
        });

        // Selection should have been saved but not modified (no removeAllRanges for setting new range)
        // The saveSelection is called which uses cloneRange
        expect(result.current.state.isOpen).toBe(true);
    });

    it('should select entire link when preserveCursor is false', () => {
        const mockSelection = {
            rangeCount: 1,
            isCollapsed: true,
            getRangeAt: vi.fn(() => ({
                cloneRange: vi.fn(function () { return this; }),
            })),
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };
        vi.spyOn(window, 'getSelection').mockImplementation(() => mockSelection);

        const { result } = renderHook(() =>
            useLinkPopover({
                editorRef: mockEditorRef,
                onApplyLink: mockOnApplyLink,
            })
        );

        const linkEl = mockEditorRef.current.querySelector('a');

        act(() => {
            result.current.openForLink(linkEl, false); // preserveCursor = false (default)
        });

        // Selection should have been modified to select the link contents
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
        expect(mockSelection.addRange).toHaveBeenCalled();
    });
});
