import { render, screen } from '@testing-library/react';
import PageContent from './PageContent';

// Mock BlockEditor as it's complex and tested separately
vi.mock('../Editor/UnifiedBlockEditor', () => ({
    default: () => <div data-testid="block-editor">Block Editor Content</div>
}));

describe('PageContent', () => {
    it('renders page headers and block editor', () => {
        render(<PageContent />);

        // Breadcrumbs and Title
        expect(screen.getByText('Main')).toBeInTheDocument();
        expect(screen.getAllByText('Page Title')[0]).toBeInTheDocument(); // In breadcrumbs

        // Main Title
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page Title');

        // Block Editor
        expect(screen.getByTestId('block-editor')).toBeInTheDocument();
    });

    it('renders navigation action buttons', () => {
        render(<PageContent />);

        expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
        expect(screen.getByLabelText('Edit page')).toBeInTheDocument();
        expect(screen.getByLabelText('More options')).toBeInTheDocument();
        expect(screen.getByLabelText('Toggle properties panel')).toBeInTheDocument();
    });
});
