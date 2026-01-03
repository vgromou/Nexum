import { renderHook, act } from '@testing-library/react';
import useBlockReducer from './useBlockReducer';

describe('useBlockReducer', () => {
    it('initializes with default state', () => {
        const { result } = renderHook(() => useBlockReducer());
        expect(result.current.state.blocks).toHaveLength(1);
        expect(result.current.state.blocks[0].type).toBe('paragraph');
        expect(result.current.state.blocks[0].content).toBe('');
    });

    it('adds a block', () => {
        const { result } = renderHook(() => useBlockReducer());
        const initialBlockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.addBlock(initialBlockId, 'h1', 'New Block');
        });

        expect(result.current.state.blocks).toHaveLength(2);
        expect(result.current.state.blocks[1].type).toBe('h1');
        expect(result.current.state.blocks[1].content).toBe('New Block');
        expect(result.current.state.focusedBlockId).toBe(result.current.state.blocks[1].id);
    });

    it('deletes a block', () => {
        const { result } = renderHook(() => useBlockReducer());

        // Add a second block first
        act(() => {
            result.current.actions.addBlock(result.current.state.blocks[0].id);
        });

        const blockToDeleteId = result.current.state.blocks[1].id;

        act(() => {
            result.current.actions.deleteBlock(blockToDeleteId);
        });

        expect(result.current.state.blocks).toHaveLength(1);
        expect(result.current.state.blocks.find(b => b.id === blockToDeleteId)).toBeUndefined();
    });

    it('prevents deleting the last block', () => {
        const { result } = renderHook(() => useBlockReducer());
        const lastBlockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.deleteBlock(lastBlockId);
        });

        expect(result.current.state.blocks).toHaveLength(1);
        // It might generate a new ID or keep the same, logic says it clears it
        expect(result.current.state.blocks[0].content).toBe('');
    });

    it('updates a block content', () => {
        const { result } = renderHook(() => useBlockReducer());
        const blockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.updateBlock(blockId, 'Updated Content');
        });

        expect(result.current.state.blocks[0].content).toBe('Updated Content');
    });

    it('changes block type', () => {
        const { result } = renderHook(() => useBlockReducer());
        const blockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.changeBlockType(blockId, 'h1');
        });

        expect(result.current.state.blocks[0].type).toBe('h1');
    });

    it('splits a block', () => {
        const { result } = renderHook(() => useBlockReducer());
        const blockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.updateBlock(blockId, 'Hello World');
        });

        act(() => {
            result.current.actions.splitBlock(blockId, 5, 'Hello World'); // Split at "Hello" | " World"
        });

        expect(result.current.state.blocks).toHaveLength(2);
        expect(result.current.state.blocks[0].content).toBe('Hello');
        expect(result.current.state.blocks[1].content).toBe(' World');
    });

    it('moves a block', () => {
        const { result } = renderHook(() => useBlockReducer());
        const firstBlockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.addBlock(firstBlockId, 'paragraph', 'Second Block');
        });

        const secondBlockId = result.current.state.blocks[1].id;

        // Move second block to first position
        act(() => {
            result.current.actions.moveBlock(secondBlockId, 0);
        });

        expect(result.current.state.blocks[0].id).toBe(secondBlockId);
        expect(result.current.state.blocks[1].id).toBe(firstBlockId);
    });

    it('sets indent level for a block', () => {
        const { result } = renderHook(() => useBlockReducer());
        const blockId = result.current.state.blocks[0].id;

        // Change to list type first
        act(() => {
            result.current.actions.changeBlockType(blockId, 'bulleted-list');
        });

        act(() => {
            result.current.actions.setIndentLevel(blockId, 1);
        });

        expect(result.current.state.blocks[0].indentLevel).toBe(1);
    });

    it('clamps indent level to 0-2 range', () => {
        const { result } = renderHook(() => useBlockReducer());
        const blockId = result.current.state.blocks[0].id;

        // Try to set indent level above max
        act(() => {
            result.current.actions.setIndentLevel(blockId, 5);
        });
        expect(result.current.state.blocks[0].indentLevel).toBe(2);

        // Try to set indent level below min
        act(() => {
            result.current.actions.setIndentLevel(blockId, -1);
        });
        expect(result.current.state.blocks[0].indentLevel).toBe(0);
    });

    it('preserves indentLevel when inserting blocks', () => {
        const { result } = renderHook(() => useBlockReducer());
        const firstBlockId = result.current.state.blocks[0].id;

        act(() => {
            result.current.actions.insertBlocks(firstBlockId, [
                { type: 'bulleted-list', content: 'Nested item', indentLevel: 1 },
                { type: 'bulleted-list', content: 'More nested', indentLevel: 2 },
            ]);
        });

        expect(result.current.state.blocks).toHaveLength(3);
        expect(result.current.state.blocks[1].type).toBe('bulleted-list');
        expect(result.current.state.blocks[1].indentLevel).toBe(1);
        expect(result.current.state.blocks[2].indentLevel).toBe(2);
    });
});

