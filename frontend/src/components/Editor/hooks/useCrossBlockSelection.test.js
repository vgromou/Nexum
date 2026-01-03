import { renderHook, act } from '@testing-library/react';
import { useCrossBlockSelection } from './useCrossBlockSelection';

describe('useCrossBlockSelection', () => {
    let mockState;
    let mockActions;
    let mockEditorRef;

    beforeEach(() => {
        mockState = {
            blocks: [
                { id: 'block-1', type: 'paragraph', content: 'First block content', indentLevel: 0 },
                { id: 'block-2', type: 'bulleted-list', content: 'List item', indentLevel: 1 },
                { id: 'block-3', type: 'paragraph', content: 'Third block content', indentLevel: 0 },
            ],
            focusedBlockId: 'block-1',
            textSelectionBlockIds: [],
        };

        mockActions = {
            setTextSelectionBlocks: vi.fn(),
            clearTextSelection: vi.fn(),
        };

        // Mock editorRef with querySelector
        mockEditorRef = {
            current: {
                querySelector: vi.fn().mockReturnValue(null),
                querySelectorAll: vi.fn().mockReturnValue([]),
            },
        };

        // Mock window.getSelection
        vi.spyOn(window, 'getSelection').mockReturnValue({
            rangeCount: 0,
            isCollapsed: true,
            getRangeAt: vi.fn(),
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderSelectionHook = (overrides = {}) => {
        return renderHook(() =>
            useCrossBlockSelection({
                editorRef: overrides.editorRef || mockEditorRef,
                state: { ...mockState, ...overrides.state },
                actions: overrides.actions || mockActions,
            })
        );
    };

    it('initializes with null crossSelection', () => {
        const { result } = renderSelectionHook();
        expect(result.current.crossSelection).toBeNull();
    });

    it('provides getSelectedContent function', () => {
        const { result } = renderSelectionHook();
        expect(typeof result.current.getSelectedContent).toBe('function');
    });

    it('provides handleKeyboardSelection function', () => {
        const { result } = renderSelectionHook();
        expect(typeof result.current.handleKeyboardSelection).toBe('function');
    });

    it('provides getSelectionForDeletion function', () => {
        const { result } = renderSelectionHook();
        expect(typeof result.current.getSelectionForDeletion).toBe('function');
    });

    it('returns null from getSelectedContent when no selection', () => {
        const { result } = renderSelectionHook();
        const content = result.current.getSelectedContent();
        expect(content).toBeNull();
    });

    it('returns null from getSelectionForDeletion when no selection', () => {
        const { result } = renderSelectionHook();
        const deletion = result.current.getSelectionForDeletion();
        expect(deletion).toBeNull();
    });

    it('handleKeyboardSelection returns false when shift is not pressed', () => {
        const { result } = renderSelectionHook();
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: false });
        const handled = result.current.handleKeyboardSelection(event);
        expect(handled).toBe(false);
    });

    it('handleKeyboardSelection returns false for non-selection keys', () => {
        const { result } = renderSelectionHook();
        const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
        const handled = result.current.handleKeyboardSelection(event);
        expect(handled).toBe(false);
    });
});
