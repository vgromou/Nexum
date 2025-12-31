import { render, screen, fireEvent } from '@testing-library/react';
import SpaceHierarchy from './SpaceHierarchy';

describe('SpaceHierarchy', () => {
    it('renders the header and main items', () => {
        render(<SpaceHierarchy />);

        expect(screen.getByText('Space Name')).toBeInTheDocument();
        expect(screen.getByText('Product Specs')).toBeInTheDocument();
        expect(screen.getByText('Design Requirements')).toBeInTheDocument();
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    });

    it('toggles children when an item with children is clicked', () => {
        render(<SpaceHierarchy />);

        // "Product Specs" has children and is open by default (based on code reading)
        const parentItem = screen.getByText('Product Specs');
        const childItem = screen.getByText('V1 Requirements');

        expect(childItem).toBeInTheDocument(); // Initially visible

        // Click to collapse
        fireEvent.click(parentItem);
        expect(childItem).not.toBeInTheDocument();

        // Click to expand again
        fireEvent.click(parentItem);
        expect(screen.getByText('V1 Requirements')).toBeVisible();
    });
});
