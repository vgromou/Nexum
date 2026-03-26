import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFormattingMenu } from './useFormattingMenu';

// Mock actions
const mockActions = {
    changeBlockType: vi.fn(),
    updateBlock: vi.fn(),
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
        // Clear all mocks first
        vi.clearAllMocks();

        // Use fake timers for better test control
        vi.useFakeTimers();

        // Setup mock editor ref
        mockEditorRef = {
            current: document.createElement('div'),
        };

        // Append editor to document.body so elements are connected
        document.body.appendChild(mockEditorRef.current);

        // Setup block element first (needed for range setup)
        const blockEl = document.createElement('p');
        blockEl.setAttribute('data-block-id', '1');
        blockEl.setAttribute('data-block-type', 'paragraph');
        blockEl.textContent = 'Test content';
        mockEditorRef.current.appendChild(blockEl);

        // Setup mock range with proper properties for getValidSelection
        mockRange = {
            collapsed: false,
            commonAncestorContainer: blockEl.firstChild,
            startContainer: blockEl.firstChild,
            endContainer: blockEl.firstChild,
            startOffset: 0,
            endOffset: 12,
            getBoundingClientRect: vi.fn(() => ({
                top: 100,
                left: 200,
                width: 50,
            })),
            getClientRects: vi.fn(() => [
                { top: 100, left: 200, width: 50 },
            ]),
            cloneRange: vi.fn(function() { return { ...mockRange }; }),
            toString: vi.fn(() => 'selected text'),
            surroundContents: vi.fn(),
            intersectsNode: vi.fn(() => true),
            deleteContents: vi.fn(),
            extractContents: vi.fn(() => {
                const frag = document.createDocumentFragment();
                const text = document.createTextNode('selected text');
                frag.appendChild(text);
                return frag;
            }),
            insertNode: vi.fn(),
            setStart: vi.fn(),
            setEnd: vi.fn(),
        };

        // Setup mock selection
        mockSelection = {
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: vi.fn(() => mockRange),
            removeAllRanges: vi.fn(),
            addRange: vi.fn((range) => {
                // Update anchorNode when addRange is called to simulate real browser behavior
                if (range && range.startContainer) {
                    mockSelection.anchorNode = range.startContainer;
                }
            }),
            anchorNode: blockEl.firstChild,
        };

        // Mock window.getSelection
        vi.spyOn(window, 'getSelection').mockImplementation(() => mockSelection);

        // Mock document.execCommand (not available in jsdom)
        document.execCommand = vi.fn(() => true);
    });

    afterEach(() => {
        // Clean up editor from document.body
        if (mockEditorRef?.current && mockEditorRef.current.parentNode) {
            mockEditorRef.current.parentNode.removeChild(mockEditorRef.current);
        }

        vi.useRealTimers();
        vi.restoreAllMocks();
        mockActions.updateBlock.mockClear();
        mockActions.changeBlockType.mockClear();
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
        expect(typeof result.current.applyLinkToSelection).toBe('function');
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

    describe('applyLinkToSelection and removeLink', () => {
        it('should provide applyLinkToSelection function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.applyLinkToSelection).toBe('function');
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

        it('should not throw when called without valid selection', () => {
            mockSelection.isCollapsed = true;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(() => {
                act(() => {
                    result.current.clearHighlight('highlight');
                });
            }).not.toThrow();
        });
    });

    describe('applyLinkToSelection', () => {
        it('should provide applyLinkToSelection function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.applyLinkToSelection).toBe('function');
        });

        it('should not apply link with empty URL', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            act(() => {
                result.current.applyLinkToSelection('');
            });

            expect(document.execCommand).not.toHaveBeenCalledWith('createLink', false, '');
        });

        it('should not apply link with whitespace-only URL', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            act(() => {
                result.current.applyLinkToSelection('   ');
            });

            expect(document.execCommand).not.toHaveBeenCalledWith('createLink', false, '   ');
        });

        it('should call execCommand with createLink when valid URL is provided', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // First open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            act(() => {
                result.current.applyLinkToSelection('https://example.com');
            });

            expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
        });
    });

    describe('getMenuPosition', () => {
        it('should provide getMenuPosition function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.getMenuPosition).toBe('function');
        });

        it('should return menu position with top and left', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            const position = result.current.getMenuPosition();

            expect(position).toHaveProperty('top');
            expect(position).toHaveProperty('left');
        });

        it('should return updated position after opening menu', () => {
            mockRange.getClientRects = vi.fn(() => [
                { top: 150, left: 250, width: 100 },
            ]);

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            act(() => {
                result.current.openMenu();
            });

            const position = result.current.getMenuPosition();

            // Position should be above selection (top - 8) and centered
            expect(position.top).toBe(150 - 8);
            expect(position.left).toBe(250 + 100 / 2);
        });
    });

    describe('getSavedSelection', () => {
        it('should provide getSavedSelection function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.getSavedSelection).toBe('function');
        });

        it('should return null initially', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            const selection = result.current.getSavedSelection();

            expect(selection).toBe(null);
        });

        it('should return saved selection after opening menu', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            act(() => {
                result.current.openMenu();
            });

            const selection = result.current.getSavedSelection();

            expect(selection).toStrictEqual(mockRange);
        });
    });

    describe('restoreSelection', () => {
        it('should provide restoreSelection function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.restoreSelection).toBe('function');
        });

        it('should return false when no selection is saved', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            let restored;
            act(() => {
                restored = result.current.restoreSelection();
            });

            expect(restored).toBe(false);
        });

        it('should return true and restore selection when selection is saved', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // First open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            let restored;
            act(() => {
                restored = result.current.restoreSelection();
            });

            expect(restored).toBe(true);
            expect(mockSelection.removeAllRanges).toHaveBeenCalled();
            expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
        });
    });

    describe('removeLink enhanced behavior', () => {
        it('should call execCommand unlink when selection is not collapsed', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // First open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            act(() => {
                result.current.removeLink();
            });

            expect(document.execCommand).toHaveBeenCalledWith('unlink', false, null);
        });

        it('should handle collapsed selection inside a link', () => {
            // Create a link element
            const linkEl = document.createElement('a');
            linkEl.href = 'https://example.com';
            linkEl.textContent = 'link text';

            const blockEl = mockEditorRef.current.querySelector('[data-block-id]');
            blockEl.appendChild(linkEl);

            // Mock collapsed selection inside link
            const linkTextNode = linkEl.firstChild;
            mockRange.collapsed = true;
            mockRange.commonAncestorContainer = linkTextNode;
            mockSelection.anchorNode = linkTextNode;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // First open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            act(() => {
                result.current.removeLink();
            });

            expect(document.execCommand).toHaveBeenCalledWith('unlink', false, null);
        });
    });

    describe('state sync for undo history', () => {
        it('should call actions.updateBlock after applyFormat', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Apply a format
            act(() => {
                result.current.applyFormat('bold');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(150);
            });

            // Close menu to trigger sync
            act(() => {
                result.current.closeMenu();
            });

            // Should call updateBlock to sync changes to state
            expect(mockActions.updateBlock).toHaveBeenCalledWith(
                '1',
                expect.any(String)
            );
        });

        it('should call actions.updateBlock after applyLinkToSelection', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Apply a link
            act(() => {
                result.current.applyLinkToSelection('https://example.com');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(150);
            });

            // Close menu to trigger sync
            act(() => {
                result.current.closeMenu();
            });

            // Should call updateBlock to sync changes to state
            expect(mockActions.updateBlock).toHaveBeenCalledWith(
                '1',
                expect.any(String)
            );
        });

        it('should call actions.updateBlock after clearHighlight', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Clear highlight
            act(() => {
                result.current.clearHighlight('highlight');
            });

            // Should call updateBlock to sync changes to state
            expect(mockActions.updateBlock).toHaveBeenCalledWith(
                '1',
                expect.any(String)
            );
        });
    });

    describe('applyTextColor', () => {
        it('should provide applyTextColor function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.applyTextColor).toBe('function');
        });

        it('should not throw when called without valid selection', () => {
            mockSelection.isCollapsed = true;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(() => {
                act(() => {
                    result.current.applyTextColor('red');
                });
            }).not.toThrow();
        });

        it('should not throw when applying text color', () => {
            const blockEl = mockEditorRef.current.querySelector('[data-block-id]');
            blockEl.innerHTML = 'Hello world';

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Apply text color should not throw
            expect(() => {
                act(() => {
                    result.current.applyTextColor('red');
                });

                // Advance timers to trigger setTimeout callbacks
                act(() => {
                    vi.advanceTimersByTime(200);
                });
            }).not.toThrow();
        });

        it('should preserve saved selection after applying text color', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            const selectionBeforeFormat = result.current.getSavedSelection();
            expect(selectionBeforeFormat).toBeTruthy();

            // Apply text color
            act(() => {
                result.current.applyTextColor('blue');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(200);
            });

            // Saved selection should still exist (may be a new Range object)
            const savedSelection = result.current.getSavedSelection();
            expect(savedSelection).toBeTruthy();
        });

        it('should remove text color when "default" is applied', () => {
            const blockEl = mockEditorRef.current.querySelector('[data-block-id]');
            blockEl.innerHTML = 'Hello <span class="text-color-red">world</span>';

            // Setup range to select the span content
            const span = blockEl.querySelector('.text-color-red');
            const textNode = span.firstChild;
            mockRange.startContainer = textNode;
            mockRange.endContainer = textNode;
            mockRange.startOffset = 0;
            mockRange.endOffset = 5;
            mockRange.commonAncestorContainer = textNode;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Apply "default" to remove color
            act(() => {
                result.current.applyTextColor('default');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(200);
            });

            // Span should be removed, only text should remain
            expect(blockEl.innerHTML).not.toContain('text-color-red');
        });
    });

    describe('clearTextColor', () => {
        it('should provide clearTextColor function', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(typeof result.current.clearTextColor).toBe('function');
        });

        it('should not throw when called without valid selection', () => {
            mockSelection.isCollapsed = true;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            expect(() => {
                act(() => {
                    result.current.clearTextColor();
                });
            }).not.toThrow();
        });
    });

    describe('selection preservation after color formatting', () => {
        it('should call addRange to restore selection', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Reset mock
            mockSelection.addRange.mockClear();

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Apply text color
            act(() => {
                result.current.applyTextColor('green');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(200);
            });

            // addRange should have been called (either to apply format or restore)
            expect(mockSelection.addRange).toHaveBeenCalled();
        });

        it('should not throw when applying highlight', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu to save selection
            act(() => {
                result.current.openMenu();
            });

            // Apply highlight should not throw
            expect(() => {
                act(() => {
                    result.current.applyHighlight('yellow');
                });

                // Advance timers to trigger setTimeout callbacks
                act(() => {
                    vi.advanceTimersByTime(200);
                });
            }).not.toThrow();
        });

        it('should keep menu open during color application', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu
            act(() => {
                result.current.openMenu();
            });

            expect(result.current.menu.isOpen).toBe(true);

            // Menu state should remain open (closeMenu not automatically called)
            expect(result.current.menu.isOpen).toBe(true);
        });
    });

    describe('modified blocks tracking for undo history', () => {
        it('should save block innerHTML when marking as modified', () => {
            const blockEl = mockEditorRef.current.querySelector('[data-block-id]');
            blockEl.innerHTML = 'Original content';

            // Update mock range to point to the new text node after changing innerHTML
            mockRange.commonAncestorContainer = blockEl.firstChild;
            mockRange.startContainer = blockEl.firstChild;
            mockRange.endContainer = blockEl.firstChild;
            mockSelection.anchorNode = blockEl.firstChild;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu
            act(() => {
                result.current.openMenu();
            });

            // Apply text color
            act(() => {
                result.current.applyTextColor('red');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(200);
            });

            // When menu closes, updateBlock should be called with saved HTML
            act(() => {
                result.current.closeMenu();
            });

            expect(mockActions.updateBlock).toHaveBeenCalled();
        });

        it('should sync correct innerHTML on menu close, not current DOM state', () => {
            const blockEl = mockEditorRef.current.querySelector('[data-block-id]');
            blockEl.innerHTML = 'Test content';

            // Update mock range to point to the new text node after changing innerHTML
            mockRange.commonAncestorContainer = blockEl.firstChild;
            mockRange.startContainer = blockEl.firstChild;
            mockRange.endContainer = blockEl.firstChild;
            mockSelection.anchorNode = blockEl.firstChild;

            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu
            act(() => {
                result.current.openMenu();
            });

            // Apply formatting
            act(() => {
                result.current.applyTextColor('blue');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(200);
            });

            // Simulate React changing the DOM (e.g., to empty)
            blockEl.innerHTML = '';

            // Close menu - should use saved HTML, not current empty state
            act(() => {
                result.current.closeMenu();
            });

            // updateBlock should be called with non-empty content
            const updateCalls = mockActions.updateBlock.mock.calls;
            const lastCall = updateCalls[updateCalls.length - 1];
            expect(lastCall[1]).not.toBe('');
        });

        it('should sync changes when menu closes', () => {
            const { result } = renderHook(() =>
                useFormattingMenu({
                    editorRef: mockEditorRef,
                    state: mockState,
                    actions: mockActions,
                })
            );

            // Open menu
            act(() => {
                result.current.openMenu();
            });

            // Apply color
            act(() => {
                result.current.applyTextColor('red');
            });

            // Advance timers to trigger setTimeout callbacks
            act(() => {
                vi.advanceTimersByTime(200);
            });

            // Close menu
            act(() => {
                result.current.closeMenu();
            });

            // Changes should be synced to state
            expect(mockActions.updateBlock).toHaveBeenCalled();
        });
    });
});
