import { render, screen, fireEvent } from '@testing-library/react';
import RightSidebar from './RightSidebar';

describe('RightSidebar', () => {
    it('renders all tab buttons', () => {
        render(<RightSidebar />);

        expect(screen.getByLabelText('PROPERTIES')).toBeInTheDocument();
        expect(screen.getByLabelText('COMMENTS')).toBeInTheDocument();
        expect(screen.getByLabelText('LINKS')).toBeInTheDocument();
        expect(screen.getByLabelText('FILES')).toBeInTheDocument();
        expect(screen.getByLabelText('HISTORY')).toBeInTheDocument();
    });

    it('renders properties content by default', () => {
        render(<RightSidebar />);

        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('Author')).toBeInTheDocument();
        expect(screen.getByText('Viktor Gromov')).toBeInTheDocument();
    });

    it('switches tabs when clicked', () => {
        render(<RightSidebar />);

        // Click on Comments tab
        fireEvent.click(screen.getByLabelText('COMMENTS'));
        expect(screen.getByText('No comments yet')).toBeInTheDocument();

        // Click on Links tab
        fireEvent.click(screen.getByLabelText('LINKS'));
        expect(screen.getByText('No links yet')).toBeInTheDocument();

        // Click on Files tab
        fireEvent.click(screen.getByLabelText('FILES'));
        expect(screen.getByText('No files attached')).toBeInTheDocument();

        // Click on History tab
        fireEvent.click(screen.getByLabelText('HISTORY'));
        expect(screen.getByText('No history available')).toBeInTheDocument();

        // Click back to Properties
        fireEvent.click(screen.getByLabelText('PROPERTIES'));
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
        const { container } = render(<RightSidebar />);

        const propertiesTab = screen.getByLabelText('PROPERTIES');
        expect(propertiesTab).toHaveClass('active');

        fireEvent.click(screen.getByLabelText('COMMENTS'));
        expect(propertiesTab).not.toHaveClass('active');
        expect(screen.getByLabelText('COMMENTS')).toHaveClass('active');
    });

    it('has correct structure', () => {
        const { container } = render(<RightSidebar />);

        expect(container.querySelector('.right-sidebar')).toBeInTheDocument();
        expect(container.querySelector('.sidebar-tabs-header')).toBeInTheDocument();
        expect(container.querySelector('.sidebar-tab-content')).toBeInTheDocument();
    });
});
