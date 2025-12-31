import { render, screen } from '@testing-library/react';
import BlockEditor from './BlockEditor';

// Mock dependencies
vi.mock('./hooks/useBlockReducer', () => ({
    useBlockReducer: () => ({
        state: {
            blocks: [
                { id: '1', type: 'paragraph', content: 'Block 1' },
                { id: '2', type: 'h1', content: 'Heading 1' },
            ],
            selectedBlockIds: [],
            textSelectionBlockIds: [],
            focusedBlockId: null,
            focusVersion: 0,
            draggedBlockIds: [],
        },
        actions: {
            setFocusedBlock: vi.fn(),
            clearSelection: vi.fn(),
        },
    }),
}));

vi.mock('./Block', () => ({
    default: ({ block }) => <div data-testid={`block-${block.id}`}>{block.content}</div>
}));

vi.mock('./SlashCommandMenu', () => ({
    default: () => <div data-testid="slash-menu">Slash Menu</div>
}));

describe('BlockEditor', () => {
    // Basic render test since interaction is heavy on DOM refs/selection which we mocked or is hard to test in jsdom
    it('renders blocks from state', () => {
        render(<BlockEditor />);

        expect(screen.getByTestId('block-1')).toHaveTextContent('Block 1');
        expect(screen.getByTestId('block-2')).toHaveTextContent('Heading 1');
    });
});
