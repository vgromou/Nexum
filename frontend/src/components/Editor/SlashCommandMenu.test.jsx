import { render, screen, fireEvent } from '@testing-library/react';
import SlashCommandMenu from './SlashCommandMenu';

describe('SlashCommandMenu', () => {
    const defaultProps = {
        position: { top: 100, left: 100 },
        filter: '',
        onSelect: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Element.scrollIntoView is not implemented in JSDOM
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('renders menu items', () => {
        render(<SlashCommandMenu {...defaultProps} />);

        expect(screen.getByText('Normal Text')).toBeInTheDocument();
        expect(screen.getByText('Heading 1')).toBeInTheDocument();
        expect(screen.getByText('Bulleted List')).toBeInTheDocument();
    });

    it('filters items', () => {
        render(<SlashCommandMenu {...defaultProps} filter="Heading" />);

        expect(screen.getByText('Heading 1')).toBeInTheDocument();
        expect(screen.getByText('Heading 2')).toBeInTheDocument();
        expect(screen.queryByText('Bulleted List')).not.toBeInTheDocument();
    });

    it('selects item on click', () => {
        render(<SlashCommandMenu {...defaultProps} />);

        fireEvent.click(screen.getByText('Heading 1'));

        expect(defaultProps.onSelect).toHaveBeenCalledWith('h1');
    });

    it('selects item on Enter key', () => {
        render(<SlashCommandMenu {...defaultProps} />);

        fireEvent.keyDown(document, { key: 'Enter' });

        // First item is selected by default (Normal Text / paragraph)
        expect(defaultProps.onSelect).toHaveBeenCalledWith('paragraph');
    });

    it('shows no results if filter matches nothing', () => {
        render(<SlashCommandMenu {...defaultProps} filter="xyz" />);
        expect(screen.getByText('No results')).toBeInTheDocument();
    });
});
