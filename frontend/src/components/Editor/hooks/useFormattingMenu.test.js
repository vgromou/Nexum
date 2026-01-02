import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFormattingMenu } from './useFormattingMenu';

// Mock actions
const mockActions = {
    changeBlockType: vi.fn(),
};

// Mock state
const mockState = {
    blocks: [
        { id: '1', type: 'paragraph', content: 'Test content' },
    ],
};

describe('useFormattingMenu', () => {
    let mockEditorRef;
    let mockSelection;
    let mockRange;

    beforeEach(() => {
        // Setup mock editor ref
        mockEditorRef = {
            current: document.createElement('div'),
        };

        // Setup mock range
        mockRange = {
            collapsed: false,
            commonAncestorContainer: document.createTextNode('test'),
            getBoundingClientRect: vi.fn(() => ({
                top: 100,
                left: 200,
                width: 50,
            })),
            cloneRange: vi.fn(() => mockRange),
            toString: vi.fn(() => 'selected text'),
            surroundContents: vi.fn(),
            intersectsNode: vi.fn(() => true),
        };

        // Setup mock selection
        mockSelection = {
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: vi.fn(() => mockRange),
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };

        // Setup block element
        const blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', '1');
        blockEl.textContent = 'Test content';
        mockEditorRef.current.appendChild(blockEl);

        // Mock commonAncestorContainer to be within the block
        mockRange.commonAncestorContainer = blockEl.firstChild;

        // Mock window.getSelection
        vi.spyOn(window, 'getSelection').mockImplementation(() => mockSelection);

        // Mock document.execCommand (not available in jsdom)
        document.execCommand = vi.fn(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with menu closed', () => {
        const { result } = renderHook(() =>
            useFormattingMenu({
                editorRef: mockEditorRef,
                state: mockState,
                actions: mockActions,
            })
        );

        expect(result.current.menu.isOpen).toBe(false);
        expect(result.current.menu.activeSubmenu).toBe(null);
    });

    it('should provide openMenu function', () => {
        const { result } = renderHook(() =>
            useFormattingMenu({
                editorRef: mockEditorRef,
                state: mockState,
                actions: mockActions,
            })
        );

        expect(typeof result.current.openMenu).toBe('function');
    });

    it('should toggle submenu correctly', () => {
        const { result } = renderHook(() =>
            useFormattingMenu({
                editorRef: mockEditorRef,
                state: mockState,
                actions: mockActions,
            })
        );

        act(() => {
            result.current.toggleSubmenu('turnInto');
        });

        expect(result.current.menu.activeSubmenu).toBe('turnInto');

        act(() => {
            result.current.toggleSubmenu('turnInto');
        });

        expect(result.current.menu.activeSubmenu).toBe(null);
    });

    it('should provide format functions', () => {
        const { result } = renderHook(() =>
            useFormattingMenu({
                editorRef: mockEditorRef,
                state: mockState,
                actions: mockActions,
            })
        );

        expect(typeof result.current.applyFormat).toBe('function');
        expect(typeof result.current.applyHighlight).toBe('function');
        expect(typeof result.current.clearHighlight).toBe('function');
        expect(typeof result.current.insertLink).toBe('function');
        expect(typeof result.current.removeLink).toBe('function');
        expect(typeof result.current.changeBlockType).toBe('function');
    });

    it('should close menu when closeMenu is called', () => {
        const { result } = renderHook(() =>
            useFormattingMenu({
                editorRef: mockEditorRef,
                state: mockState,
                actions: mockActions,
            })
        );

        // First open the menu
        act(() => {
            result.current.openMenu();
        });

        // Then close it
        act(() => {
            result.current.closeMenu();
        });

        expect(result.current.menu.isOpen).toBe(false);
    });

    describe('applyFormat', () => {
        it('should provide applyFormat function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.applyFormat).toBe('function');
        });

        it('should not throw when called without open menu', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Should not throw even when menu is not open
            expect(() => {
                act(() => {
                    result.current.applyFormat('bold');
                });
            }).not.toThrow();
        });
    });

    describe('insertLink and removeLink', () => {
        it('should provide insertLink function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.insertLink).toBe('function');
        });

        it('should provide removeLink function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.removeLink).toBe('function');
        });
    });

    describe('changeBlockType', () => {
        it('should provide changeBlockType function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.changeBlockType).toBe('function');
        });

        it('should not throw when called without valid selection', () => {
            // Override selection to be collapsed
            mockSelection.isCollapsed = true;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Menu starts closed
            expect(result.current.menu.isOpen).toBe(false);

            // changeBlockType should not throw when menu is closed
            expect(() => {
                act(() => {
                    result.current.changeBlockType('h1');
                });
            }).not.toThrow();
        });
    });

    describe('applyHighlight', () => {
        it('should provide applyHighlight function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.applyHighlight).toBe('function');
        });
    });

    describe('clearHighlight', () => {
        it('should provide clearHighlight function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.clearHighlight).toBe('function');
        });
    });
});



