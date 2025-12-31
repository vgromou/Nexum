import { render, screen, fireEvent } from '@testing-library/react';
import Block from './Block';

describe('Block', () => {
    const defaultBlock = {
        id: 'block-1',
        type: 'paragraph',
        content: 'Hello Block',
    };

    const mockHandlers = {
        onContentChange: vi.fn(),
        onKeyDown: vi.fn(),
        onFocus: vi.fn(),
        onHandleMouseDown: vi.fn(),
        onDragOver: vi.fn(),
        onDrop: vi.fn(),
        onHandleClick: vi.fn(),
    };

    it('renders paragraph block content', () => {
        render(<Block block={defaultBlock} index={0} {...mockHandlers} />);

        // Using getByText might be tricky with contentEditable which sometimes splits text nodes, 
        // but for simple text it usually works or we verify via attribute/tag
        expect(screen.getByText('Hello Block')).toBeInTheDocument();
        expect(screen.getByRole('paragraph')).toBeInTheDocument(); // Tag 'p' for paragraph
    });

    it('renders heading block', () => {
        const headingBlock = { ...defaultBlock, type: 'h1', content: 'Heading Text' };
        render(<Block block={headingBlock} index={0} {...mockHandlers} />);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading Text');
    });

    it('calls onFocus when focused', () => {
        render(<Block block={defaultBlock} index={0} {...mockHandlers} />);

        const contentElement = screen.getByText('Hello Block');
        fireEvent.focus(contentElement);

        expect(mockHandlers.onFocus).toHaveBeenCalledWith(defaultBlock.id);
    });

    // Validating contentEditable input is tricky in jsdom sometimes, 
    // but we can check if onContentChange is wired up via onInput
    it('calls onContentChange on input', () => {
        render(<Block block={defaultBlock} index={0} {...mockHandlers} />);

        const contentElement = screen.getByText('Hello Block');
        contentElement.innerHTML = 'New Text';
        fireEvent.input(contentElement);

        expect(mockHandlers.onContentChange).toHaveBeenCalledWith(defaultBlock.id, 'New Text');
    });
});
